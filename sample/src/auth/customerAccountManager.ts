import Config from 'react-native-config';
import {atom, getDefaultStore} from 'jotai';
import {PKCE} from './pkce';
import * as tokenStorage from './tokenStorage';
import type {OAuthTokenResult} from './types';
import {createDebugLogger} from '../utils';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  id_token?: string;
  token_type: string;
}

interface Session {
  isAuthenticated: boolean;
  email: string | null;
  tokenExpiresAt: number | null;
}

const log = createDebugLogger('CustomerAccount');

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

const defaultSession: Session = {
  isAuthenticated: false,
  email: null,
  tokenExpiresAt: null,
};

export class CustomerAccountManager {
  readonly sessionAtom = atom<Session>(defaultSession);
  readonly isLoadingAtom = atom<boolean>(true);

  private store = getDefaultStore();
  private storedCodeVerifier: string | null = null;
  private storedState: string | null = null;

  constructor() {
    this.restoreSession();
  }

  static get redirectUri(): string {
    return `shop.${CustomerAccountManager.shopId}.app://callback`;
  }

  static get callbackScheme(): string {
    return `shop.${CustomerAccountManager.shopId}.app`;
  }

  buildAuthorizationURL(): string {
    const verifier = PKCE.generateCodeVerifier();
    const challenge = PKCE.generateCodeChallenge(verifier);
    const state = PKCE.generateState();

    this.storedCodeVerifier = verifier;
    this.storedState = state;

    const params = new URLSearchParams({
      client_id: CustomerAccountManager.clientId,
      redirect_uri: CustomerAccountManager.redirectUri,
      response_type: 'code',
      scope: 'openid email customer-account-api:full',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });

    return `${CustomerAccountManager.authorizationEndpoint}?${params.toString()}`;
  }

  async handleAuthCallback(code: string, state: string): Promise<void> {
    this.store.set(this.isLoadingAtom, true);
    try {
      const tokens = await this.exchangeCodeForTokens(code, state);
      const email = CustomerAccountManager.extractEmailFromIdToken(
        tokens.idToken,
      );
      this.store.set(this.sessionAtom, {
        isAuthenticated: true,
        email,
        tokenExpiresAt: tokens.expiresAt,
      });
    } finally {
      this.store.set(this.isLoadingAtom, false);
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    const tokens = await tokenStorage.getTokens();
    if (!tokens) {
      return null;
    }

    const isExpiringSoon =
      Date.now() + REFRESH_THRESHOLD_MS >= tokens.expiresAt;

    if (isExpiringSoon && tokens.refreshToken) {
      try {
        const refreshed = await this.refreshAccessToken();
        return refreshed.accessToken;
      } catch (error) {
        log('Token refresh failed, returning existing token', error);
        return tokens.accessToken;
      }
    }

    return tokens.accessToken;
  }

  async logout(): Promise<void> {
    const tokens = await tokenStorage.getTokens();
    await tokenStorage.clearTokens();

    if (tokens?.idToken) {
      try {
        const params = new URLSearchParams({
          id_token_hint: tokens.idToken,
        });
        await fetch(
          `${CustomerAccountManager.logoutEndpoint}?${params.toString()}`,
          {method: 'GET'},
        );
      } catch {
        log('Server-side logout request failed');
      }
    }

    this.store.set(this.sessionAtom, defaultSession);
    log('Logged out');
  }

  private static get shopId(): string {
    const shopId = Config.CUSTOMER_ACCOUNT_API_SHOP_ID;
    if (!shopId) {
      throw new Error('CUSTOMER_ACCOUNT_API_SHOP_ID is not configured');
    }
    return shopId;
  }

  private static get clientId(): string {
    const clientId = Config.CUSTOMER_ACCOUNT_API_CLIENT_ID;
    if (!clientId) {
      throw new Error('CUSTOMER_ACCOUNT_API_CLIENT_ID is not configured');
    }
    return clientId;
  }

  private static get authorizationEndpoint(): string {
    return `https://shopify.com/authentication/${CustomerAccountManager.shopId}/oauth/authorize`;
  }

  private static get tokenEndpoint(): string {
    return `https://shopify.com/authentication/${CustomerAccountManager.shopId}/oauth/token`;
  }

  private static get logoutEndpoint(): string {
    return `https://shopify.com/authentication/${CustomerAccountManager.shopId}/logout`;
  }

  private static extractEmailFromIdToken(
    idToken: string | null,
  ): string | null {
    if (!idToken) {
      return null;
    }

    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]!));
      return payload.email ?? null;
    } catch {
      log('Failed to extract email from ID token');
      return null;
    }
  }

  private async exchangeCodeForTokens(
    code: string,
    state: string,
  ): Promise<OAuthTokenResult> {
    if (state !== this.storedState) {
      throw new Error('Invalid state parameter');
    }

    if (!this.storedCodeVerifier) {
      throw new Error('Missing code verifier');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CustomerAccountManager.clientId,
      redirect_uri: CustomerAccountManager.redirectUri,
      code,
      code_verifier: this.storedCodeVerifier,
    });

    const response = await fetch(CustomerAccountManager.tokenEndpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    const tokens: OAuthTokenResult = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      expiresIn: data.expires_in,
      expiresAt: Date.now() + data.expires_in * 1000,
      idToken: data.id_token ?? null,
      tokenType: data.token_type,
    };

    await tokenStorage.saveTokens(tokens);

    const email = CustomerAccountManager.extractEmailFromIdToken(
      tokens.idToken,
    );
    if (email) {
      await tokenStorage.saveEmail(email);
    }

    this.storedCodeVerifier = null;
    this.storedState = null;

    log('Token exchange successful');
    return tokens;
  }

  private async refreshAccessToken(): Promise<OAuthTokenResult> {
    const existing = await tokenStorage.getTokens();
    if (!existing?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CustomerAccountManager.clientId,
      refresh_token: existing.refreshToken,
    });

    const response = await fetch(CustomerAccountManager.tokenEndpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const data: TokenResponse = await response.json();

    const tokens: OAuthTokenResult = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? existing.refreshToken,
      expiresIn: data.expires_in,
      expiresAt: Date.now() + data.expires_in * 1000,
      idToken: data.id_token ?? existing.idToken,
      tokenType: data.token_type,
    };

    await tokenStorage.saveTokens(tokens);

    log('Token refresh successful');
    return tokens;
  }

  private async restoreSession(): Promise<void> {
    try {
      const tokens = await tokenStorage.getTokens();
      const email = await tokenStorage.getEmail();

      if (!tokens) {
        this.store.set(this.sessionAtom, defaultSession);
        return;
      }

      const isExpired = Date.now() >= tokens.expiresAt;

      if (isExpired && tokens.refreshToken) {
        try {
          const refreshed = await this.refreshAccessToken();
          const refreshedEmail =
            CustomerAccountManager.extractEmailFromIdToken(
              refreshed.idToken,
            ) ?? email;
          this.store.set(this.sessionAtom, {
            isAuthenticated: true,
            email: refreshedEmail,
            tokenExpiresAt: refreshed.expiresAt,
          });
          return;
        } catch {
          await tokenStorage.clearTokens();
          this.store.set(this.sessionAtom, defaultSession);
          return;
        }
      }

      this.store.set(this.sessionAtom, {
        isAuthenticated: !isExpired,
        email,
        tokenExpiresAt: tokens.expiresAt,
      });
    } catch {
      this.store.set(this.sessionAtom, defaultSession);
    } finally {
      this.store.set(this.isLoadingAtom, false);
    }
  }
}

export const customerAccountManager = new CustomerAccountManager();
