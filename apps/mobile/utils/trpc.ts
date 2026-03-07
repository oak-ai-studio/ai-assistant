import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@ai-assistant/api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from '@/utils/auth';

const trpcUrl = process.env.EXPO_PUBLIC_TRPC_URL ?? 'http://localhost:3000/trpc';
const RETRY_HEADER = 'x-auth-retry';

const refreshClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
    }),
  ],
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await clearTokens();
      return null;
    }

    try {
      const result = await refreshClient.auth.refreshToken.mutate({ refreshToken });
      await setAccessToken(result.accessToken);
      return result.accessToken;
    } catch {
      await clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

const authAwareFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);

  if (!shouldRefreshToken(input, init, response.status)) {
    return response;
  }

  const accessToken = await refreshAccessToken();
  if (!accessToken) {
    return response;
  }

  const headers = new Headers(init?.headers);
  headers.set('authorization', `Bearer ${accessToken}`);
  headers.set(RETRY_HEADER, '1');

  return fetch(input, {
    ...init,
    headers,
  });
};

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
      fetch: authAwareFetch,
      headers: async () => {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          return {};
        }

        return {
          authorization: `Bearer ${accessToken}`,
        };
      },
    }),
  ],
});

function shouldRefreshToken(input: RequestInfo | URL, init: RequestInit | undefined, status: number): boolean {
  if (status !== 401) {
    return false;
  }

  if (getHeaderValue(init?.headers, RETRY_HEADER) === '1') {
    return false;
  }

  const url = typeof input === 'string' ? input : input.toString();
  if (url.includes('auth.refreshToken')) {
    return false;
  }

  return true;
}

function getHeaderValue(headers: HeadersInit | undefined, key: string): string | null {
  if (!headers) {
    return null;
  }

  const normalizedKey = key.toLowerCase();

  if (headers instanceof Headers) {
    return headers.get(key) ?? headers.get(normalizedKey);
  }

  if (Array.isArray(headers)) {
    const pair = headers.find(([headerName]) => headerName.toLowerCase() === normalizedKey);
    return pair?.[1] ?? null;
  }

  const objectValue = headers[key] ?? headers[normalizedKey];
  if (typeof objectValue === 'string') {
    return objectValue;
  }

  if (Array.isArray(objectValue)) {
    return objectValue[0] ?? null;
  }

  return null;
}
