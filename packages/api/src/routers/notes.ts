import { z } from 'zod';
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from '../services/notes';
import { publicProcedure, router } from '../trpc';

const userIdSchema = z.string().min(1);
const noteIdSchema = z.string().min(1);

const titleSchema = z.string().trim().max(80);
const contentSchema = z.string().trim().min(1).max(2000);

export const notesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        userId: userIdSchema,
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return listNotes(ctx.prisma, input);
    }),

  getById: publicProcedure
    .input(
      z.object({
        userId: userIdSchema,
        id: noteIdSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      return getNoteById(ctx.prisma, input);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: userIdSchema,
        title: titleSchema.optional(),
        content: contentSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createNote(ctx.prisma, input);
    }),

  update: publicProcedure
    .input(
      z
        .object({
          id: noteIdSchema,
          userId: userIdSchema,
          title: titleSchema.optional(),
          content: contentSchema.optional(),
        })
        .refine(
          (value) => typeof value.title !== 'undefined' || typeof value.content !== 'undefined',
          'At least one field must be provided for update',
        )
    )
    .mutation(async ({ ctx, input }) => {
      return updateNote(ctx.prisma, input);
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: noteIdSchema,
        userId: userIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return deleteNote(ctx.prisma, input);
    }),
});
