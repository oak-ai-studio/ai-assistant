import { z } from 'zod';
import { initializeDefaultSkillsForAssistant, toSkillDto } from '../services/skills';
import { publicProcedure, router } from '../trpc';

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const assistantRouter = router({
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        name: z.string().trim().min(1).max(50).optional(),
        avatar: z.string().trim().min(1).max(50).optional(),
        systemPrompt: z.string().trim().min(1).max(5000).optional(),
        pushTimeStart: timeStringSchema.optional(),
        pushTimeEnd: timeStringSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.upsert({
        where: { id: input.userId },
        update: {},
        create: {
          id: input.userId,
          phone: `legacy:${input.userId}`,
        },
      });

      const assistant = await ctx.prisma.assistant.create({
        data: {
          userId: input.userId,
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.avatar === undefined ? {} : { avatar: input.avatar }),
          ...(input.systemPrompt === undefined ? {} : { systemPrompt: input.systemPrompt }),
          ...(input.pushTimeStart === undefined ? {} : { pushTimeStart: input.pushTimeStart }),
          ...(input.pushTimeEnd === undefined ? {} : { pushTimeEnd: input.pushTimeEnd }),
        },
      });

      const skills = await initializeDefaultSkillsForAssistant(ctx.prisma, assistant.id);

      return {
        assistant,
        skills: skills.map(toSkillDto),
      };
    }),
});
