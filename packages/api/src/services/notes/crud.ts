import type { PrismaClient } from '@ai-assistant/db';
import { TRPCError } from '@trpc/server';

type NoteServicePrisma = Pick<PrismaClient, 'note'>;

interface NoteRecord {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteDetail {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotesInput {
  userId: string;
  limit: number;
  offset: number;
  sortOrder?: 'asc' | 'desc';
}

export interface ListNotesResult {
  notes: NoteDetail[];
  total: number;
}

export interface CreateNoteInput {
  userId: string;
  title?: string | null;
  content: string;
}

export interface UpdateNoteInput {
  id: string;
  userId: string;
  title?: string | null;
  content?: string;
}

export interface DeleteNoteInput {
  id: string;
  userId: string;
}

export interface GetNoteByIdInput {
  id: string;
  userId: string;
}

const toNoteDetail = (note: NoteRecord): NoteDetail => ({
  id: note.id,
  title: note.title,
  content: note.content,
  createdAt: note.createdAt.toISOString(),
  updatedAt: note.updatedAt.toISOString(),
});

const normalizeTitle = (title: string | null | undefined) => {
  if (title === undefined) {
    return undefined;
  }

  if (title === null) {
    return null;
  }

  const trimmed = title.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const listNotes = async (
  prisma: NoteServicePrisma,
  input: ListNotesInput,
): Promise<ListNotesResult> => {
  const sortOrder = input.sortOrder ?? 'desc';

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where: { userId: input.userId },
      orderBy: { updatedAt: sortOrder },
      take: input.limit,
      skip: input.offset,
    }),
    prisma.note.count({ where: { userId: input.userId } }),
  ]);

  return {
    notes: notes.map(toNoteDetail),
    total,
  };
};

export const getNoteById = async (
  prisma: NoteServicePrisma,
  input: GetNoteByIdInput,
): Promise<NoteDetail> => {
  const note = await prisma.note.findFirst({
    where: {
      id: input.id,
      userId: input.userId,
    },
  });

  if (!note) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Note not found',
    });
  }

  return toNoteDetail(note);
};

export const createNote = async (
  prisma: NoteServicePrisma,
  input: CreateNoteInput,
): Promise<NoteDetail> => {
  const note = await prisma.note.create({
    data: {
      userId: input.userId,
      title: normalizeTitle(input.title) ?? null,
      content: input.content,
    },
  });

  return toNoteDetail(note);
};

export const updateNote = async (
  prisma: NoteServicePrisma,
  input: UpdateNoteInput,
): Promise<NoteDetail> => {
  const existing = await prisma.note.findUnique({
    where: { id: input.id },
  });

  if (!existing || existing.userId !== input.userId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Note not found',
    });
  }

  const data: { title?: string | null; content?: string } = {};

  if (typeof input.title !== 'undefined') {
    data.title = normalizeTitle(input.title) ?? null;
  }

  if (typeof input.content !== 'undefined') {
    data.content = input.content;
  }

  if (Object.keys(data).length === 0) {
    return toNoteDetail(existing);
  }

  const note = await prisma.note.update({
    where: { id: input.id },
    data,
  });

  return toNoteDetail(note);
};

export const deleteNote = async (
  prisma: NoteServicePrisma,
  input: DeleteNoteInput,
): Promise<{ success: true }> => {
  const result = await prisma.note.deleteMany({
    where: {
      id: input.id,
      userId: input.userId,
    },
  });

  if (result.count === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Note not found',
    });
  }

  return { success: true };
};
