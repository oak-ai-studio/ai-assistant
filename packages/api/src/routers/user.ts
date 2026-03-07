import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found.',
      });
    }

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        phone: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found.',
      });
    }

    return { user };
  }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId;
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found.',
      });
    }

    const user = await ctx.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        onboardingCompleted: true,
      },
      select: {
        id: true,
        phone: true,
        onboardingCompleted: true,
      },
    });

    return { user };
  }),
});
