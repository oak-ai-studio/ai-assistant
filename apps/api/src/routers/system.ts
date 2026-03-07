import { publicProcedure, router } from '../trpc';

export const systemRouter = router({
  ping: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),

  dbHealth: publicProcedure.query(async ({ ctx }) => {
    await ctx.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    };
  }),
});
