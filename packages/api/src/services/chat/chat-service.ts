import type { Prisma, PrismaClient } from '@ai-assistant/db';
import { buildSystemPrompt } from './system-prompt';
import type { ChatLLMProvider, ChatMessage } from '../llm';

const DEFAULT_HISTORY_LIMIT = 20;
const DEFAULT_MEMORY_RECALL_MAX_ITEMS = 5;
const DEFAULT_MEMORY_RECALL_MIN_CONFIDENCE = 0.7;
const MEMORY_RECALL_CANDIDATE_POOL_SIZE = 80;

export type ChatServiceErrorCode = 'ASSISTANT_NOT_FOUND' | 'CONVERSATION_NOT_FOUND';

export class ChatServiceError extends Error {
  readonly code: ChatServiceErrorCode;

  constructor(code: ChatServiceErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ChatServiceError';
    this.code = code;
  }
}

interface ChatServiceDependencies {
  prisma: Pick<PrismaClient, 'assistant' | 'skill' | 'conversation' | 'message' | 'memory'>;
  llmProvider: ChatLLMProvider;
}

type RecalledMemory = {
  id: string;
  type: string;
  content: string;
  confidence: number;
  skillSource: string | null;
};

export interface SendChatMessageInput {
  userId: string;
  assistantId: string;
  conversationId?: string;
  skillId?: string;
  message: string;
  pageContext?: Record<string, unknown>;
  historyLimit?: number;
}

export interface GetConversationInput {
  userId: string;
  assistantId: string;
  conversationId: string;
  limit?: number;
}

export async function sendChatMessage(
  deps: ChatServiceDependencies,
  input: SendChatMessageInput,
): Promise<{
  conversationId: string;
  userMessage: { id: string; role: string; content: string; createdAt: Date };
  assistantMessage: { id: string; role: string; content: string; createdAt: Date; memoryBased: boolean };
  provider: string;
  model: string;
}> {
  const assistant = await deps.prisma.assistant.findFirst({
    where: {
      id: input.assistantId,
      userId: input.userId,
    },
    select: {
      id: true,
      name: true,
      systemPrompt: true,
    },
  });

  if (!assistant) {
    throw new ChatServiceError('ASSISTANT_NOT_FOUND', 'Assistant does not exist or does not belong to this user.');
  }

  const conversationId = await getOrCreateConversationId(deps.prisma, {
    userId: input.userId,
    conversationId: input.conversationId,
    firstUserMessage: input.message,
  });

  const userMessage = await deps.prisma.message.create({
    data: {
      conversationId,
      role: 'user',
      content: input.message,
      ...(input.pageContext === undefined
        ? {}
        : { pageContext: input.pageContext as Prisma.InputJsonValue }),
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  await persistExplicitMemoryFromUserMessage(deps.prisma, {
    userId: input.userId,
    message: input.message,
  });

  const historyMessages = await deps.prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: input.historyLimit ?? DEFAULT_HISTORY_LIMIT,
    select: {
      role: true,
      content: true,
    },
  });

  const skillPrompt = await getSkillPrompt(deps.prisma, {
    userId: input.userId,
    skillId: input.skillId,
  });

  const recallQuery = buildRecallQuery(input.message, historyMessages);
  const memoryContext = await buildMemoryPrompt(deps.prisma, {
    userId: input.userId,
    query: recallQuery,
  });

  const systemPrompt = buildSystemPrompt({
    assistantName: assistant.name,
    globalPersonaPrompt: assistant.systemPrompt,
    memoryPrompt: memoryContext.prompt,
    skillPrompt,
    pageContext: input.pageContext,
  });

  let llmReply = await deps.llmProvider.generateReply({
    systemPrompt,
    messages: toLLMMessages(historyMessages),
  });

  const firstPassVisibleContent = sanitizeAssistantContent(llmReply.content);
  const shouldRetryWithMemory = shouldRetryMemoryGroundedAnswer({
    query: input.message,
    recalledMemories: memoryContext.memories,
    modelReply: firstPassVisibleContent,
  });

  if (shouldRetryWithMemory) {
    const retryInstruction = buildMemoryRetryInstruction({
      query: input.message,
      recalledMemories: memoryContext.memories,
      previousReply: firstPassVisibleContent,
    });

    try {
      llmReply = await deps.llmProvider.generateReply({
        systemPrompt: `${systemPrompt}\n\n【记忆一致性约束】\n你已经拿到可用的用户记忆。请优先根据记忆直接回答用户问题，不要再说“我不知道”或“我不保存偏好”。如记忆之间存在冲突，简短说明冲突并给出当前最可能答案。`,
        messages: [
          ...toLLMMessages(historyMessages),
          { role: 'assistant', content: firstPassVisibleContent },
          { role: 'user', content: retryInstruction },
        ],
      });
    } catch (error) {
      if (isMemoryDebugEnabled()) {
        console.log('[memory-recall] retry-failed', {
          query: input.message,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  if (isMemoryDebugEnabled()) {
    console.log('[memory-recall] llm-raw-reply', {
      query: input.message,
      recallQuery,
      model: llmReply.model,
      provider: llmReply.provider,
      preview: llmReply.content.slice(0, 300),
      hasMemoryPrompt: memoryContext.prompt.length > 0,
    });
  }

  const assistantVisibleContent = resolveAssistantReplyContent({
    query: input.message,
    llmContent: llmReply.content,
    recalledMemories: memoryContext.memories,
  });

  if (isMemoryDebugEnabled()) {
    console.log('[memory-recall] final-visible-reply', {
      query: input.message,
      preview: assistantVisibleContent.slice(0, 300),
    });
  }

  const assistantMessage = await deps.prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: assistantVisibleContent,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  await deps.prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      endedAt: new Date(),
    },
  });

  return {
    conversationId,
    userMessage,
    assistantMessage: {
      ...assistantMessage,
      memoryBased: Boolean(memoryContext.prompt.trim()),
    },
    provider: llmReply.provider,
    model: llmReply.model,
  };
}

export async function getConversationMessages(
  deps: Pick<ChatServiceDependencies, 'prisma'>,
  input: GetConversationInput,
): Promise<{
  conversationId: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    memoryBased: boolean;
    createdAt: Date;
  }>;
}> {
  const assistant = await deps.prisma.assistant.findFirst({
    where: {
      id: input.assistantId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!assistant) {
    throw new ChatServiceError('ASSISTANT_NOT_FOUND', 'Assistant does not exist or does not belong to this user.');
  }

  const conversation = await deps.prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    throw new ChatServiceError('CONVERSATION_NOT_FOUND', 'Conversation does not exist.');
  }

  const messages = await deps.prisma.message.findMany({
    where: {
      conversationId: conversation.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: input.limit,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return {
    conversationId: conversation.id,
    messages: messages.map((message) => ({
      ...message,
      content: message.role === 'assistant' ? sanitizeAssistantContent(message.content) : message.content,
      memoryBased: false,
    })),
  };
}

async function getOrCreateConversationId(
  prisma: ChatServiceDependencies['prisma'],
  input: {
    userId: string;
    conversationId?: string;
    firstUserMessage: string;
  },
): Promise<string> {
  if (input.conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: input.conversationId,
        userId: input.userId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new ChatServiceError('CONVERSATION_NOT_FOUND', 'Conversation does not exist.');
    }

    return conversation.id;
  }

  const createdConversation = await prisma.conversation.create({
    data: {
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  return createdConversation.id;
}

async function getSkillPrompt(
  prisma: ChatServiceDependencies['prisma'],
  input: { userId: string; skillId?: string },
): Promise<string> {
  if (!input.skillId) {
    return '';
  }

  const skill = await prisma.skill.findFirst({
    where: {
      id: input.skillId,
      userId: input.userId,
      isActive: true,
    },
    select: {
      systemPrompt: true,
    },
  });

  return skill?.systemPrompt ?? '';
}

function toLLMMessages(messages: Array<{ role: string; content: string }>): ChatMessage[] {
  const sortedMessages = [...messages].reverse();

  return sortedMessages.flatMap((message) => {
    if (message.role === 'user' || message.role === 'assistant') {
      return [
        {
          role: message.role,
          content:
            message.role === 'assistant'
              ? sanitizeAssistantContent(message.content)
              : message.content,
        },
      ];
    }

    return [];
  });
}

function sanitizeAssistantContent(content: string): string {
  // Remove hidden chain-of-thought tags if a provider leaks them.
  const withoutThinkBlocks = content
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
    .replace(/<think\b[^>]*>[\s\S]*$/gi, '')
    .trim();

  return withoutThinkBlocks.length > 0 ? withoutThinkBlocks : '抱歉，我刚才没有生成可展示的回复，请再试一次。';
}

async function buildMemoryPrompt(
  prisma: ChatServiceDependencies['prisma'],
  input: { userId: string; query: string },
): Promise<{ prompt: string; memories: RecalledMemory[] }> {
  const recallEnabled = isMemoryRecallEnabled();
  const recallNeeded = shouldRecallMemories(input.query);
  if (!recallEnabled || !recallNeeded) {
    if (isMemoryDebugEnabled()) {
      console.log('[memory-recall] skip', {
        recallEnabled,
        recallNeeded,
        query: input.query,
      });
    }
    return { prompt: '', memories: [] };
  }

  const preferenceIntent = isPreferenceIntentQuery(input.query);
  const memories = await prisma.memory.findMany({
    where: {
      userId: input.userId,
      ...(preferenceIntent ? { type: { in: ['preference', 'habit', 'personality'] } } : {}),
      confidence: {
        gte: getMemoryRecallMinConfidence(),
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: MEMORY_RECALL_CANDIDATE_POOL_SIZE,
    select: {
      id: true,
      type: true,
      content: true,
      confidence: true,
      skillSource: true,
      updatedAt: true,
    },
  });

  if (memories.length === 0) {
    return { prompt: '', memories: [] };
  }

  const queryTokens = tokenizeForRecall(input.query);
  const scored = memories
    .map((memory: (typeof memories)[number]) => ({
      memory,
      score: scoreMemoryForQuery(queryTokens, memory),
    }))
    .filter((item: { score: number }) => item.score > 0)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, getMemoryRecallMaxItems());

  if (scored.length === 0) {
    if (isMemoryDebugEnabled()) {
      console.log('[memory-recall] no-scored-memories', {
        query: input.query,
        candidateCount: memories.length,
      });
    }
    return { prompt: '', memories: [] };
  }

  const lines = scored.map(({ memory }: { memory: (typeof memories)[number] }) => {
    const skillPart = memory.skillSource ? ` | skill=${memory.skillSource}` : '';
    const compactContent = memory.content.replace(/\s+/g, ' ').slice(0, 180);
    return `- [${memory.id}] type=${memory.type} | confidence=${memory.confidence.toFixed(2)}${skillPart} | ${compactContent}`;
  });

  const selectedMemories = scored.map(({ memory }) => memory);

  const prompt = [
    '以下是与当前对话可能相关的用户记忆；仅在相关时引用，不要编造，不要逐条复述给用户：',
    ...lines,
  ].join('\n');

  if (isMemoryDebugEnabled()) {
    console.log('[memory-recall] selected', {
      query: input.query,
      candidateCount: memories.length,
      selectedCount: scored.length,
      promptPreview: prompt.slice(0, 500),
    });
  }

  return {
    prompt,
    memories: selectedMemories,
  };
}

function shouldRecallMemories(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) {
    return false;
  }

  const strongSignals =
    /(我|我的|我想|我不想|我喜欢|我不喜欢|我通常|我总是|偏好|习惯|上次|之前|记得|适合我|根据我|my|i\s|me\s|for me|based on my)/i;

  if (strongSignals.test(normalized)) {
    return true;
  }

  const followupSignals = /(呢|那|这个|那个|它|她|他|刚才|刚刚)/i;
  if (followupSignals.test(normalized)) {
    return true;
  }

  const recommendationSignals = /(推荐|建议|怎么做|如何|plan|suggest|recommend)/i;
  return recommendationSignals.test(normalized);
}

function isPreferenceIntentQuery(query: string): boolean {
  return /(喜欢|爱吃|不喜欢|偏好|口味|饮食|忌口|吃什么|能吃什么|我爱吃)/i.test(query);
}

function scoreMemoryForQuery(
  queryTokens: string[],
  memory: { content: string; type: string; confidence: number; updatedAt: Date },
): number {
  const contentTokens = tokenizeForRecall(memory.content);
  if (contentTokens.length === 0) {
    return 0;
  }

  const overlap = computeTokenOverlap(queryTokens, contentTokens);
  const textSimilarity = computeTextSimilarity(queryTokens.join(' '), memory.content);
  const typeBoost =
    memory.type === 'preference' || memory.type === 'habit' || memory.type === 'personality' ? 0.15 : 0;
  const confidenceScore = Math.min(1, Math.max(0, memory.confidence));
  const freshnessScore = 1 / (1 + Math.max(0, (Date.now() - memory.updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  return overlap * 0.35 + textSimilarity * 0.35 + confidenceScore * 0.2 + freshnessScore * 0.05 + typeBoost;
}

function computeTokenOverlap(queryTokens: string[], contentTokens: string[]): number {
  if (queryTokens.length === 0 || contentTokens.length === 0) {
    return 0;
  }

  const contentSet = new Set(contentTokens);
  const matched = queryTokens.filter((token) => contentSet.has(token)).length;
  return matched / queryTokens.length;
}

function tokenizeForRecall(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .trim();

  const wordTokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  const compact = normalized.replace(/\s+/g, '');
  const bigrams = toBigrams(compact);

  return [...wordTokens, ...bigrams];
}

function computeTextSimilarity(left: string, right: string): number {
  const leftCompact = left.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const rightCompact = right.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  if (!leftCompact || !rightCompact) {
    return 0;
  }

  if (leftCompact === rightCompact) {
    return 1;
  }

  const leftBigrams = toBigrams(leftCompact);
  const rightBigrams = toBigrams(rightCompact);
  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  const rightSet = new Set(rightBigrams);
  const overlap = leftBigrams.filter((token) => rightSet.has(token)).length;
  return overlap / leftBigrams.length;
}

function toBigrams(value: string): string[] {
  if (value.length < 2) {
    return value ? [value] : [];
  }

  const result: string[] = [];
  for (let i = 0; i < value.length - 1; i += 1) {
    result.push(value.slice(i, i + 2));
  }
  return result;
}

function isMemoryRecallEnabled(): boolean {
  const value = (process.env.MEMORY_RECALL_ENABLED ?? 'true').toLowerCase();
  return value !== 'false' && value !== '0' && value !== 'off';
}

function isMemoryDebugEnabled(): boolean {
  const value = (process.env.MEMORY_DEBUG_LOGS ?? 'true').toLowerCase();
  return value !== 'false' && value !== '0' && value !== 'off';
}

function resolveAssistantReplyContent(input: {
  query: string;
  llmContent: string;
  recalledMemories: RecalledMemory[];
}): string {
  return sanitizeAssistantContent(input.llmContent);
}

function shouldRetryMemoryGroundedAnswer(input: {
  query: string;
  recalledMemories: RecalledMemory[];
  modelReply: string;
}): boolean {
  if (input.recalledMemories.length === 0) {
    return false;
  }

  const likelyMemoryQuestion =
    isPreferenceIntentQuery(input.query) || isFactMemoryIntentQuery(input.query) || isLikelyFollowupQuery(input.query);
  if (!likelyMemoryQuestion) {
    return false;
  }

  if (looksUncertainReply(input.modelReply)) {
    return true;
  }

  return !referencesRecalledMemory(input.modelReply, input.recalledMemories);
}

function looksUncertainReply(content: string): boolean {
  return /(不知道|不清楚|不确定|无法确定|没有记录|没有信息|记不清|不太清楚|暂时无法|不了解|尚不了解|还不了解|我还不知道|我不保存|除非你告诉我)/i.test(
    content,
  );
}

function isLikelyFollowupQuery(query: string): boolean {
  const normalized = query.trim();
  if (normalized.length === 0) {
    return false;
  }

  return normalized.length <= 10 || /(呢|那|这个|那个|它|她|他)/.test(normalized);
}

function isFactMemoryIntentQuery(query: string): boolean {
  return /(年龄|几岁|多大|生日|出生|哪年|属相|星座|家乡|哪里人|住哪|住在哪里|职业|工作|学校|联系方式|电话|邮箱)/i.test(
    query,
  );
}

function referencesRecalledMemory(reply: string, memories: RecalledMemory[]): boolean {
  if (reply.trim().length === 0) {
    return false;
  }

  return memories.some((memory) => computeTextSimilarity(reply, memory.content) >= 0.18);
}

function buildMemoryRetryInstruction(input: {
  query: string;
  recalledMemories: RecalledMemory[];
  previousReply: string;
}): string {
  const memoryLines = input.recalledMemories
    .slice(0, 5)
    .map(
      (memory) =>
        `- type=${memory.type}; confidence=${memory.confidence.toFixed(2)}; content=${memory.content.replace(/\s+/g, ' ')}`,
    )
    .join('\n');

  return [
    `用户问题：${input.query}`,
    `你上一版回答：${input.previousReply}`,
    '请根据下面的用户记忆证据重新回答。',
    '要求：1) 优先使用证据；2) 不要说“我不知道/我不保存偏好”；3) 答案自然简洁，不要逐条复述全部证据。',
    '用户记忆证据：',
    memoryLines,
  ].join('\n');
}

function buildRecallQuery(
  currentQuery: string,
  historyMessages: Array<{ role: string; content: string }>,
): string {
  const current = currentQuery.trim();
  if (current.length === 0) {
    return currentQuery;
  }

  const isShortFollowup = current.length <= 8 || /(呢|那|这个|那个|它|她|他)/.test(current);
  if (!isShortFollowup) {
    return current;
  }

  const previousUserMessage = historyMessages
    .filter((message) => message.role === 'user')
    .map((message) => message.content.trim())
    .find((content) => content.length > 0 && content !== current);

  if (!previousUserMessage) {
    return current;
  }

  return `${current} ${previousUserMessage}`.trim();
}

async function persistExplicitMemoryFromUserMessage(
  prisma: ChatServiceDependencies['prisma'],
  input: { userId: string; message: string },
): Promise<void> {
  const extracted = extractExplicitMemoryInstruction(input.message);
  if (!extracted) {
    return;
  }

  const existing = await prisma.memory.findFirst({
    where: {
      userId: input.userId,
      type: extracted.type,
      content: extracted.content,
    },
    select: {
      id: true,
      confidence: true,
    },
  });

  if (existing) {
    await prisma.memory.update({
      where: { id: existing.id },
      data: {
        confidence: Math.max(existing.confidence, extracted.confidence),
      },
    });
    return;
  }

  await prisma.memory.create({
    data: {
      userId: input.userId,
      type: extracted.type,
      content: extracted.content,
      confidence: extracted.confidence,
      skillSource: 'explicit-memory',
    },
  });

  if (isMemoryDebugEnabled()) {
    console.log('[memory-recall] explicit-memory-saved', {
      userId: input.userId,
      type: extracted.type,
      content: extracted.content,
    });
  }
}

function extractExplicitMemoryInstruction(
  message: string,
): { content: string; type: 'preference' | 'fact'; confidence: number } | null {
  const normalized = message.trim();
  if (!normalized) {
    return null;
  }

  const trigger = /(请)?(你)?(帮我)?(记住|记一下|记下|记得)(.+)$/i;
  const matched = normalized.match(trigger);
  if (!matched) {
    return null;
  }

  const raw = matched[5]?.trim();
  if (!raw || raw.length < 2) {
    return null;
  }

  const content = normalizeExplicitMemoryContent(raw);
  const type: 'preference' | 'fact' = /(喜欢|爱吃|偏好|习惯|常常|总是)/i.test(content)
    ? 'preference'
    : 'fact';

  return {
    content,
    type,
    confidence: 0.95,
  };
}

function normalizeExplicitMemoryContent(raw: string): string {
  const compact = raw.replace(/[。！!？?]+$/g, '').trim();
  if (/^我/.test(compact)) {
    return compact;
  }
  if (/^我的/.test(compact)) {
    return `我${compact.slice(1)}`;
  }
  if (/^年龄\d+岁?$/.test(compact)) {
    return `我的${compact}`;
  }
  return `我${compact}`;
}

function getMemoryRecallMaxItems(): number {
  const parsed = Number(process.env.MEMORY_RECALL_MAX_ITEMS ?? DEFAULT_MEMORY_RECALL_MAX_ITEMS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MEMORY_RECALL_MAX_ITEMS;
  }
  return Math.min(12, Math.max(1, Math.floor(parsed)));
}

function getMemoryRecallMinConfidence(): number {
  const parsed = Number(process.env.MEMORY_RECALL_MIN_CONFIDENCE ?? DEFAULT_MEMORY_RECALL_MIN_CONFIDENCE);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_MEMORY_RECALL_MIN_CONFIDENCE;
  }
  return Math.min(1, Math.max(0, parsed));
}
