import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  getSkillForUser,
  initializeDefaultSkillsForAssistant,
  listSkillsForUser,
  reorderSkillsForUser,
  toSkillDto,
  updateSkillForUser,
} from '../services/skills';
import { publicProcedure, router } from '../trpc';

const userIdSchema = z.string().min(1);

const sortOrderSchema = z.number().int().min(0);

const updateSkillInputSchema = z
  .object({
    userId: userIdSchema,
    skillId: z.string().min(1),
    name: z.string().trim().min(1).max(50).optional(),
    icon: z.string().trim().min(1).max(50).optional(),
    systemPrompt: z.string().trim().min(1).max(5000).optional(),
    isActive: z.boolean().optional(),
    sortOrder: sortOrderSchema.optional(),
  })
  .refine(
    (input) =>
      input.name !== undefined ||
      input.icon !== undefined ||
      input.systemPrompt !== undefined ||
      input.isActive !== undefined ||
      input.sortOrder !== undefined,
    {
      message: 'At least one field must be provided for update',
      path: ['skillId'],
    }
  );

const reorderSkillsInputSchema = z.object({
  userId: userIdSchema,
  skillOrders: z
    .array(
      z.object({
        skillId: z.string().min(1),
        sortOrder: sortOrderSchema,
      })
    )
    .min(1)
    .refine(
      (items) => {
        const ids = items.map((item) => item.skillId);
        return new Set(ids).size === ids.length;
      },
      { message: 'skillId must be unique in reorder payload' }
    ),
});

export const skillsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        userId: userIdSchema,
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await initializeDefaultSkillsForAssistant(ctx.prisma, input.userId);
      const skills = await listSkillsForUser(ctx.prisma, input);

      return {
        skills: skills.map(toSkillDto),
      };
    }),

  get: publicProcedure
    .input(
      z.object({
        userId: userIdSchema,
        skillId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const skill = await getSkillForUser(ctx.prisma, input);

      if (!skill) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found',
        });
      }

      return {
        skill: toSkillDto(skill),
      };
    }),

  update: publicProcedure.input(updateSkillInputSchema).mutation(async ({ ctx, input }) => {
    const skill = await updateSkillForUser(ctx.prisma, input);

    if (!skill) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Skill not found',
      });
    }

    return {
      skill: toSkillDto(skill),
    };
  }),

  reorder: publicProcedure.input(reorderSkillsInputSchema).mutation(async ({ ctx, input }) => {
    const skills = await reorderSkillsForUser(ctx.prisma, input);

    if (!skills) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Some skills do not exist or do not belong to the user',
      });
    }

    return {
      skills: skills.map(toSkillDto),
    };
  }),
});
