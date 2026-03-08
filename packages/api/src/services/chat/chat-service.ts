import type { Prisma, PrismaClient } from '@ai-assistant/db';
import { buildSystemPrompt } from './system-prompt';
import type { ChatLLMProvider, ChatMessage } from '../llm';

const DEFAULT_HISTORY_LIMIT = 20;

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
  prisma: Pick<PrismaClient, 'assistant' | 'skill' | 'conversation' | 'message'>;
  llmProvider: ChatLLMProvider;
}

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

  // TODO(memory retrieval): replace this placeholder with semantic memory retrieval in next PR.
  const memoryPrompt = '';

  const systemPrompt = buildSystemPrompt({
    assistantName: assistant.name,
    globalPersonaPrompt: assistant.systemPrompt,
    memoryPrompt,
    skillPrompt,
    pageContext: input.pageContext,
  });

  const llmReply = await deps.llmProvider.generateReply({
    systemPrompt,
    messages: toLLMMessages(historyMessages),
  });
  const assistantVisibleContent = sanitizeAssistantContent(llmReply.content);

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
      memoryBased: Boolean(memoryPrompt.trim()),
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
