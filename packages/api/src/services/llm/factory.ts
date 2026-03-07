import { LLMProviderError } from './errors';
import { OpenAIChatProvider } from './openai-provider';
import type { ChatLLMProvider } from './types';

function getEnv(name: string): string | undefined {
  const scopedGlobal = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return scopedGlobal.process?.env?.[name];
}

export function createChatLLMProvider(options?: {
  provider?: string;
  openAIApiKey?: string;
  model?: string;
  timeoutMs?: number;
}): ChatLLMProvider {
  const provider = (options?.provider ?? getEnv('LLM_PROVIDER') ?? 'openai').toLowerCase();

  if (provider !== 'openai') {
    throw new LLMProviderError('CONFIG_ERROR', `Unsupported LLM provider: ${provider}.`);
  }

  return new OpenAIChatProvider({
    apiKey: options?.openAIApiKey ?? getEnv('OPENAI_API_KEY'),
    model: options?.model,
    timeoutMs: options?.timeoutMs,
  });
}
