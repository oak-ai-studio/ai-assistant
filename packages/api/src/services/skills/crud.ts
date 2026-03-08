import type { PrismaClient } from '@ai-assistant/db';

export type SkillRecord = {
  id: string;
  userId: string;
  name: string;
  icon: string;
  systemPrompt: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
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
      userId: input.userId,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
};

export const getSkillForUser = async (
  prisma: SkillsCrudPrisma,
  input: { userId: string; skillId: string }
): Promise<SkillRecord | null> => {
  return prisma.skill.findFirst({
    where: {
      id: input.skillId,
      userId: input.userId,
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
    sortOrder?: number;
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
    data.sortOrder = input.sortOrder;
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
      userId: input.userId,
    },
  });

  if (existingSkills.length !== skillIds.length) {
    return null;
  }

  await prisma.$transaction(
    input.skillOrders.map((item) =>
      prisma.skill.update({
        where: { id: item.skillId },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return listSkillsForUser(prisma, { userId: input.userId });
};
