import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getSkillForUser,
  listSkillsForUser,
  reorderSkillsForUser,
  type SkillRecord,
  updateSkillForUser,
  type SkillsCrudPrisma,
} from './crud';

const buildSkill = (overrides: Partial<SkillRecord> = {}): SkillRecord => ({
  id: 'skill-1',
  userId: 'user-1',
  name: '背单词',
  icon: 'book',
  systemPrompt: 'prompt',
  isActive: true,
  sortOrder: 0,
  createdAt: new Date('2026-03-07T00:00:00.000Z'),
  updatedAt: new Date('2026-03-07T00:00:00.000Z'),
  ...overrides,
});

describe('skills crud service', () => {
  let findMany: ReturnType<typeof vi.fn>;
  let findFirst: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let transaction: ReturnType<typeof vi.fn>;
  let prisma: SkillsCrudPrisma;

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

    prisma = {
      skill: {
        findMany,
        findFirst,
        update,
      },
      $transaction: transaction,
    } as unknown as SkillsCrudPrisma;
  });

  it('lists skills by user and forwards isActive filter', async () => {
    const skills = [buildSkill()];
    findMany.mockResolvedValue(skills);

    const result = await listSkillsForUser(prisma, { userId: 'user-1', isActive: true });

    expect(result).toEqual(skills);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('gets one skill scoped by userId + skillId', async () => {
    const skill = buildSkill();
    findFirst.mockResolvedValue(skill);

    const result = await getSkillForUser(prisma, { userId: 'user-1', skillId: 'skill-1' });

    expect(result).toEqual(skill);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'skill-1',
        userId: 'user-1',
      },
    });
  });

  it('updates provided fields and respects sortOrder', async () => {
    const existing = buildSkill();
    const updatedSkill = buildSkill({ name: '英语学习', sortOrder: 3, isActive: false });
    findFirst.mockResolvedValue(existing);
    update.mockResolvedValue(updatedSkill);

    const result = await updateSkillForUser(prisma, {
      userId: 'user-1',
      skillId: 'skill-1',
      name: '英语学习',
      isActive: false,
      sortOrder: 3,
    });

    expect(result).toEqual(updatedSkill);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'skill-1' },
      data: {
        name: '英语学习',
        isActive: false,
        sortOrder: 3,
      },
    });
  });

  it('returns null when updating a skill that does not belong to the user', async () => {
    findFirst.mockResolvedValue(null);

    const result = await updateSkillForUser(prisma, {
      userId: 'user-2',
      skillId: 'skill-1',
      name: 'new',
    });

    expect(result).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('reorders skills in a transaction and returns sorted result', async () => {
    const first = buildSkill({ id: 'skill-1', sortOrder: 1 });
    const second = buildSkill({ id: 'skill-2', sortOrder: 0 });
    const reordered = [
      buildSkill({ id: 'skill-2', sortOrder: 0 }),
      buildSkill({ id: 'skill-1', sortOrder: 1 }),
    ];

    findMany.mockResolvedValueOnce([first, second]).mockResolvedValueOnce(reordered);

    const result = await reorderSkillsForUser(prisma, {
      userId: 'user-1',
      skillOrders: [
        { skillId: 'skill-1', sortOrder: 1 },
        { skillId: 'skill-2', sortOrder: 0 },
      ],
    });

    expect(result).toEqual(reordered);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 'skill-1' },
      data: { sortOrder: 1 },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'skill-2' },
      data: { sortOrder: 0 },
    });
  });

  it('returns null when reorder payload includes non-owned skills', async () => {
    findMany.mockResolvedValue([]);

    const result = await reorderSkillsForUser(prisma, {
      userId: 'user-1',
      skillOrders: [{ skillId: 'skill-1', sortOrder: 0 }],
    });

    expect(result).toBeNull();
    expect(transaction).not.toHaveBeenCalled();
  });
});
