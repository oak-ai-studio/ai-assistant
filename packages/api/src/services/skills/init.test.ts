import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SKILLS } from './default-skills';
import { initializeDefaultSkillsForAssistant, type SkillsInitPrisma } from './init';

describe('initializeDefaultSkillsForAssistant', () => {
  let findMany: ReturnType<typeof vi.fn>;
  let createMany: ReturnType<typeof vi.fn>;
  let prisma: SkillsInitPrisma;

  beforeEach(() => {
    findMany = vi.fn();
    createMany = vi.fn();

    prisma = {
      skill: {
        findMany,
        createMany,
      },
    } as unknown as SkillsInitPrisma;
  });

  it('creates default skills when assistant has no skills yet', async () => {
    const created = DEFAULT_SKILLS.map((skill) => ({
      id: `id-${skill.id}`,
      assistantId: 'assistant-1',
      name: skill.name,
      icon: skill.icon,
      systemPrompt: skill.systemPrompt,
      isActive: true,
      order: skill.sortOrder,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
    }));

    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(created);
    createMany.mockResolvedValue({ count: 3 });

    const result = await initializeDefaultSkillsForAssistant(prisma, 'assistant-1');

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledWith({
      data: DEFAULT_SKILLS.map((skill) => ({
        assistantId: 'assistant-1',
        name: skill.name,
        icon: skill.icon,
        systemPrompt: skill.systemPrompt,
        isActive: true,
        order: skill.sortOrder,
      })),
    });
    expect(result).toEqual(created);
  });

  it('does not create defaults when assistant already has skills', async () => {
    const existing = [
      {
        id: 'skill-1',
        assistantId: 'assistant-1',
        name: '背单词',
        icon: 'book',
        systemPrompt: 'prompt',
        isActive: true,
        order: 0,
        createdAt: new Date('2026-03-07T00:00:00.000Z'),
      },
    ];
    findMany.mockResolvedValue(existing);

    const result = await initializeDefaultSkillsForAssistant(prisma, 'assistant-1');

    expect(result).toEqual(existing);
    expect(createMany).not.toHaveBeenCalled();
  });
});
