import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'ai-assistant-user-id';

let cachedUserId: string | null = null;
let pendingRequest: Promise<string> | null = null;

const normalizeUserId = (value?: string | null) => value?.trim() ?? '';

export async function getOrCreateUserId(): Promise<string> {
  if (cachedUserId) {
    return cachedUserId;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = (async () => {
    const existing = normalizeUserId(await SecureStore.getItemAsync(USER_ID_KEY));

    if (existing.length > 0) {
      cachedUserId = existing;
      return existing;
    }

    const nextUserId = uuidv4();
    await SecureStore.setItemAsync(USER_ID_KEY, nextUserId);
    cachedUserId = nextUserId;

    return nextUserId;
  })();

  try {
    return await pendingRequest;
  } finally {
    pendingRequest = null;
  }
}

export function useUserId() {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const nextUserId = await getOrCreateUserId();
        if (!active) {
          return;
        }

        setUserId(nextUserId);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : '用户标识初始化失败');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  return {
    userId,
    isLoading,
    error,
  };
}
