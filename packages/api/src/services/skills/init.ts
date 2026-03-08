import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@ai-assistant/db';
import { DEFAULT_SKILLS } from './default-skills';
import type { SkillRecord } from './crud';

type SkillDelegate = PrismaClient['skill'];

export interface SkillsInitPrisma {
  skill: Pick<SkillDelegate, 'findMany' | 'createMany'>;
}

const DEFAULT_ORDER_BY = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

export const initializeDefaultSkillsForAssistant = async (
  prisma: SkillsInitPrisma,
  userId: string
): Promise<SkillRecord[]> => {
  const existingSkills = await prisma.skill.findMany({
    where: { userId },
    orderBy: DEFAULT_ORDER_BY,
  });

  if (existingSkills.length > 0) {
    const existingSkillNames = new Set(existingSkills.map((skill) => skill.name));
    const missingDefaults = DEFAULT_SKILLS.filter((skill) => !existingSkillNames.has(skill.name));

    if (missingDefaults.length === 0) {
      return existingSkills;
    }

    const maxSortOrder = existingSkills.reduce(
      (max, skill) => Math.max(max, skill.sortOrder),
      -1
    );

    await prisma.skill.createMany({
      data: missingDefaults.map((skill, index) => ({
        id: randomUUID(),
        userId,
        name: skill.name,
        icon: skill.icon,
        systemPrompt: skill.systemPrompt,
        isActive: true,
        sortOrder: maxSortOrder + index + 1,
      })),
    });

    return prisma.skill.findMany({
      where: { userId },
      orderBy: DEFAULT_ORDER_BY,
    });
  }

  await prisma.skill.createMany({
    data: DEFAULT_SKILLS.map((skill) => ({
      id: randomUUID(),
      userId,
      name: skill.name,
      icon: skill.icon,
      systemPrompt: skill.systemPrompt,
      isActive: true,
      sortOrder: skill.sortOrder,
    })),
  });

  return prisma.skill.findMany({
    where: { userId },
    orderBy: DEFAULT_ORDER_BY,
  });
};
