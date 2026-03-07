import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@ai-assistant/api';

const DEFAULT_API_URL = 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 15000;

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const API_BASE_URL = stripTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL
);
const TRPC_URL = `${API_BASE_URL}/trpc`;

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: TRPC_URL,
    }),
  ],
});

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

export class ApiRequestError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractErrorMessage = (payload: unknown, status: number): string => {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return `请求失败（${status}）`;
  }

  const directMessage = payload.message ?? payload.error ?? payload.reason;
  if (typeof directMessage === 'string' && directMessage.trim().length > 0) {
    return directMessage;
  }

  const trpcError =
    isRecord(payload.error) && typeof payload.error.message === 'string'
      ? payload.error.message
      : isRecord(payload.result) &&
          isRecord(payload.result.error) &&
          typeof payload.result.error.message === 'string'
        ? payload.result.error.message
        : null;

  if (trpcError) {
    return trpcError;
  }

  return `请求失败（${status}）`;
};

const buildQueryString = (query: QueryParams): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }

    params.append(key, String(value));
  }

  const raw = params.toString();
  return raw.length > 0 ? `?${raw}` : '';
};

type ApiRequestOptions<TBody> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: QueryParams;
  body?: TBody;
};

export async function apiRequest<TResponse, TBody = Record<string, unknown>>(
  path: `/api/${string}`,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  const method = options.method ?? 'POST';
  const queryString = options.query ? buildQueryString(options.query) : '';
  const requestUrl = `${API_BASE_URL}${path}${queryString}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body:
        method === 'GET' || options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    const payload = rawText.length > 0 ? JSON.parse(rawText) : null;

    if (!response.ok) {
      throw new ApiRequestError(
        extractErrorMessage(payload, response.status),
        response.status,
        payload
      );
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiRequestError('请求超时，请稍后重试', 408);
    }

    if (error instanceof SyntaxError) {
      throw new ApiRequestError('接口返回格式错误', 500);
    }

    throw new ApiRequestError('网络异常，请检查连接后重试', 500, error);
  } finally {
    clearTimeout(timeoutId);
  }
}
