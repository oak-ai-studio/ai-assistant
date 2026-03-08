import type { PrismaClient } from '@ai-assistant/db';
import type { ChatLLMProvider } from '../llm';
import { MEMORY_DEDUP_SIMILARITY_THRESHOLD } from './constants';

type MemoryExtractionPrisma = Pick<PrismaClient, 'conversation' | 'message' | 'memory'>;

type ExtractedMemoryType =
  | 'preference'
  | 'habit'
  | 'fact'
  | 'weakness'
  | 'progress'
  | 'personality';

interface ExtractedMemoryItem {
  type: ExtractedMemoryType;
  content: string;
  confidence: number;
}

interface ExtractionMemoryRow {
  id: string;
  content: string;
  confidence: number;
  createdAt: Date;
}

interface ConversationMessageRow {
  role: string;
  content: string;
}

interface ScheduleMemoryExtractionInput {
  prisma: MemoryExtractionPrisma;
  llmProvider: ChatLLMProvider;
  conversationId: string;
}

const MAX_MEMORY_CONTENT_LENGTH = 200;
const MAX_EXTRACTED_MEMORIES = 8;

const EXTRACTION_SYSTEM_PROMPT = [
  '你是记忆提取器，只负责从对话中提取“用户画像与长期记忆”。',
  '请严格输出 JSON 数组，不要 Markdown，不要解释。',
  '每条记忆结构：{ "type": "preference|habit|fact|weakness|progress|personality", "content": "string", "confidence": 0-1 }',
  'type 说明：',
  '- preference/habit: 偏好、习惯、长期倾向',
  '- fact: 稳定事实信息',
  '- progress: 用户经历、事件、阶段进展',
  '- weakness/personality: 需要长期记住的弱项或性格特征',
  '过滤规则：忽略一次性寒暄、低价值噪音、AI 自己说的话。',
  `最多输出 ${MAX_EXTRACTED_MEMORIES} 条。`,
].join('\n');

const TYPE_ALIAS_MAP: Record<string, ExtractedMemoryType> = {
  preference: 'preference',
  habit: 'habit',
  fact: 'fact',
  weakness: 'weakness',
  progress: 'progress',
  personality: 'personality',
  experience: 'progress',
  other: 'personality',
  偏好: 'preference',
  喜好: 'preference',
  习惯: 'habit',
  事实: 'fact',
  经验: 'progress',
  经历: 'progress',
  故事: 'progress',
  弱项: 'weakness',
  性格: 'personality',
  其他: 'personality',
};

export function scheduleConversationMemoryExtraction(input: ScheduleMemoryExtractionInput): void {
  queueMicrotask(() => {
    void extractConversationMemories(input).catch((error: unknown) => {
      console.error('[memory extraction] failed:', error);
    });
  });
}

export async function extractConversationMemories(input: ScheduleMemoryExtractionInput): Promise<void> {
  const conversation = await input.prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!conversation?.userId) {
    return;
  }

  const messages: ConversationMessageRow[] = await input.prisma.message.findMany({
    where: {
      conversationId: conversation.id,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 100,
    select: {
      role: true,
      content: true,
    },
  });

  if (messages.length < 2) {
    return;
  }

  const dialogue = messages.map((message: ConversationMessageRow) => `${message.role}: ${message.content}`).join('\n');

  const llmResult = await input.llmProvider.generateReply({
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `请提取记忆：\n${dialogue}`,
      },
    ],
  });

  const extractedMemories = parseExtractedMemories(llmResult.content);
  if (extractedMemories.length === 0) {
    return;
  }

  for (const extracted of extractedMemories) {
    await deduplicateAndSaveMemory(input.prisma, conversation.userId, extracted);
  }
}

export async function deduplicateAndSaveMemory(
  prisma: MemoryExtractionPrisma,
  userId: string,
  memory: ExtractedMemoryItem,
): Promise<void> {
  const existing = await prisma.memory.findMany({
    where: {
      userId,
      type: memory.type,
    },
    select: {
      id: true,
      content: true,
      confidence: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
  });

  let bestMatch: ExtractionMemoryRow | null = null;
  let bestSimilarity = 0;

  for (const candidate of existing) {
    const similarity = calculateContentSimilarity(candidate.content, memory.content);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  if (bestMatch && bestSimilarity > MEMORY_DEDUP_SIMILARITY_THRESHOLD) {
    await prisma.memory.update({
      where: {
        id: bestMatch.id,
      },
      data: {
        content: memory.content,
        type: memory.type,
        confidence: Math.max(bestMatch.confidence, memory.confidence),
      },
    });
    return;
  }

  await prisma.memory.create({
    data: {
      userId,
      type: memory.type,
      content: memory.content,
      confidence: memory.confidence,
    },
  });
}

export function calculateContentSimilarity(left: string, right: string): number {
  const normalizedLeft = normalizeContent(left);
  const normalizedRight = normalizeContent(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const leftBigrams = toBigrams(normalizedLeft);
  const rightBigrams = toBigrams(normalizedRight);

  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  const freq = new Map<string, number>();
  for (const gram of leftBigrams) {
    freq.set(gram, (freq.get(gram) ?? 0) + 1);
  }

  let intersection = 0;
  for (const gram of rightBigrams) {
    const count = freq.get(gram) ?? 0;
    if (count > 0) {
      intersection += 1;
      freq.set(gram, count - 1);
    }
  }

  const diceScore = (2 * intersection) / (leftBigrams.length + rightBigrams.length);
  const editScore = 1 - levenshteinDistance(normalizedLeft, normalizedRight) / Math.max(normalizedLeft.length, normalizedRight.length);

  return Math.max(diceScore, editScore);
}

function toBigrams(value: string): string[] {
  if (value.length < 2) {
    return [value];
  }

  const result: string[] = [];
  for (let index = 0; index < value.length - 1; index += 1) {
    result.push(value.slice(index, index + 2));
  }
  return result;
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row]![0] = row;
  }
  for (let col = 0; col < cols; col += 1) {
    matrix[0]![col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      const deletion = matrix[row - 1]![col]! + 1;
      const insertion = matrix[row]![col - 1]! + 1;
      const substitution = matrix[row - 1]![col - 1]! + cost;
      matrix[row]![col] = Math.min(deletion, insertion, substitution);
    }
  }

  return matrix[rows - 1]![cols - 1]!;
}

function normalizeContent(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .slice(0, 500);
}

function parseExtractedMemories(rawContent: string): ExtractedMemoryItem[] {
  const jsonBlock = extractJsonArray(rawContent);
  if (!jsonBlock) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonBlock);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const unique = new Map<string, ExtractedMemoryItem>();
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }

      const payload = item as {
        type?: unknown;
        content?: unknown;
        confidence?: unknown;
      };

      const type = normalizeType(payload.type);
      const content = typeof payload.content === 'string' ? payload.content.trim().slice(0, MAX_MEMORY_CONTENT_LENGTH) : '';
      const confidence = normalizeConfidence(payload.confidence);

      if (!type || !content) {
        continue;
      }

      const key = `${type}::${content.toLowerCase()}`;
      unique.set(key, {
        type,
        content,
        confidence,
      });
    }

    return Array.from(unique.values()).slice(0, MAX_EXTRACTED_MEMORIES);
  } catch {
    return [];
  }
}

function normalizeType(value: unknown): ExtractedMemoryType | null {
  if (typeof value !== 'string') {
    return null;
  }

  return TYPE_ALIAS_MAP[value.trim().toLowerCase()] ?? TYPE_ALIAS_MAP[value.trim()] ?? null;
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.75;
  }
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function extractJsonArray(rawContent: string): string | null {
  const cleaned = rawContent
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    return cleaned;
  }

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return cleaned.slice(start, end + 1);
}
