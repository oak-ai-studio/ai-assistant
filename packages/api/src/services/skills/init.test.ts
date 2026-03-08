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
    const now = new Date('2026-03-07T00:00:00.000Z');
    const created = DEFAULT_SKILLS.map((skill) => ({
      id: `id-${skill.id}`,
      userId: 'assistant-1',
      name: skill.name,
      icon: skill.icon,
      systemPrompt: skill.systemPrompt,
      isActive: true,
      sortOrder: skill.sortOrder,
      createdAt: now,
      updatedAt: now,
    }));

    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce(created);
    createMany.mockResolvedValue({ count: DEFAULT_SKILLS.length });

    const result = await initializeDefaultSkillsForAssistant(prisma, 'assistant-1');

    expect(createMany).toHaveBeenCalledTimes(1);
    const createPayload = createMany.mock.calls[0]?.[0];
    expect(createPayload).toBeDefined();
    expect(createPayload.data).toHaveLength(DEFAULT_SKILLS.length);
    expect(createPayload.data[0]).toMatchObject({
      userId: 'assistant-1',
      name: DEFAULT_SKILLS[0]?.name,
      icon: DEFAULT_SKILLS[0]?.icon,
      systemPrompt: DEFAULT_SKILLS[0]?.systemPrompt,
      isActive: true,
      sortOrder: 0,
    });
    expect(result).toEqual(created);
  });

  it('backfills missing defaults when assistant already has partial skills', async () => {
    const now = new Date('2026-03-07T00:00:00.000Z');
    const existing = [
      {
        id: 'skill-1',
        userId: 'assistant-1',
        name: '背单词',
        icon: 'book',
        systemPrompt: 'prompt',
        isActive: true,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];
    const hydrated = [
      ...existing,
      {
        id: 'skill-2',
        userId: 'assistant-1',
        name: '做饭助理',
        icon: 'chef',
        systemPrompt: 'prompt',
        isActive: true,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'skill-3',
        userId: 'assistant-1',
        name: '随便聊聊',
        icon: 'chat',
        systemPrompt: 'prompt',
        isActive: true,
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'skill-4',
        userId: 'assistant-1',
        name: '笔记',
        icon: 'notes',
        systemPrompt: 'prompt',
        isActive: true,
        sortOrder: 3,
        createdAt: now,
        updatedAt: now,
      },
    ];
    findMany.mockResolvedValueOnce(existing).mockResolvedValueOnce(hydrated);
    createMany.mockResolvedValue({ count: DEFAULT_SKILLS.length - 1 });

    const result = await initializeDefaultSkillsForAssistant(prisma, 'assistant-1');

    expect(createMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual(hydrated);
  });
});
