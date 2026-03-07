import { TRPCError } from '@trpc/server';
import { describe, expect, it, vi } from 'vitest';
import { memoryRouter } from '../../src/routers/memory';

const now = new Date('2026-03-07T12:00:00.000Z');

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

const createCaller = (prisma: ReturnType<typeof createPrismaMock>) => {
  return memoryRouter.createCaller({ prisma } as never);
};

describe('memory router', () => {
  it('supports list endpoint with default pagination', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([]);
    prisma.memory.count.mockResolvedValue(0);
    const caller = createCaller(prisma);

    const result = await caller.list({ userId: 'user-1' });

    expect(result).toEqual({ memories: [], total: 0 });
    expect(prisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        skip: 0,
      }),
    );
  });

  it('supports create endpoint', async () => {
    const prisma = createPrismaMock();
    prisma.memory.create.mockResolvedValue({
      id: 'memory-1',
      userId: 'user-1',
      content: '用户喜欢通过例句学单词',
      type: 'preference',
      confidence: 0.8,
      isUserEdited: false,
      createdAt: now,
      updatedAt: now,
      skill: null,
    });
    const caller = createCaller(prisma);

    const result = await caller.create({
      userId: 'user-1',
      content: '用户喜欢通过例句学单词',
      type: 'preference',
    });

    expect(result.type).toBe('preference');
    expect(result.skillSource).toBeNull();
  });

  it('rejects update without mutable fields', async () => {
    const prisma = createPrismaMock();
    const caller = createCaller(prisma);

    await expect(caller.update({ id: 'memory-1', userId: 'user-1' })).rejects.toThrowError();
  });

  it('supports update and delete endpoints with ownership check', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findUnique.mockResolvedValue({
      id: 'memory-1',
      userId: 'user-1',
      content: '原内容',
      type: 'fact',
      confidence: 0.8,
      isUserEdited: false,
      createdAt: now,
      updatedAt: now,
      skill: null,
    });
    prisma.memory.update.mockResolvedValue({
      id: 'memory-1',
      userId: 'user-1',
      content: '新内容',
      type: 'fact',
      confidence: 0.8,
      isUserEdited: true,
      createdAt: now,
      updatedAt: now,
      skill: null,
    });
    prisma.memory.deleteMany.mockResolvedValue({ count: 1 });
    const caller = createCaller(prisma);

    const updated = await caller.update({
      id: 'memory-1',
      userId: 'user-1',
      content: '新内容',
    });
    const deleted = await caller.delete({
      id: 'memory-1',
      userId: 'user-1',
    });

    expect(updated.content).toBe('新内容');
    expect(deleted).toEqual({ success: true });
  });

  it('supports search endpoint and filters by confidence threshold', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([
      {
        id: 'memory-1',
        content: '用户喜欢通过例句学单词',
        type: 'preference',
        confidence: 0.9,
        createdAt: now,
        skill: null,
      },
    ]);
    const caller = createCaller(prisma);

    const result = await caller.search({
      userId: 'user-1',
      query: '单词',
    });

    expect(result.memories).toHaveLength(1);
    expect(prisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          confidence: { gte: 0.6 },
        }),
        take: 10,
      }),
    );
  });

  it('returns not found for unauthorized delete', async () => {
    const prisma = createPrismaMock();
    prisma.memory.deleteMany.mockResolvedValue({ count: 0 });
    const caller = createCaller(prisma);

    await expect(caller.delete({ id: 'memory-1', userId: 'user-1' })).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'NOT_FOUND',
    });
  });
});
