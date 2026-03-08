import { describe, expect, it, vi } from 'vitest';
import {
  calculateContentSimilarity,
  deduplicateAndSaveMemory,
  extractConversationMemories,
  scheduleConversationMemoryExtraction,
} from '../../src/services/memory/extraction';

const now = new Date('2026-03-08T00:00:00.000Z');

function createPrismaMock() {
  return {
    conversation: {
      findFirst: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
    memory: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  };
}

describe('memory extraction service', () => {
  it('extracts memories from conversation and saves into database', async () => {
    const prisma = createPrismaMock();
    const llmProvider = {
      generateReply: vi.fn().mockResolvedValue({
        content: JSON.stringify([
          {
            type: 'preference',
            content: '用户喜欢早上学习英语',
            confidence: 0.91,
          },
          {
            type: 'experience',
            content: '用户上周参加了半程马拉松',
            confidence: 0.82,
          },
        ]),
        provider: 'openai',
        model: 'gpt-4.1-mini',
      }),
    };

    prisma.conversation.findFirst.mockResolvedValue({
      id: 'conversation-1',
      assistant: {
        userId: 'user-1',
      },
    });
    prisma.message.findMany.mockResolvedValue([
      { role: 'user', content: '我最近开始晨读英语。' },
      { role: 'assistant', content: '很好，这个习惯值得坚持。' },
    ]);
    prisma.memory.findMany.mockResolvedValue([]);

    await extractConversationMemories({
      prisma: prisma as never,
      llmProvider,
      conversationId: 'conversation-1',
    });

    expect(prisma.memory.create).toHaveBeenCalledTimes(2);
    expect(prisma.memory.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'preference',
          confidence: 0.91,
        }),
      }),
    );
    expect(prisma.memory.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'experience',
        }),
      }),
    );
  });

  it('returns early when conversation is not found', async () => {
    const prisma = createPrismaMock();
    const llmProvider = {
      generateReply: vi.fn(),
    };
    prisma.conversation.findFirst.mockResolvedValue(null);

    await extractConversationMemories({
      prisma: prisma as never,
      llmProvider: llmProvider as never,
      conversationId: 'conversation-1',
    });

    expect(prisma.message.findMany).not.toHaveBeenCalled();
    expect(llmProvider.generateReply).not.toHaveBeenCalled();
  });

  it('returns early when llm response is not valid json', async () => {
    const prisma = createPrismaMock();
    const llmProvider = {
      generateReply: vi.fn().mockResolvedValue({
        content: 'not-json',
        provider: 'openai',
        model: 'gpt-4.1-mini',
      }),
    };

    prisma.conversation.findFirst.mockResolvedValue({
      id: 'conversation-1',
      assistant: {
        userId: 'user-1',
      },
    });
    prisma.message.findMany.mockResolvedValue([
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好，我在。' },
    ]);

    await extractConversationMemories({
      prisma: prisma as never,
      llmProvider,
      conversationId: 'conversation-1',
    });

    expect(prisma.memory.create).not.toHaveBeenCalled();
    expect(prisma.memory.update).not.toHaveBeenCalled();
  });

  it('merges duplicated memory when similarity is above threshold', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([
      {
        id: 'memory-1',
        content: '用户喜欢每天早晨学英语',
        confidence: 0.78,
        createdAt: now,
      },
    ]);

    await deduplicateAndSaveMemory(prisma as never, 'user-1', {
      type: 'preference',
      content: '用户喜欢每天早上学习英语',
      confidence: 0.92,
    });

    expect(prisma.memory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'memory-1' },
        data: expect.objectContaining({
          type: 'preference',
          confidence: 0.92,
        }),
      }),
    );
    expect(prisma.memory.create).not.toHaveBeenCalled();
  });

  it('creates new memory when similarity is below threshold', async () => {
    const prisma = createPrismaMock();
    prisma.memory.findMany.mockResolvedValue([
      {
        id: 'memory-1',
        content: '用户喜欢晨跑',
        confidence: 0.8,
        createdAt: now,
      },
    ]);

    await deduplicateAndSaveMemory(prisma as never, 'user-1', {
      type: 'preference',
      content: '用户正在学习 Rust 编程',
      confidence: 0.86,
    });

    expect(prisma.memory.create).toHaveBeenCalledTimes(1);
    expect(prisma.memory.update).not.toHaveBeenCalled();
  });

  it('returns high similarity for near-duplicate Chinese sentences', () => {
    const similarity = calculateContentSimilarity('用户喜欢每天早上学习英语', '用户喜欢每天早晨学英语');
    expect(similarity).toBeGreaterThan(0.8);
  });

  it('covers similarity edge cases and async schedule error handling', async () => {
    expect(calculateContentSimilarity('', '用户喜欢英语')).toBe(0);
    expect(calculateContentSimilarity('same', 'same')).toBe(1);

    const prisma = createPrismaMock();
    prisma.conversation.findFirst.mockResolvedValue({
      id: 'conversation-1',
      assistant: { userId: 'user-1' },
    });
    prisma.message.findMany.mockResolvedValue([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);

    const llmProvider = {
      generateReply: vi.fn().mockRejectedValue(new Error('llm failed')),
    };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    scheduleConversationMemoryExtraction({
      prisma: prisma as never,
      llmProvider,
      conversationId: 'conversation-1',
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
