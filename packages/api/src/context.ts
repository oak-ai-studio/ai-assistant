import { prisma } from '@ai-assistant/db';

export const createContext = async () => {
  return {
    prisma,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
