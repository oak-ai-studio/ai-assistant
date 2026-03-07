import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth.access-token';
const REFRESH_TOKEN_KEY = 'auth.refresh-token';
const AUTH_USER_KEY = 'auth.user';
const authListeners = new Set<() => void>();

export type AuthUser = {
  id: string;
  phone: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);

  notifyAuthListeners();
}

export async function setAccessToken(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
  notifyAuthListeners();
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;

    if (typeof parsed.id !== 'string' || typeof parsed.phone !== 'string') {
      return null;
    }

    return {
      id: parsed.id,
      phone: parsed.phone,
    };
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await Promise.all([
    saveTokens(session.accessToken, session.refreshToken),
    saveAuthUser(session.user),
  ]);
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const [accessToken, refreshToken, user] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
    getAuthUser(),
  ]);

  if (!accessToken || !refreshToken || !user) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_KEY),
  ]);

  notifyAuthListeners();
}

export async function isAuthenticated(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  return Boolean(refreshToken);
}

export function subscribeAuthChanges(listener: () => void): () => void {
  authListeners.add(listener);

  return () => {
    authListeners.delete(listener);
  };
}

function notifyAuthListeners(): void {
  for (const listener of authListeners) {
    listener();
  }
}
