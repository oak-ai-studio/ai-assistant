import type { PrismaClient } from '@ai-assistant/db';
import type { MemoryType } from '@ai-assistant/shared';
import OpenAI from 'openai';
import { MIN_CONFIDENCE_THRESHOLD } from './constants';

type MemoryServicePrisma = Pick<PrismaClient, 'memory'>;

interface MemoryWithSkill {
  id: string;
  content: string;
  type: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  skill: {
    name: string;
  } | null;
}

export interface SearchMemoryItem {
  id: string;
  content: string;
  type: MemoryType;
  skillSource: string | null;
  confidence: number;
  createdAt: string;
  similarity?: number;
}

export interface SearchMemoriesInput {
  userId: string;
  query: string;
  limit: number;
  offset?: number;
  type?: MemoryType;
  minConfidence?: number;
  semantic?: boolean;
}

export interface MemoryEmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

interface SearchMemoriesOptions {
  embeddingProvider?: MemoryEmbeddingProvider | null;
}

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

const toSearchMemoryItem = (memory: MemoryWithSkill, similarity?: number): SearchMemoryItem => {
  return {
    id: memory.id,
    content: memory.content,
    type: memory.type as MemoryType,
    skillSource: memory.skill?.name ?? null,
    confidence: memory.confidence,
    createdAt: memory.createdAt.toISOString(),
    ...(typeof similarity === 'number' ? { similarity } : {}),
  };
};

class OpenAIMemoryEmbeddingProvider implements MemoryEmbeddingProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: { apiKey: string; model?: string }) {
    this.client = new OpenAI({ apiKey: options.apiKey });
    this.model = options.model ?? DEFAULT_EMBEDDING_MODEL;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });

    return response.data.map((item) => item.embedding);
  }
}

let cachedOpenAIEmbeddingProvider: MemoryEmbeddingProvider | null | undefined;

function createEmbeddingProviderFromEnv(): MemoryEmbeddingProvider | null {
  if (cachedOpenAIEmbeddingProvider !== undefined) {
    return cachedOpenAIEmbeddingProvider;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    cachedOpenAIEmbeddingProvider = null;
    return cachedOpenAIEmbeddingProvider;
  }

  cachedOpenAIEmbeddingProvider = new OpenAIMemoryEmbeddingProvider({ apiKey });
  return cachedOpenAIEmbeddingProvider;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function keywordSearch(
  prisma: MemoryServicePrisma,
  input: SearchMemoriesInput,
): Promise<SearchMemoryItem[]> {
  const normalizedQuery = input.query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const memories: MemoryWithSkill[] = await prisma.memory.findMany({
    where: {
      userId: input.userId,
      confidence: {
        gte: input.minConfidence ?? MIN_CONFIDENCE_THRESHOLD,
      },
      ...(input.type ? { type: input.type } : {}),
      content: {
        contains: normalizedQuery,
        mode: 'insensitive',
      },
    },
    include: {
      skill: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    take: input.limit,
    skip: input.offset ?? 0,
  });

  return memories.map((memory: MemoryWithSkill) => toSearchMemoryItem(memory));
}

export const searchMemories = async (
  prisma: MemoryServicePrisma,
  input: SearchMemoriesInput,
  options?: SearchMemoriesOptions,
): Promise<SearchMemoryItem[]> => {
  const normalizedQuery = input.query.trim();
  if (!normalizedQuery) {
    return [];
  }

  if (!input.semantic) {
    return keywordSearch(prisma, input);
  }

  const embeddingProvider = options?.embeddingProvider ?? createEmbeddingProviderFromEnv();
  if (!embeddingProvider) {
    return keywordSearch(prisma, input);
  }

  const memories: MemoryWithSkill[] = await prisma.memory.findMany({
    where: {
      userId: input.userId,
      confidence: {
        gte: input.minConfidence ?? MIN_CONFIDENCE_THRESHOLD,
      },
      ...(input.type ? { type: input.type } : {}),
    },
    include: {
      skill: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: Math.min(200, Math.max(40, (input.limit + (input.offset ?? 0)) * 6)),
  });

  if (memories.length === 0) {
    return [];
  }

  try {
    const vectors = await embeddingProvider.embed([
      normalizedQuery,
      ...memories.map((memory: MemoryWithSkill) => memory.content),
    ]);
    if (vectors.length !== memories.length + 1) {
      return keywordSearch(prisma, input);
    }

    const queryVector = vectors[0];
    const ranked = memories
      .map((memory, index) => {
        const similarity = cosineSimilarity(queryVector!, vectors[index + 1]!);
        return {
          memory,
          similarity,
        };
      })
      .sort((a, b) => {
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        if (b.memory.confidence !== a.memory.confidence) {
          return b.memory.confidence - a.memory.confidence;
        }
        return b.memory.createdAt.getTime() - a.memory.createdAt.getTime();
      });

    return ranked
      .slice(input.offset ?? 0, (input.offset ?? 0) + input.limit)
      .map((item: { memory: MemoryWithSkill; similarity: number }) =>
        toSearchMemoryItem(item.memory, Number(item.similarity.toFixed(4))),
      );
  } catch {
    return keywordSearch(prisma, input);
  }
};
