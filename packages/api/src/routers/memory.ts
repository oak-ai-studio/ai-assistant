import { z } from 'zod';
import {
  createMemory,
  deleteMemory,
  listMemories,
  memoryTypeValues,
  searchMemories,
  updateMemory,
} from '../services/memory';
import { publicProcedure, router } from '../trpc';

const memoryTypeSchema = z.enum(memoryTypeValues);

export const memoryRouter = router({
  list: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        type: memoryTypeSchema.optional(),
        skillSource: z.string().min(1).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        minConfidence: z.number().min(0).max(1).optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listMemories(ctx.prisma, input);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        content: z.string().trim().min(1).max(200),
        type: memoryTypeSchema,
        skillSource: z.string().min(1).optional(),
        confidence: z.number().min(0).max(1).default(0.8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createMemory(ctx.prisma, input);
    }),

  update: publicProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          userId: z.string().min(1),
          content: z.string().trim().min(1).max(200).optional(),
          type: memoryTypeSchema.optional(),
          confidence: z.number().min(0).max(1).optional(),
        })
        .refine(
          (value) =>
            typeof value.content !== 'undefined' ||
            typeof value.type !== 'undefined' ||
            typeof value.confidence !== 'undefined',
          'At least one field must be provided for update',
        ),
    )
    .mutation(async ({ ctx, input }) => {
      return updateMemory(ctx.prisma, input);
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        userId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return deleteMemory(ctx.prisma, input);
    }),

  search: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        query: z.string().trim().min(1),
        type: memoryTypeSchema.optional(),
        minConfidence: z.number().min(0).max(1).optional(),
        semantic: z.boolean().default(false),
        limit: z.number().int().min(1).max(50).default(10),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memories = await searchMemories(ctx.prisma, input);
      return { memories };
    }),
});
