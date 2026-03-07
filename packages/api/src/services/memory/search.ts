import type { PrismaClient } from '@ai-assistant/db';
import type { MemoryType } from '@ai-assistant/shared';
import { MIN_CONFIDENCE_THRESHOLD } from './constants';

type MemoryServicePrisma = Pick<PrismaClient, 'memory'>;

interface MemoryWithSkill {
  id: string;
  content: string;
  type: string;
  confidence: number;
  createdAt: Date;
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
}

const toSearchMemoryItem = (memory: MemoryWithSkill): SearchMemoryItem => {
  return {
    id: memory.id,
    content: memory.content,
    type: memory.type as MemoryType,
    skillSource: memory.skill?.name ?? null,
    confidence: memory.confidence,
    createdAt: memory.createdAt.toISOString(),
  };
};

export const searchMemories = async (
  prisma: MemoryServicePrisma,
  userId: string,
  query: string,
  limit: number,
): Promise<SearchMemoryItem[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  // TODO: 后续引入 QMD 语义检索
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      confidence: {
        gte: MIN_CONFIDENCE_THRESHOLD,
      },
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
    take: limit,
  });

  return memories.map(toSearchMemoryItem);
};
