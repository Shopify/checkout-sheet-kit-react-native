import {useAtomValue} from 'jotai';
import {customerAccountManager} from '../auth/customerAccountManager';

export function useAuth() {
  const session = useAtomValue(customerAccountManager.sessionAtom);
  const isLoading = useAtomValue(customerAccountManager.isLoadingAtom);

  return {
    isAuthenticated: session.isAuthenticated,
    customerEmail: session.email,
    isLoading,
    tokenExpiresAt: session.tokenExpiresAt,
    logout: () => customerAccountManager.logout(),
    getValidAccessToken: () => customerAccountManager.getValidAccessToken(),
    handleAuthCallback: (code: string, state: string) =>
      customerAccountManager.handleAuthCallback(code, state),
  };
}
