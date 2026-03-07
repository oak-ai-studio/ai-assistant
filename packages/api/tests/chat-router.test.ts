import { TRPCError } from '@trpc/server';
import { describe, expect, it, vi } from 'vitest';
import { appRouter } from '../src';
import { LLMProviderError } from '../src/services/llm';

function createMockContext() {
  const prisma = {
    assistant: {
      findFirst: vi.fn(),
    },
    skill: {
      findFirst: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const llmProvider = {
    generateReply: vi.fn(),
  };

  return {
    prisma,
    llmProvider,
  };
}

describe('chatRouter', () => {
  it('sendMessage stores user/assistant messages and returns llm reply', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({
      id: 'assistant-1',
      name: '小助',
      systemPrompt: '严格督促我',
    });
    ctx.prisma.conversation.create.mockResolvedValue({ id: 'conversation-1' });
    ctx.prisma.message.create
      .mockResolvedValueOnce({
        id: 'message-user-1',
        role: 'user',
        content: '今天学什么？',
        createdAt: new Date('2026-03-07T10:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'message-assistant-1',
        role: 'assistant',
        content: '先复习昨天错题，再学 5 个新词。',
        createdAt: new Date('2026-03-07T10:00:01.000Z'),
        memoryBased: false,
      });
    ctx.prisma.message.findMany.mockResolvedValue([{ role: 'user', content: '今天学什么？' }]);
    ctx.prisma.skill.findFirst.mockResolvedValue({ systemPrompt: '你是英语学习教练。' });
    ctx.prisma.conversation.update.mockResolvedValue({ id: 'conversation-1' });
    ctx.llmProvider.generateReply.mockResolvedValue({
      content: '先复习昨天错题，再学 5 个新词。',
      provider: 'openai',
      model: 'gpt-4.1-mini',
    });

    const result = await caller.chat.sendMessage({
      userId: 'user-1',
      assistantId: 'assistant-1',
      message: '今天学什么？',
      skillId: 'skill-1',
      pageContext: {
        current_page: 'vocabulary_list',
      },
    });

    expect(result.conversationId).toBe('conversation-1');
    expect(result.assistantMessage.content).toBe('先复习昨天错题，再学 5 个新词。');
    expect(result.provider).toBe('openai');
    expect(ctx.prisma.message.create).toHaveBeenCalledTimes(2);
    expect(ctx.prisma.message.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'assistant',
          memoryBased: false,
        }),
      }),
    );
  });

  it('getConversation returns stored messages in ascending order', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({ id: 'assistant-1' });
    ctx.prisma.conversation.findFirst.mockResolvedValue({ id: 'conversation-1' });
    ctx.prisma.message.findMany.mockResolvedValue([
      {
        id: 'message-user-1',
        role: 'user',
        content: '你好',
        memoryBased: false,
        createdAt: new Date('2026-03-07T10:00:00.000Z'),
      },
      {
        id: 'message-assistant-1',
        role: 'assistant',
        content: '你好，我在。',
        memoryBased: false,
        createdAt: new Date('2026-03-07T10:00:01.000Z'),
      },
    ]);

    const result = await caller.chat.getConversation({
      userId: 'user-1',
      assistantId: 'assistant-1',
      conversationId: 'conversation-1',
    });

    expect(result.conversationId).toBe('conversation-1');
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]?.content).toBe('你好');
  });

  it('maps timeout errors to TRPC TIMEOUT', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({
      id: 'assistant-1',
      name: '小助',
      systemPrompt: null,
    });
    ctx.prisma.conversation.create.mockResolvedValue({ id: 'conversation-1' });
    ctx.prisma.message.create.mockResolvedValue({
      id: 'message-user-1',
      role: 'user',
      content: '你好',
      createdAt: new Date('2026-03-07T10:00:00.000Z'),
    });
    ctx.prisma.message.findMany.mockResolvedValue([{ role: 'user', content: '你好' }]);
    ctx.llmProvider.generateReply.mockRejectedValue(new LLMProviderError('TIMEOUT', 'timeout'));

    const promise = caller.chat.sendMessage({
      userId: 'user-1',
      assistantId: 'assistant-1',
      message: '你好',
    });

    await expect(promise).rejects.toBeInstanceOf(TRPCError);
    await expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('returns NOT_FOUND when assistant is missing', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue(null);

    const promise = caller.chat.sendMessage({
      userId: 'user-1',
      assistantId: 'assistant-1',
      message: '你好',
    });

    await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('maps API errors to BAD_GATEWAY', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({
      id: 'assistant-1',
      name: '小助',
      systemPrompt: null,
    });
    ctx.prisma.conversation.create.mockResolvedValue({ id: 'conversation-1' });
    ctx.prisma.message.create.mockResolvedValue({
      id: 'message-user-1',
      role: 'user',
      content: '你好',
      createdAt: new Date('2026-03-07T10:00:00.000Z'),
    });
    ctx.prisma.message.findMany.mockResolvedValue([{ role: 'user', content: '你好' }]);
    ctx.llmProvider.generateReply.mockRejectedValue(new LLMProviderError('API_ERROR', 'bad gateway'));

    await expect(
      caller.chat.sendMessage({
        userId: 'user-1',
        assistantId: 'assistant-1',
        message: '你好',
      }),
    ).rejects.toMatchObject({ code: 'BAD_GATEWAY' });
  });

  it('maps network errors to SERVICE_UNAVAILABLE', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({
      id: 'assistant-1',
      name: '小助',
      systemPrompt: null,
    });
    ctx.prisma.conversation.create.mockResolvedValue({ id: 'conversation-1' });
    ctx.prisma.message.create.mockResolvedValue({
      id: 'message-user-1',
      role: 'user',
      content: '你好',
      createdAt: new Date('2026-03-07T10:00:00.000Z'),
    });
    ctx.prisma.message.findMany.mockResolvedValue([{ role: 'user', content: '你好' }]);
    ctx.llmProvider.generateReply.mockRejectedValue(new LLMProviderError('NETWORK_ERROR', 'network'));

    await expect(
      caller.chat.sendMessage({
        userId: 'user-1',
        assistantId: 'assistant-1',
        message: '你好',
      }),
    ).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });

  it('maps config errors to INTERNAL_SERVER_ERROR', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({
      id: 'assistant-1',
      name: '小助',
      systemPrompt: null,
    });
    ctx.prisma.conversation.create.mockResolvedValue({ id: 'conversation-1' });
    ctx.prisma.message.create.mockResolvedValue({
      id: 'message-user-1',
      role: 'user',
      content: '你好',
      createdAt: new Date('2026-03-07T10:00:00.000Z'),
    });
    ctx.prisma.message.findMany.mockResolvedValue([{ role: 'user', content: '你好' }]);
    ctx.llmProvider.generateReply.mockRejectedValue(new LLMProviderError('CONFIG_ERROR', 'missing key'));

    await expect(
      caller.chat.sendMessage({
        userId: 'user-1',
        assistantId: 'assistant-1',
        message: '你好',
      }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });

  it('maps unknown errors to INTERNAL_SERVER_ERROR', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({
      id: 'assistant-1',
      name: '小助',
      systemPrompt: null,
    });
    ctx.prisma.conversation.create.mockResolvedValue({ id: 'conversation-1' });
    ctx.prisma.message.create.mockResolvedValue({
      id: 'message-user-1',
      role: 'user',
      content: '你好',
      createdAt: new Date('2026-03-07T10:00:00.000Z'),
    });
    ctx.prisma.message.findMany.mockResolvedValue([{ role: 'user', content: '你好' }]);
    ctx.llmProvider.generateReply.mockRejectedValue(new Error('boom'));

    await expect(
      caller.chat.sendMessage({
        userId: 'user-1',
        assistantId: 'assistant-1',
        message: '你好',
      }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });

  it('returns NOT_FOUND when conversation is missing', async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    ctx.prisma.assistant.findFirst.mockResolvedValue({ id: 'assistant-1' });
    ctx.prisma.conversation.findFirst.mockResolvedValue(null);

    await expect(
      caller.chat.getConversation({
        userId: 'user-1',
        assistantId: 'assistant-1',
        conversationId: 'conversation-1',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
