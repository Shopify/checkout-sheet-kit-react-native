import type {PropsWithChildren} from 'react';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as customerAccountManager from '../auth/customerAccountManager';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await customerAccountManager.checkExistingSession();
        setIsAuthenticated(session.isAuthenticated);
        setCustomerEmail(session.email);
        setTokenExpiresAt(session.tokenExpiresAt);
      } catch {
        setIsAuthenticated(false);
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
        setIsAuthenticated(true);
        setCustomerEmail(email);
        setTokenExpiresAt(tokens.expiresAt);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await customerAccountManager.logout();
    setIsAuthenticated(false);
    setCustomerEmail(null);
    setTokenExpiresAt(null);
  }, []);

  const getValidAccessToken = useCallback(async () => {
    return customerAccountManager.getValidAccessToken();
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      customerEmail,
      isLoading,
      tokenExpiresAt,
      login,
      logout,
      getValidAccessToken,
      handleAuthCallback,
    }),
    [
      isAuthenticated,
      customerEmail,
      isLoading,
      tokenExpiresAt,
      login,
      logout,
      getValidAccessToken,
      handleAuthCallback,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);
