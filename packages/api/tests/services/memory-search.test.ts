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
    const result = await searchMemories(prisma as never, {
      userId: 'user-1',
      query: '   ',
      limit: 10,
    });

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
        updatedAt: now,
        skill: { name: 'english_learning' },
      },
    ]);

    const result = await searchMemories(prisma as never, {
      userId: 'user-1',
      query: '单词',
      limit: 5,
      minConfidence: 0.7,
      offset: 2,
      type: 'preference',
    });

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
          confidence: { gte: 0.7 },
          type: 'preference',
          content: {
            contains: '单词',
            mode: 'insensitive',
          },
        },
        orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        skip: 2,
      }),
    );
  });

  it('supports semantic search with embeddings and returns similarity score', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([
      {
        id: 'memory-1',
        content: '用户喜欢在早上学习英语',
        type: 'preference',
        confidence: 0.95,
        createdAt: now,
        updatedAt: now,
        skill: null,
      },
      {
        id: 'memory-2',
        content: '用户周末会去骑行',
        type: 'experience',
        confidence: 0.85,
        createdAt: now,
        updatedAt: now,
        skill: null,
      },
    ]);
    const embeddingProvider = {
      embed: vi.fn().mockResolvedValue([
        [1, 0],
        [0.95, 0.1],
        [0.1, 0.9],
      ]),
    };

    const result = await searchMemories(
      prisma as never,
      {
        userId: 'user-1',
        query: '学习习惯',
        limit: 1,
        semantic: true,
      },
      { embeddingProvider },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('memory-1');
    expect(result[0]?.similarity).toBeTypeOf('number');
    expect(embeddingProvider.embed).toHaveBeenCalledTimes(1);
  });

  it('falls back to keyword search when semantic mode has no embedding provider', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([
      {
        id: 'memory-1',
        content: '用户周末喜欢徒步',
        type: 'preference',
        confidence: 0.82,
        createdAt: now,
        updatedAt: now,
        skill: null,
      },
    ]);
    const previousApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await searchMemories(prisma as never, {
      userId: 'user-1',
      query: '徒步',
      limit: 5,
      semantic: true,
    });

    expect(result).toHaveLength(1);
    expect(prisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          content: { contains: '徒步', mode: 'insensitive' },
        }),
      }),
    );

    if (previousApiKey) {
      process.env.OPENAI_API_KEY = previousApiKey;
    }
  });

  it('falls back to keyword search when embedding response length mismatches', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany
      .mockResolvedValueOnce([
        {
          id: 'memory-1',
          content: '用户喜欢骑行',
          type: 'experience',
          confidence: 0.9,
          createdAt: now,
          updatedAt: now,
          skill: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'memory-1',
          content: '用户喜欢骑行',
          type: 'experience',
          confidence: 0.9,
          createdAt: now,
          updatedAt: now,
          skill: null,
        },
      ]);

    const embeddingProvider = {
      embed: vi.fn().mockResolvedValue([[1, 0]]),
    };

    const result = await searchMemories(
      prisma as never,
      {
        userId: 'user-1',
        query: '骑行',
        limit: 5,
        semantic: true,
      },
      { embeddingProvider },
    );

    expect(result).toHaveLength(1);
    expect(prisma.memory.findMany).toHaveBeenCalledTimes(2);
  });

  it('falls back to keyword search when embedding provider throws', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany
      .mockResolvedValueOnce([
        {
          id: 'memory-1',
          content: '用户喜欢番茄钟学习法',
          type: 'fact',
          confidence: 0.88,
          createdAt: now,
          updatedAt: now,
          skill: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'memory-1',
          content: '用户喜欢番茄钟学习法',
          type: 'fact',
          confidence: 0.88,
          createdAt: now,
          updatedAt: now,
          skill: null,
        },
      ]);

    const embeddingProvider = {
      embed: vi.fn().mockRejectedValue(new Error('embedding error')),
    };

    const result = await searchMemories(
      prisma as never,
      {
        userId: 'user-1',
        query: '番茄钟',
        limit: 5,
        semantic: true,
      },
      { embeddingProvider },
    );

    expect(result).toHaveLength(1);
    expect(prisma.memory.findMany).toHaveBeenCalledTimes(2);
  });
});
