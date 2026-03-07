import type { PrismaClient } from '@ai-assistant/db';
import type { MemoryType } from '@ai-assistant/shared';
import { TRPCError } from '@trpc/server';
import { MIN_CONFIDENCE_THRESHOLD } from './constants';

type MemoryServicePrisma = Pick<PrismaClient, 'memory' | 'skill'>;

interface MemoryWithSkill {
  id: string;
  userId: string;
  content: string;
  type: string;
  confidence: number;
  isUserEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  skill: {
    name: string;
  } | null;
}

export interface MemoryDetail {
  id: string;
  content: string;
  type: MemoryType;
  skillSource: string | null;
  confidence: number;
  isUserEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListMemoriesInput {
  userId: string;
  type?: MemoryType;
  skillSource?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

export interface ListMemoriesResult {
  memories: MemoryDetail[];
  total: number;
}

export interface CreateMemoryInput {
  userId: string;
  content: string;
  type: MemoryType;
  skillSource?: string;
  confidence?: number;
}

export interface UpdateMemoryInput {
  id: string;
  userId: string;
  content?: string;
  type?: MemoryType;
  confidence?: number;
}

export interface DeleteMemoryInput {
  id: string;
  userId: string;
}

const toMemoryDetail = (memory: MemoryWithSkill): MemoryDetail => {
  return {
    id: memory.id,
    content: memory.content,
    type: memory.type as MemoryType,
    skillSource: memory.skill?.name ?? null,
    confidence: memory.confidence,
    isUserEdited: memory.isUserEdited,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
  };
};

const buildListWhereClause = (input: ListMemoriesInput) => {
  const createdAt: { gte?: Date; lte?: Date } = {};

  if (input.startDate) {
    createdAt.gte = new Date(input.startDate);
  }

  if (input.endDate) {
    createdAt.lte = new Date(input.endDate);
  }

  return {
    userId: input.userId,
    confidence: { gte: MIN_CONFIDENCE_THRESHOLD },
    ...(input.type ? { type: input.type } : {}),
    ...(input.skillSource ? { skill: { is: { name: input.skillSource } } } : {}),
    ...(input.startDate || input.endDate ? { createdAt } : {}),
  };
};

const findSkillIdBySource = async (
  prisma: MemoryServicePrisma,
  userId: string,
  skillSource?: string,
): Promise<string | null> => {
  if (!skillSource) {
    return null;
  }

  const skill = await prisma.skill.findFirst({
    where: {
      name: skillSource,
      assistant: {
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!skill) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'skillSource does not match any skill under this user',
    });
  }

  return skill.id;
};

export const listMemories = async (
  prisma: MemoryServicePrisma,
  input: ListMemoriesInput,
): Promise<ListMemoriesResult> => {
  const where = buildListWhereClause(input);

  const [memories, total] = await Promise.all([
    prisma.memory.findMany({
      where,
      include: {
        skill: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      skip: input.offset,
    }),
    prisma.memory.count({ where }),
  ]);

  return {
    memories: memories.map(toMemoryDetail),
    total,
  };
};

export const createMemory = async (
  prisma: MemoryServicePrisma,
  input: CreateMemoryInput,
): Promise<MemoryDetail> => {
  const skillId = await findSkillIdBySource(prisma, input.userId, input.skillSource);

  const memory = await prisma.memory.create({
    data: {
      userId: input.userId,
      content: input.content,
      type: input.type,
      confidence: input.confidence ?? 0.8,
      skillId,
    },
    include: {
      skill: {
        select: {
          name: true,
        },
      },
    },
  });

  return toMemoryDetail(memory);
};

export const updateMemory = async (
  prisma: MemoryServicePrisma,
  input: UpdateMemoryInput,
): Promise<MemoryDetail> => {
  const existing = await prisma.memory.findUnique({
    where: { id: input.id },
    include: {
      skill: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!existing || existing.userId !== input.userId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Memory not found',
    });
  }

  const data: {
    content?: string;
    type?: MemoryType;
    confidence?: number;
    isUserEdited?: boolean;
  } = {};

  if (typeof input.content !== 'undefined') {
    data.content = input.content;
  }
  if (typeof input.type !== 'undefined') {
    data.type = input.type;
  }
  if (typeof input.confidence !== 'undefined') {
    data.confidence = input.confidence;
  }

  if (Object.keys(data).length === 0) {
    return toMemoryDetail(existing);
  }

  data.isUserEdited = true;

  const memory = await prisma.memory.update({
    where: { id: input.id },
    data,
    include: {
      skill: {
        select: {
          name: true,
        },
      },
    },
  });

  return toMemoryDetail(memory);
};

export const deleteMemory = async (
  prisma: MemoryServicePrisma,
  input: DeleteMemoryInput,
): Promise<{ success: true }> => {
  const result = await prisma.memory.deleteMany({
    where: {
      id: input.id,
      userId: input.userId,
    },
  });

  if (result.count === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Memory not found',
    });
  }

  return { success: true };
};
