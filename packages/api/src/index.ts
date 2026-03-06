import { assistantRouter } from './routers/assistant';
import { chatRouter } from './routers/chat';
import { memoryRouter } from './routers/memory';
import { pushRouter } from './routers/push';
import { skillRouter } from './routers/skill';
import { userRouter } from './routers/user';
import { router } from './trpc';

export const appRouter = router({
  user: userRouter,
  assistant: assistantRouter,
  chat: chatRouter,
  memory: memoryRouter,
  skill: skillRouter,
  push: pushRouter,
});

export type AppRouter = typeof appRouter;
