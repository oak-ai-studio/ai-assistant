import { describe, expect, it, vi } from 'vitest';
import { searchMemories } from '../../src/services/memory/search';

const now = new Date('2026-03-07T12:00:00.000Z');

const createPrismaMock = () => {
  return {
    memory: {
      findMany: vi.fn(),
    },
  };
};

describe('memory search service', () => {
  it('returns empty array for blank query', async () => {
    const prisma = createPrismaMock();
    const result = await searchMemories(prisma as never, 'user-1', '   ', 10);

    expect(result).toEqual([]);
    expect(prisma.memory.findMany).not.toHaveBeenCalled();
  });

  it('searches with ILIKE-equivalent filter and confidence threshold', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([
      {
        id: 'memory-1',
        content: '用户喜欢通过例句学单词',
        type: 'preference',
        confidence: 0.9,
        createdAt: now,
        skill: { name: 'english_learning' },
      },
    ]);

    const result = await searchMemories(prisma as never, 'user-1', '单词', 5);

    expect(result).toEqual([
      {
        id: 'memory-1',
        content: '用户喜欢通过例句学单词',
        type: 'preference',
        skillSource: 'english_learning',
        confidence: 0.9,
        createdAt: now.toISOString(),
      },
    ]);

    expect(prisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          confidence: { gte: 0.6 },
          content: {
            contains: '单词',
            mode: 'insensitive',
          },
        },
        orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
    );
  });
});
