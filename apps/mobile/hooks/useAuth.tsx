import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type AuthSession,
  type AuthUser,
  clearTokens,
  getAuthSession,
  getRefreshToken,
  saveAuthSession,
  subscribeAuthChanges,
} from '@/utils/auth';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  status: AuthStatus;
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshAuthState = useCallback(async () => {
    const session = await getAuthSession();

    if (session) {
      setUser(session.user);
      setStatus('authenticated');
      return;
    }

    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      setUser(null);
      setStatus('authenticated');
      return;
    }

    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    void refreshAuthState();
  }, [refreshAuthState]);

  useEffect(() => {
    return subscribeAuthChanges(() => {
      void refreshAuthState();
    });
  }, [refreshAuthState]);

  const signIn = useCallback(async (session: AuthSession) => {
    await saveAuthSession(session);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await clearTokens();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      signIn,
      signOut,
      refreshAuthState,
    }),
    [refreshAuthState, signIn, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
