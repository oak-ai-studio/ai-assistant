import { describe, expect, it, vi } from 'vitest';
import { LLMProviderError } from '../src/services/llm/errors';
import { OpenAIChatProvider } from '../src/services/llm/openai-provider';

describe('OpenAIChatProvider', () => {
  it('returns assistant content on successful completion', async () => {
    const create = vi.fn().mockResolvedValue({
      model: 'gpt-4.1-mini',
      choices: [
        {
          message: {
            content: '你好，我可以帮你安排计划。',
          },
        },
      ],
    });

    const provider = new OpenAIChatProvider({
      client: {
        chat: {
          completions: { create },
        },
      },
    });

    const response = await provider.generateReply({
      systemPrompt: '你是小助。',
      messages: [{ role: 'user', content: '你好' }],
    });

    expect(response.content).toBe('你好，我可以帮你安排计划。');
    expect(response.model).toBe('gpt-4.1-mini');
    expect(response.provider).toBe('openai');
  });

  it('throws TIMEOUT when request exceeds timeout', async () => {
    const create = vi.fn().mockImplementation((_request, options?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      });
    });

    const provider = new OpenAIChatProvider({
      timeoutMs: 5,
      client: {
        chat: {
          completions: { create },
        },
      },
    });

    await expect(
      provider.generateReply({
        systemPrompt: '你是小助。',
        messages: [{ role: 'user', content: '你好' }],
      }),
    ).rejects.toMatchObject<Partial<LLMProviderError>>({ code: 'TIMEOUT' });
  });

  it('maps status errors to API_ERROR', async () => {
    const create = vi.fn().mockRejectedValue({ status: 429, message: 'rate limit' });

    const provider = new OpenAIChatProvider({
      client: {
        chat: {
          completions: { create },
        },
      },
    });

    await expect(
      provider.generateReply({
        systemPrompt: '你是小助。',
        messages: [{ role: 'user', content: '你好' }],
      }),
    ).rejects.toMatchObject<Partial<LLMProviderError>>({ code: 'API_ERROR' });
  });

  it('maps connection errors to NETWORK_ERROR', async () => {
    const create = vi.fn().mockRejectedValue({ code: 'ENOTFOUND', message: 'dns lookup failed' });

    const provider = new OpenAIChatProvider({
      client: {
        chat: {
          completions: { create },
        },
      },
    });

    await expect(
      provider.generateReply({
        systemPrompt: '你是小助。',
        messages: [{ role: 'user', content: '你好' }],
      }),
    ).rejects.toMatchObject<Partial<LLMProviderError>>({ code: 'NETWORK_ERROR' });
  });

  it('throws API_ERROR when provider returns empty content', async () => {
    const create = vi.fn().mockResolvedValue({
      model: 'gpt-4.1-mini',
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    });

    const provider = new OpenAIChatProvider({
      client: {
        chat: {
          completions: { create },
        },
      },
    });

    await expect(
      provider.generateReply({
        systemPrompt: '你是小助。',
        messages: [{ role: 'user', content: '你好' }],
      }),
    ).rejects.toMatchObject<Partial<LLMProviderError>>({ code: 'API_ERROR' });
  });

  it('maps unknown errors to UNKNOWN_ERROR', async () => {
    const create = vi.fn().mockRejectedValue(new Error('unexpected'));

    const provider = new OpenAIChatProvider({
      client: {
        chat: {
          completions: { create },
        },
      },
    });

    await expect(
      provider.generateReply({
        systemPrompt: '你是小助。',
        messages: [{ role: 'user', content: '你好' }],
      }),
    ).rejects.toMatchObject<Partial<LLMProviderError>>({ code: 'UNKNOWN_ERROR' });
  });

  it('throws CONFIG_ERROR when api key and client are both missing', () => {
    expect(() => new OpenAIChatProvider({})).toThrowError(LLMProviderError);
    expect(() => new OpenAIChatProvider({})).toThrow(/OPENAI_API_KEY/);
  });
});
