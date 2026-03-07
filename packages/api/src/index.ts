import { assistantRouter } from './routers/assistant';
import { chatRouter } from './routers/chat';
import { memoryRouter } from './routers/memory';
import { pushRouter } from './routers/push';
import { skillsRouter } from './routers/skills';
import { userRouter } from './routers/user';
import { router } from './trpc';

export const appRouter = router({
  user: userRouter,
  assistant: assistantRouter,
  chat: chatRouter,
  memory: memoryRouter,
  skills: skillsRouter,
  skill: skillsRouter,
  push: pushRouter,
});

export type AppRouter = typeof appRouter;
