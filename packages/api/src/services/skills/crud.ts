import type { PrismaClient } from '@ai-assistant/db';

export type SkillRecord = {
  id: string;
  assistantId: string;
  name: string;
  icon: string;
  systemPrompt: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
};

export type UpdateSkillInput = {
  userId: string;
  skillId: string;
  name?: string;
  icon?: string;
  systemPrompt?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ReorderSkillsInput = {
  userId: string;
  skillOrders: Array<{
    skillId: string;
    sortOrder: number;
  }>;
};

type SkillDelegate = PrismaClient['skill'];

export interface SkillsCrudPrisma {
  skill: Pick<SkillDelegate, 'findMany' | 'findFirst' | 'update'>;
  $transaction: PrismaClient['$transaction'];
}

export const listSkillsForUser = async (
  prisma: SkillsCrudPrisma,
  input: { userId: string; isActive?: boolean }
): Promise<SkillRecord[]> => {
  return prisma.skill.findMany({
    where: {
      assistant: {
        userId: input.userId,
      },
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
};

export const getSkillForUser = async (
  prisma: SkillsCrudPrisma,
  input: { userId: string; skillId: string }
): Promise<SkillRecord | null> => {
  return prisma.skill.findFirst({
    where: {
      id: input.skillId,
      assistant: {
        userId: input.userId,
      },
    },
  });
};

export const updateSkillForUser = async (
  prisma: SkillsCrudPrisma,
  input: UpdateSkillInput
): Promise<SkillRecord | null> => {
  const skill = await getSkillForUser(prisma, {
    userId: input.userId,
    skillId: input.skillId,
  });

  if (!skill) {
    return null;
  }

  const data: {
    name?: string;
    icon?: string;
    systemPrompt?: string;
    isActive?: boolean;
    order?: number;
  } = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.icon !== undefined) {
    data.icon = input.icon;
  }

  if (input.systemPrompt !== undefined) {
    data.systemPrompt = input.systemPrompt;
  }

  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  if (input.sortOrder !== undefined) {
    data.order = input.sortOrder;
  }

  return prisma.skill.update({
    where: { id: skill.id },
    data,
  });
};

export const reorderSkillsForUser = async (
  prisma: SkillsCrudPrisma,
  input: ReorderSkillsInput
): Promise<SkillRecord[] | null> => {
  if (input.skillOrders.length === 0) {
    return [];
  }

  const skillIds = input.skillOrders.map((item) => item.skillId);

  const existingSkills = await prisma.skill.findMany({
    where: {
      id: {
        in: skillIds,
      },
      assistant: {
        userId: input.userId,
      },
    },
  });

  if (existingSkills.length !== skillIds.length) {
    return null;
  }

  await prisma.$transaction(
    input.skillOrders.map((item) =>
      prisma.skill.update({
        where: { id: item.skillId },
        data: { order: item.sortOrder },
      })
    )
  );

  return listSkillsForUser(prisma, { userId: input.userId });
};
