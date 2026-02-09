import type {PropsWithChildren} from 'react';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as customerAccountManager from '../auth/customerAccountManager';

interface Session {
  isAuthenticated: boolean;
  email: string | null;
  tokenExpiresAt: number | null;
}

const defaultSession: Session = {
  isAuthenticated: false,
  email: null,
  tokenExpiresAt: null,
};

interface AuthContextValue {
  isAuthenticated: boolean;
  customerEmail: string | null;
  isLoading: boolean;
  tokenExpiresAt: number | null;
  login: () => string;
  logout: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
  handleAuthCallback: (code: string, state: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  customerEmail: null,
  isLoading: true,
  tokenExpiresAt: null,
  login: () => '',
  logout: async () => {},
  getValidAccessToken: async () => null,
  handleAuthCallback: async () => {},
});

export const AuthProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [session, setSession] = useState<Session>(defaultSession);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const restored = await customerAccountManager.checkExistingSession();
        setSession({
          isAuthenticated: restored.isAuthenticated,
          email: restored.email,
          tokenExpiresAt: restored.tokenExpiresAt,
        });
      } catch {
        setSession(defaultSession);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(() => {
    return customerAccountManager.buildAuthorizationURL();
  }, []);

  const handleAuthCallback = useCallback(
    async (code: string, state: string) => {
      setIsLoading(true);
      try {
        const tokens = await customerAccountManager.exchangeCodeForTokens(
          code,
          state,
        );
        const email = customerAccountManager.extractEmailFromIdToken(
          tokens.idToken,
        );
        setSession({
          isAuthenticated: true,
          email,
          tokenExpiresAt: tokens.expiresAt,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await customerAccountManager.logout();
    setSession(defaultSession);
  }, []);

  const getValidAccessToken = useCallback(async () => {
    return customerAccountManager.getValidAccessToken();
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: session.isAuthenticated,
      customerEmail: session.email,
      isLoading,
      tokenExpiresAt: session.tokenExpiresAt,
      login,
      logout,
      getValidAccessToken,
      handleAuthCallback,
    }),
    [session, isLoading, login, logout, getValidAccessToken, handleAuthCallback],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);
