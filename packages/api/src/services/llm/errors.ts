export type LLMProviderErrorCode = 'TIMEOUT' | 'API_ERROR' | 'NETWORK_ERROR' | 'CONFIG_ERROR' | 'UNKNOWN_ERROR';

export class LLMProviderError extends Error {
  readonly code: LLMProviderErrorCode;

  constructor(code: LLMProviderErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'LLMProviderError';
    this.code = code;
  }
}
