import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { initializeDefaultSkillsForAssistant, toSkillDto } from '../services/skills';
import { publicProcedure, router } from '../trpc';

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const DEFAULT_SYSTEM_PROMPT = '你是用户的贴心 AI 助手，请给出清晰、准确、可执行的建议。';

export const assistantRouter = router({
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        name: z.string().trim().min(1).max(50).optional(),
        avatar: z.string().trim().min(1).max(50).optional(),
        systemPrompt: z.string().trim().min(1).max(5000).optional(),
        pushTimeStart: timeStringSchema.optional(),
        pushTimeEnd: timeStringSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const assistant = await ctx.prisma.assistant.create({
        data: {
          userId: input.userId,
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.avatar === undefined ? {} : { avatar: input.avatar }),
          systemPrompt: input.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
          ...(input.pushTimeStart === undefined ? {} : { pushTimeStart: input.pushTimeStart }),
          ...(input.pushTimeEnd === undefined ? {} : { pushTimeEnd: input.pushTimeEnd }),
        },
      });

      const skills = await initializeDefaultSkillsForAssistant(ctx.prisma, input.userId);

      return {
        assistant,
        skills: skills.map(toSkillDto),
      };
    }),
});
