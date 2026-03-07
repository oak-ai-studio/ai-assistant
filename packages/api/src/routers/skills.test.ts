import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { skillsRouter } from './skills';

type SkillFixture = {
  id: string;
  assistantId: string;
  name: string;
  icon: string;
  systemPrompt: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
};

const buildSkill = (overrides: Partial<SkillFixture> = {}): SkillFixture => ({
  id: 'skill-1',
  assistantId: 'assistant-1',
  name: '背单词',
  icon: 'book',
  systemPrompt: 'prompt',
  isActive: true,
  order: 0,
  createdAt: new Date('2026-03-07T00:00:00.000Z'),
  ...overrides,
});

describe('skillsRouter', () => {
  let findMany: ReturnType<typeof vi.fn>;
  let findFirst: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let transaction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findMany = vi.fn();
    findFirst = vi.fn();
    update = vi.fn();
    transaction = vi.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return [];
    });
  });

  const createCaller = () =>
    skillsRouter.createCaller({
      prisma: {
        skill: {
          findMany,
          findFirst,
          update,
        },
        $transaction: transaction,
      },
    } as never);

  it('list returns serialized skills', async () => {
    findMany.mockResolvedValue([buildSkill()]);

    const caller = createCaller();
    const result = await caller.list({ userId: 'user-1' });

    expect(result.skills).toEqual([
      {
        id: 'skill-1',
        name: '背单词',
        icon: 'book',
        systemPrompt: 'prompt',
        isActive: true,
        sortOrder: 0,
        createdAt: '2026-03-07T00:00:00.000Z',
        updatedAt: '2026-03-07T00:00:00.000Z',
      },
    ]);
  });

  it('list works without isActive filter', async () => {
    findMany.mockResolvedValue([buildSkill()]);
    const caller = createCaller();

    await caller.list({ userId: 'user-1' });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        assistant: { userId: 'user-1' },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('get throws not found when skill does not belong to user', async () => {
    findFirst.mockResolvedValue(null);
    const caller = createCaller();

    try {
      await caller.get({ userId: 'user-1', skillId: 'missing' });
      throw new Error('Expected get to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe('NOT_FOUND');
    }
  });

  it('get returns skill when found', async () => {
    findFirst.mockResolvedValue(buildSkill());
    const caller = createCaller();

    const result = await caller.get({ userId: 'user-1', skillId: 'skill-1' });

    expect(result.skill.id).toBe('skill-1');
  });

  it('update returns updated skill', async () => {
    findFirst.mockResolvedValue(buildSkill());
    update.mockResolvedValue(buildSkill({ name: '英语学习', order: 2 }));

    const caller = createCaller();
    const result = await caller.update({
      userId: 'user-1',
      skillId: 'skill-1',
      name: '英语学习',
      sortOrder: 2,
    });

    expect(result.skill.name).toBe('英语学习');
    expect(result.skill.sortOrder).toBe(2);
  });

  it('update throws not found when skill is missing', async () => {
    findFirst.mockResolvedValue(null);
    const caller = createCaller();

    await expect(
      caller.update({
        userId: 'user-1',
        skillId: 'skill-missing',
        name: 'missing',
      })
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('update input requires at least one mutable field', async () => {
    const caller = createCaller();

    await expect(
      caller.update({
        userId: 'user-1',
        skillId: 'skill-1',
      })
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('reorder throws bad request when any skill is invalid', async () => {
    findMany.mockResolvedValue([]);
    const caller = createCaller();

    try {
      await caller.reorder({
        userId: 'user-1',
        skillOrders: [{ skillId: 'invalid', sortOrder: 1 }],
      });
      throw new Error('Expected reorder to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe('BAD_REQUEST');
    }
  });

  it('reorder updates sort order and returns serialized skills', async () => {
    const reordered = [
      buildSkill({ id: 'skill-2', order: 0 }),
      buildSkill({ id: 'skill-1', order: 1 }),
    ];
    findMany.mockResolvedValueOnce(reordered).mockResolvedValueOnce(reordered);

    const caller = createCaller();
    const result = await caller.reorder({
      userId: 'user-1',
      skillOrders: [
        { skillId: 'skill-2', sortOrder: 0 },
        { skillId: 'skill-1', sortOrder: 1 },
      ],
    });

    expect(update).toHaveBeenCalledTimes(2);
    expect(result.skills.map((item) => item.id)).toEqual(['skill-2', 'skill-1']);
  });
});
