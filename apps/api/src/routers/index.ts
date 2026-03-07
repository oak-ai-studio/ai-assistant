import { router } from '../trpc';
import { systemRouter } from './system';

export const appRouter = router({
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
