import type { SkillRecord } from './crud';

export * from './crud';
export * from './default-skills';
export * from './init';

export type SkillDto = {
  id: string;
  name: string;
  icon: string;
  systemPrompt: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const toSkillDto = (skill: SkillRecord): SkillDto => {
  return {
    id: skill.id,
    name: skill.name,
    icon: skill.icon,
    systemPrompt: skill.systemPrompt,
    isActive: skill.isActive,
    sortOrder: skill.sortOrder,
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
  };
};
