import {getDefaultStore} from 'jotai';
import {
  CustomerAccountManager,
  customerAccountManager,
} from '../customerAccountManager';

const SHOP_ID = 'test-shop-123';
const CLIENT_ID = 'test-client-456';

function createTokenResponseBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-456',
    expires_in: 3600,
    id_token: buildIdToken({email: 'test@example.com'}),
    token_type: 'bearer',
    ...overrides,
  });
}

function buildIdToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({alg: 'RS256'}));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

beforeEach(() => {
  jest.restoreAllMocks();
  global.fetch = jest.fn();
  const EncryptedStorage =
    require('react-native-encrypted-storage').default;
  EncryptedStorage.clear();
});

describe('CustomerAccountManager', () => {
  describe('static getters', () => {
    it('returns the correct redirectUri', () => {
      expect(CustomerAccountManager.redirectUri).toBe(
        `shop.${SHOP_ID}.app://callback`,
      );
    });

    it('returns the correct callbackScheme', () => {
      expect(CustomerAccountManager.callbackScheme).toBe(
        `shop.${SHOP_ID}.app`,
      );
    });
  });

  describe('buildAuthorizationURL', () => {
    it('returns a well-formed authorization URL', () => {
      const manager = new CustomerAccountManager();
      const url = manager.buildAuthorizationURL();

      expect(url).toContain(
        `https://shopify.com/authentication/${SHOP_ID}/oauth/authorize`,
      );

      const parsed = new URL(url);
      expect(parsed.searchParams.get('client_id')).toBe(CLIENT_ID);
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        `shop.${SHOP_ID}.app://callback`,
      );
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('scope')).toBe(
        'openid email customer-account-api:full',
      );
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('code_challenge')).toBeTruthy();
      expect(parsed.searchParams.get('state')).toBeTruthy();
    });
  });

  describe('handleAuthCallback', () => {
    it('exchanges code for tokens and updates session atom', async () => {
      const manager = new CustomerAccountManager();
      const store = getDefaultStore();

      const url = manager.buildAuthorizationURL();
      const parsed = new URL(url);
      const state = parsed.searchParams.get('state')!;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => JSON.parse(createTokenResponseBody()),
      });

      await manager.handleAuthCallback('test-code', state);

      const session = store.get(manager.sessionAtom);
      expect(session.isAuthenticated).toBe(true);
      expect(session.email).toBe('test@example.com');
      expect(session.tokenExpiresAt).toBeGreaterThan(Date.now());
    });

    it('throws on state mismatch', async () => {
      const manager = new CustomerAccountManager();
      manager.buildAuthorizationURL();

      await expect(
        manager.handleAuthCallback('test-code', 'wrong-state'),
      ).rejects.toThrow('Invalid state parameter');
    });
  });

  describe('logout', () => {
    it('resets session atom to unauthenticated', async () => {
      const manager = new CustomerAccountManager();
      const store = getDefaultStore();

      const url = manager.buildAuthorizationURL();
      const parsed = new URL(url);
      const state = parsed.searchParams.get('state')!;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => JSON.parse(createTokenResponseBody()),
      });

      await manager.handleAuthCallback('test-code', state);

      const sessionBefore = store.get(manager.sessionAtom);
      expect(sessionBefore.isAuthenticated).toBe(true);

      (global.fetch as jest.Mock).mockResolvedValueOnce({ok: true});

      await manager.logout();

      const sessionAfter = store.get(manager.sessionAtom);
      expect(sessionAfter.isAuthenticated).toBe(false);
      expect(sessionAfter.email).toBeNull();
      expect(sessionAfter.tokenExpiresAt).toBeNull();
    });
  });

  describe('getValidAccessToken', () => {
    it('returns the access token when session is valid', async () => {
      const manager = new CustomerAccountManager();

      const url = manager.buildAuthorizationURL();
      const parsed = new URL(url);
      const state = parsed.searchParams.get('state')!;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => JSON.parse(createTokenResponseBody()),
      });

      await manager.handleAuthCallback('test-code', state);

      const token = await manager.getValidAccessToken();
      expect(token).toBe('access-token-123');
    });

    it('returns null when no tokens are stored', async () => {
      const manager = new CustomerAccountManager();
      const token = await manager.getValidAccessToken();
      expect(token).toBeNull();
    });

    it('refreshes the token when expiring soon', async () => {
      const manager = new CustomerAccountManager();

      const url = manager.buildAuthorizationURL();
      const parsed = new URL(url);
      const state = parsed.searchParams.get('state')!;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () =>
          JSON.parse(createTokenResponseBody({expires_in: 60})),
      });

      await manager.handleAuthCallback('test-code', state);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () =>
          JSON.parse(
            createTokenResponseBody({
              access_token: 'refreshed-token-789',
            }),
          ),
      });

      const token = await manager.getValidAccessToken();
      expect(token).toBe('refreshed-token-789');
    });
  });

  describe('singleton export', () => {
    it('exports a singleton instance', () => {
      expect(customerAccountManager).toBeInstanceOf(CustomerAccountManager);
    });
  });
});
