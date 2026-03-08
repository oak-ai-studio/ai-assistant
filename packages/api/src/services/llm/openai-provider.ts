import OpenAI from 'openai';
import { LLMProviderError } from './errors';
import type { ChatLLMProvider, GenerateChatReplyInput, GenerateChatReplyOutput } from './types';

const DEFAULT_MODEL = 'gpt-4.1-mini';
const DEFAULT_TIMEOUT_MS = 15_000;
const NETWORK_ERROR_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT']);

interface OpenAIClient {
  chat: {
    completions: {
      create: (
        request: {
          model: string;
          messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
          temperature: number;
        },
        options?: { signal?: AbortSignal },
      ) => Promise<{
        model: string;
        choices: Array<{
          message: {
            content: string | null;
          };
        }>;
      }>;
    };
  };
}

export class OpenAIChatProvider implements ChatLLMProvider {
  private readonly client: OpenAIClient;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: {
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
    baseURL?: string;
    client?: OpenAIClient;
  }) {
    if (!options.client && !options.apiKey) {
      throw new LLMProviderError('CONFIG_ERROR', 'Missing OPENAI_API_KEY for OpenAI provider.');
    }

    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      });
    this.model = options.model ?? DEFAULT_MODEL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async generateReply(input: GenerateChatReplyInput): Promise<GenerateChatReplyOutput> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.timeoutMs);

    try {
      const completion = await this.client.chat.completions.create(
        {
          model: this.model,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: input.systemPrompt,
            },
            ...input.messages,
          ],
        },
        {
          signal: abortController.signal,
        },
      );

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new LLMProviderError('API_ERROR', 'OpenAI returned empty content.');
      }

      return {
        content,
        provider: 'openai',
        model: completion.model,
      };
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        throw new LLMProviderError('TIMEOUT', `OpenAI request timed out after ${this.timeoutMs}ms.`, { cause: error });
      }

      if (error instanceof LLMProviderError) {
        throw error;
      }

      throw mapOpenAIError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function mapOpenAIError(error: unknown): LLMProviderError {
  const normalized = error as {
    name?: string;
    code?: string;
    message?: string;
    status?: number;
  };

  if (typeof normalized.status === 'number') {
    return new LLMProviderError('API_ERROR', normalized.message ?? 'LLM API request failed.', {
      cause: error,
    });
  }

  if (typeof normalized.code === 'string' && NETWORK_ERROR_CODES.has(normalized.code)) {
    return new LLMProviderError('NETWORK_ERROR', normalized.message ?? 'Network error while calling LLM API.', {
      cause: error,
    });
  }

  if (normalized.name === 'APIConnectionError') {
    return new LLMProviderError('NETWORK_ERROR', normalized.message ?? 'Failed to connect to LLM API.', {
      cause: error,
    });
  }

  return new LLMProviderError('UNKNOWN_ERROR', normalized.message ?? 'Unexpected LLM provider error.', {
    cause: error,
  });
}
