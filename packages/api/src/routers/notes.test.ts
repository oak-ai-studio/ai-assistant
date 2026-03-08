import { describe, expect, it, vi } from 'vitest';
import { notesRouter } from './notes';

const createdAt = new Date('2026-03-08T00:00:00.000Z');
const updatedAt = new Date('2026-03-08T01:00:00.000Z');

const noteRecord = {
  id: 'note-1',
  userId: 'user-1',
  title: '想法记录',
  content: '今天想到一个点子',
  createdAt,
  updatedAt,
};

describe('notesRouter.list', () => {
  it('returns notes list and total', async () => {
    const findMany = vi.fn().mockResolvedValue([noteRecord]);
    const count = vi.fn().mockResolvedValue(1);

    const caller = notesRouter.createCaller({
      prisma: {
        note: {
          findMany,
          count,
        },
      },
    } as never);

    const result = await caller.list({
      userId: 'user-1',
      limit: 50,
      offset: 0,
      sortOrder: 'desc',
    });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(1);
    expect(result.notes[0]?.id).toBe('note-1');
    expect(result.notes[0]?.createdAt).toBe(createdAt.toISOString());
  });
});

describe('notesRouter.getById', () => {
  it('returns note detail', async () => {
    const findFirst = vi.fn().mockResolvedValue(noteRecord);

    const caller = notesRouter.createCaller({
      prisma: {
        note: {
          findFirst,
        },
      },
    } as never);

    const result = await caller.getById({
      userId: 'user-1',
      id: 'note-1',
    });

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(result.title).toBe('想法记录');
  });
});

describe('notesRouter.create', () => {
  it('creates note with normalized title', async () => {
    const create = vi.fn().mockResolvedValue({
      ...noteRecord,
      title: null,
    });

    const caller = notesRouter.createCaller({
      prisma: {
        note: {
          create,
        },
      },
    } as never);

    const result = await caller.create({
      userId: 'user-1',
      title: '   ',
      content: '新的内容',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        title: null,
        content: '新的内容',
      },
    });
    expect(result.title).toBeNull();
  });
});

describe('notesRouter.update', () => {
  it('updates note content and title', async () => {
    const findUnique = vi.fn().mockResolvedValue(noteRecord);
    const update = vi.fn().mockResolvedValue({
      ...noteRecord,
      title: '更新标题',
      content: '更新内容',
    });

    const caller = notesRouter.createCaller({
      prisma: {
        note: {
          findUnique,
          update,
        },
      },
    } as never);

    const result = await caller.update({
      id: 'note-1',
      userId: 'user-1',
      title: '更新标题',
      content: '更新内容',
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'note-1' },
      data: {
        title: '更新标题',
        content: '更新内容',
      },
    });
    expect(result.content).toBe('更新内容');
  });
});

describe('notesRouter.delete', () => {
  it('deletes note', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });

    const caller = notesRouter.createCaller({
      prisma: {
        note: {
          deleteMany,
        },
      },
    } as never);

    const result = await caller.delete({
      id: 'note-1',
      userId: 'user-1',
    });

    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});
