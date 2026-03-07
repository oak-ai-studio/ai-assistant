import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemory, deleteMemory, listMemories, updateMemory } from '../../src/services/memory/crud';

const createPrismaMock = () => {
  return {
    memory: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    skill: {
      findFirst: vi.fn(),
    },
  };
};

const now = new Date('2026-03-07T12:00:00.000Z');

const buildMemoryRow = (overrides: Partial<Record<string, unknown>> = {}) => {
  return {
    id: 'memory-1',
    userId: 'user-1',
    content: '用户喜欢通过例句学单词',
    type: 'preference',
    confidence: 0.92,
    isUserEdited: false,
    createdAt: now,
    updatedAt: now,
    skill: { name: 'english_learning' },
    ...overrides,
  };
};

describe('memory crud service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists memories with filters and returns total', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([buildMemoryRow()]);
    prisma.memory.count.mockResolvedValue(1);

    const result = await listMemories(prisma as never, {
      userId: 'user-1',
      type: 'preference',
      skillSource: 'english_learning',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-07T23:59:59.999Z',
      limit: 20,
      offset: 10,
    });

    expect(result.total).toBe(1);
    expect(result.memories[0]).toMatchObject({
      id: 'memory-1',
      type: 'preference',
      skillSource: 'english_learning',
      confidence: 0.92,
    });

    const query = prisma.memory.findMany.mock.calls[0][0];
    expect(query.take).toBe(20);
    expect(query.skip).toBe(10);
    expect(query.where.confidence.gte).toBe(0.6);
    expect(query.where.type).toBe('preference');
    expect(query.where.skill.is.name).toBe('english_learning');
    expect(query.where.createdAt.gte).toBeInstanceOf(Date);
    expect(query.where.createdAt.lte).toBeInstanceOf(Date);
  });

  it('creates memory with resolved skill and default confidence', async () => {
    const prisma = createPrismaMock();
    prisma.skill.findFirst.mockResolvedValue({ id: 'skill-1' });
    prisma.memory.create.mockResolvedValue(buildMemoryRow({ skill: { name: 'english_learning' }, confidence: 0.8 }));

    const result = await createMemory(prisma as never, {
      userId: 'user-1',
      content: '用户喜欢通过例句学单词',
      type: 'preference',
      skillSource: 'english_learning',
    });

    expect(result.confidence).toBe(0.8);
    expect(result.skillSource).toBe('english_learning');
    expect(prisma.memory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          skillId: 'skill-1',
          confidence: 0.8,
        }),
      }),
    );
  });

  it('rejects create when skill source is unknown', async () => {
    const prisma = createPrismaMock();
    prisma.skill.findFirst.mockResolvedValue(null);

    await expect(
      createMemory(prisma as never, {
        userId: 'user-1',
        content: 'x',
        type: 'fact',
        skillSource: 'unknown',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'BAD_REQUEST',
    });
  });

  it('updates memory and marks it user edited', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findUnique.mockResolvedValue(buildMemoryRow());
    prisma.memory.update.mockResolvedValue(buildMemoryRow({ content: '更新后的内容', isUserEdited: true }));

    const result = await updateMemory(prisma as never, {
      id: 'memory-1',
      userId: 'user-1',
      content: '更新后的内容',
    });

    expect(result.content).toBe('更新后的内容');
    expect(result.isUserEdited).toBe(true);
    expect(prisma.memory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: '更新后的内容',
          isUserEdited: true,
        }),
      }),
    );
  });

  it('returns existing memory when update payload is empty', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findUnique.mockResolvedValue(buildMemoryRow({ isUserEdited: false }));

    const result = await updateMemory(prisma as never, {
      id: 'memory-1',
      userId: 'user-1',
    });

    expect(result.id).toBe('memory-1');
    expect(prisma.memory.update).not.toHaveBeenCalled();
  });

  it('throws not found when update target is missing or not owned by user', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(buildMemoryRow({ userId: 'other-user' }));

    await expect(updateMemory(prisma as never, { id: 'memory-1', userId: 'user-1', content: 'x' })).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: 'NOT_FOUND',
    });

    await expect(updateMemory(prisma as never, { id: 'memory-1', userId: 'user-1', content: 'x' })).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: 'NOT_FOUND',
    });
  });

  it('deletes memory and returns success', async () => {
    const prisma = createPrismaMock();
    prisma.memory.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteMemory(prisma as never, {
      id: 'memory-1',
      userId: 'user-1',
    });

    expect(result).toEqual({ success: true });
  });

  it('throws not found when delete target does not exist', async () => {
    const prisma = createPrismaMock();
    prisma.memory.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteMemory(prisma as never, { id: 'memory-1', userId: 'user-1' })).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: 'NOT_FOUND',
    });
  });
});
