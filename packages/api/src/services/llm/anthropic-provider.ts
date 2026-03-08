import Anthropic from '@anthropic-ai/sdk';
import { LLMProviderError } from './errors';
import type { ChatLLMProvider, GenerateChatReplyInput, GenerateChatReplyOutput } from './types';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_TOKENS = 1024;
const NETWORK_ERROR_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT']);

interface AnthropicClient {
  messages: {
    create: {
      (
        request: Anthropic.MessageCreateParamsNonStreaming,
        options?: { signal?: AbortSignal },
      ): Promise<Anthropic.Message>;
      (
        request: Anthropic.MessageCreateParamsStreaming,
        options?: { signal?: AbortSignal },
      ): Promise<AsyncIterable<Anthropic.MessageStreamEvent>>;
    };
  };
}

export class AnthropicChatProvider implements ChatLLMProvider {
  private readonly client: AnthropicClient;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: { apiKey?: string; model?: string; timeoutMs?: number; baseURL?: string; client?: AnthropicClient }) {
    if (!options.client && !options.apiKey) {
      throw new LLMProviderError('CONFIG_ERROR', 'Missing ANTHROPIC_API_KEY for Anthropic provider.');
    }

    this.client =
      options.client ??
      new Anthropic({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      });
    this.model = options.model ?? DEFAULT_MODEL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async sendMessage(input: GenerateChatReplyInput): Promise<GenerateChatReplyOutput> {
    return this.generateReply(input);
  }

  async generateReply(input: GenerateChatReplyInput): Promise<GenerateChatReplyOutput> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.timeoutMs);

    try {
      const response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: DEFAULT_MAX_TOKENS,
          temperature: 0.7,
          system: input.systemPrompt,
          messages: input.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        },
        {
          signal: abortController.signal,
        },
      );

      if (!response || isAsyncIterable(response)) {
        throw new LLMProviderError('API_ERROR', 'Anthropic returned an unexpected streaming response.');
      }

      const content = extractTextContent(response.content).trim();
      if (!content) {
        throw new LLMProviderError('API_ERROR', 'Anthropic returned empty content.');
      }

      return {
        content,
        provider: 'anthropic',
        model: response.model,
      };
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        throw new LLMProviderError('TIMEOUT', `Anthropic request timed out after ${this.timeoutMs}ms.`, {
          cause: error,
        });
      }

      if (error instanceof LLMProviderError) {
        throw error;
      }

      throw mapAnthropicError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async *streamMessage(input: GenerateChatReplyInput): AsyncGenerator<string> {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.timeoutMs);

    try {
      const stream = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: DEFAULT_MAX_TOKENS,
          temperature: 0.7,
          system: input.systemPrompt,
          messages: input.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          stream: true,
        },
        {
          signal: abortController.signal,
        },
      );

      if (!stream || !isAsyncIterable(stream)) {
        throw new LLMProviderError('API_ERROR', 'Anthropic did not return a streaming response.');
      }

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
          yield event.delta.text;
        }
      }
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        throw new LLMProviderError('TIMEOUT', `Anthropic request timed out after ${this.timeoutMs}ms.`, {
          cause: error,
        });
      }

      if (error instanceof LLMProviderError) {
        throw error;
      }

      throw mapAnthropicError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function extractTextContent(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('');
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return Boolean(value && typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function');
}

function mapAnthropicError(error: unknown): LLMProviderError {
  const normalized = error as {
    name?: string;
    code?: string;
    message?: string;
    status?: number;
    cause?: { code?: string; message?: string };
  };

  if (typeof normalized.status === 'number') {
    return new LLMProviderError('API_ERROR', normalized.message ?? 'LLM API request failed.', {
      cause: error,
    });
  }

  if (normalized.name === 'APIConnectionTimeoutError' || normalized.name === 'APIUserAbortError') {
    return new LLMProviderError('TIMEOUT', normalized.message ?? 'LLM request timed out.', {
      cause: error,
    });
  }

  if (normalized.name === 'APIConnectionError') {
    return new LLMProviderError('NETWORK_ERROR', normalized.message ?? 'Failed to connect to LLM API.', {
      cause: error,
    });
  }

  if (typeof normalized.code === 'string' && NETWORK_ERROR_CODES.has(normalized.code)) {
    return new LLMProviderError('NETWORK_ERROR', normalized.message ?? 'Network error while calling LLM API.', {
      cause: error,
    });
  }

  if (normalized.cause?.code && NETWORK_ERROR_CODES.has(normalized.cause.code)) {
    return new LLMProviderError('NETWORK_ERROR', normalized.cause.message ?? 'Network error while calling LLM API.', {
      cause: error,
    });
  }

  return new LLMProviderError('UNKNOWN_ERROR', normalized.message ?? 'Unexpected LLM provider error.', {
    cause: error,
  });
}
