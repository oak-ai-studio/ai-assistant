import { describe, expect, it, vi } from 'vitest';
import { LLMProviderError } from '../src/services/llm/errors';
import { AnthropicChatProvider } from '../src/services/llm/anthropic-provider';

describe('AnthropicChatProvider', () => {
  it('returns assistant content on successful completion', async () => {
    const create = vi.fn().mockResolvedValue({
      model: 'claude-3-5-sonnet-20241022',
      content: [
        {
          type: 'text',
          text: '你好，我可以帮你安排计划。',
        },
      ],
    });

    const provider = new AnthropicChatProvider({
      client: {
        messages: { create },
      },
    });

    const response = await provider.generateReply({
      systemPrompt: '你是小助。',
      messages: [{ role: 'user', content: '你好' }],
    });

    expect(response.content).toBe('你好，我可以帮你安排计划。');
    expect(response.model).toBe('claude-3-5-sonnet-20241022');
    expect(response.provider).toBe('anthropic');
  });

  it('throws TIMEOUT when request exceeds timeout', async () => {
    const create = vi.fn().mockImplementation((_request, options?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      });
    });

    const provider = new AnthropicChatProvider({
      timeoutMs: 5,
      client: {
        messages: { create },
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

    const provider = new AnthropicChatProvider({
      client: {
        messages: { create },
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

    const provider = new AnthropicChatProvider({
      client: {
        messages: { create },
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
      model: 'claude-3-5-sonnet-20241022',
      content: [
        {
          type: 'text',
          text: '',
        },
      ],
    });

    const provider = new AnthropicChatProvider({
      client: {
        messages: { create },
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

    const provider = new AnthropicChatProvider({
      client: {
        messages: { create },
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
    expect(() => new AnthropicChatProvider({})).toThrowError(LLMProviderError);
    expect(() => new AnthropicChatProvider({})).toThrow(/ANTHROPIC_API_KEY/);
  });
});
