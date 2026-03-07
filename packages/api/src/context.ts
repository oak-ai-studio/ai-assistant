import { prisma } from '@ai-assistant/db';
import type { ChatLLMProvider } from './services/llm';

export const createContext = async (options?: {
  llmProvider?: ChatLLMProvider;
  userId?: string | null;
}) => {
  return {
    prisma,
    llmProvider: options?.llmProvider,
    userId: options?.userId ?? null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
