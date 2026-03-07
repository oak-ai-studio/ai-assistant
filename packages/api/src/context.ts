import { prisma } from '@ai-assistant/db';
import type { ChatLLMProvider } from './services/llm';

export const createContext = async (options?: { llmProvider?: ChatLLMProvider }) => {
  return {
    prisma,
    llmProvider: options?.llmProvider,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
