import { describe, expect, it } from 'vitest';
import { LLMProviderError } from '../src/services/llm/errors';
import { createChatLLMProvider } from '../src/services/llm/factory';

describe('createChatLLMProvider', () => {
  it('creates OpenAI provider by default', () => {
    const provider = createChatLLMProvider({
      openAIApiKey: 'test-key',
    });

    expect(provider).toBeDefined();
    expect(typeof provider.generateReply).toBe('function');
  });

  it('throws CONFIG_ERROR for unsupported provider', () => {
    expect(() =>
      createChatLLMProvider({
        provider: 'anthropic',
        openAIApiKey: 'test-key',
      }),
    ).toThrowError(LLMProviderError);

    expect(() =>
      createChatLLMProvider({
        provider: 'anthropic',
        openAIApiKey: 'test-key',
      }),
    ).toThrow(/Unsupported LLM provider/);
  });
});
