import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.userId,
      },
      select: {
        id: true,
        phone: true,
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
});
