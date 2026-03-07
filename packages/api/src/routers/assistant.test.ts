import { describe, expect, it, vi } from 'vitest';
import { assistantRouter } from './assistant';

const createdAt = new Date('2026-03-07T00:00:00.000Z');

describe('assistantRouter.create', () => {
  it('creates assistant and initializes default skills', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'user-1' });
    const createAssistant = vi.fn().mockResolvedValue({
      id: 'assistant-1',
      userId: 'user-1',
      name: '小助',
      avatar: 'default',
      systemPrompt: null,
      pushTimeStart: null,
      pushTimeEnd: null,
      createdAt,
    });
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'skill-1',
          assistantId: 'assistant-1',
          name: '背单词',
          icon: 'book',
          systemPrompt: 'p1',
          isActive: true,
          order: 0,
          createdAt,
        },
      ]);
    const createMany = vi.fn().mockResolvedValue({ count: 3 });

    const caller = assistantRouter.createCaller({
      prisma: {
        user: {
          upsert,
        },
        assistant: {
          create: createAssistant,
        },
        skill: {
          findMany,
          createMany,
        },
      },
    } as never);

    const result = await caller.create({
      userId: 'user-1',
      name: '小助',
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(createAssistant).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledTimes(1);
    expect(result.assistant.id).toBe('assistant-1');
    expect(result.skills[0]?.name).toBe('背单词');
  });

  it('passes optional fields when provided and skips init if skills already exist', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'user-1' });
    const createAssistant = vi.fn().mockResolvedValue({
      id: 'assistant-2',
      userId: 'user-1',
      name: '小助',
      avatar: 'chef',
      systemPrompt: 'be strict',
      pushTimeStart: '09:00',
      pushTimeEnd: '22:00',
      createdAt,
    });
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'skill-existing',
        assistantId: 'assistant-2',
        name: '背单词',
        icon: 'book',
        systemPrompt: 'p1',
        isActive: true,
        order: 0,
        createdAt,
      },
    ]);
    const createMany = vi.fn();

    const caller = assistantRouter.createCaller({
      prisma: {
        user: {
          upsert,
        },
        assistant: {
          create: createAssistant,
        },
        skill: {
          findMany,
          createMany,
        },
      },
    } as never);

    const result = await caller.create({
      userId: 'user-1',
      avatar: 'chef',
      systemPrompt: 'be strict',
      pushTimeStart: '09:00',
      pushTimeEnd: '22:00',
    });

    expect(createAssistant).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        avatar: 'chef',
        systemPrompt: 'be strict',
        pushTimeStart: '09:00',
        pushTimeEnd: '22:00',
      },
    });
    expect(createMany).not.toHaveBeenCalled();
    expect(result.skills[0]?.id).toBe('skill-existing');
  });
});
