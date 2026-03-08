import { LLMProviderError } from './errors';
import { AnthropicChatProvider } from './anthropic-provider';
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
  anthropicApiKey?: string;
  model?: string;
  timeoutMs?: number;
  baseURL?: string;
}): ChatLLMProvider {
  const provider = (options?.provider ?? getEnv('LLM_PROVIDER') ?? 'openai').toLowerCase();

  if (provider === 'anthropic') {
    return new AnthropicChatProvider({
      apiKey: options?.anthropicApiKey ?? getEnv('ANTHROPIC_API_KEY'),
      model: options?.model ?? getEnv('ANTHROPIC_MODEL') ?? getEnv('OPENAI_MODEL'),
      timeoutMs: options?.timeoutMs,
      baseURL: options?.baseURL ?? getEnv('LLM_BASE_URL'),
    });
  }

  if (provider === 'openai') {
    return new OpenAIChatProvider({
      apiKey: options?.openAIApiKey ?? getEnv('OPENAI_API_KEY'),
      model: options?.model ?? getEnv('OPENAI_MODEL'),
      timeoutMs: options?.timeoutMs,
      baseURL: getBaseURL(provider, options?.baseURL ?? getEnv('LLM_BASE_URL')),
    });
  }

  throw new LLMProviderError('CONFIG_ERROR', `Unsupported LLM provider: ${provider}.`);
}

function getBaseURL(provider: string, envBaseURL?: string): string | undefined {
  if (envBaseURL) {
    return envBaseURL;
  }

  if (provider === 'anthropic') {
    return 'https://api.anthropic.com';
  }

  return 'https://api.openai.com/v1';
}
