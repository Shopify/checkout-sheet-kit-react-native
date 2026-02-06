import Config from 'react-native-config';
import {generateCodeVerifier, generateCodeChallenge, generateState} from './pkce';
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

const log = createDebugLogger('CustomerAccount');

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

function getShopId(): string {
  const shopId = Config.CUSTOMER_ACCOUNT_API_SHOP_ID;
  if (!shopId) {
    throw new Error('CUSTOMER_ACCOUNT_API_SHOP_ID is not configured');
  }
  return shopId;
}

function getClientId(): string {
  const clientId = Config.CUSTOMER_ACCOUNT_API_CLIENT_ID;
  if (!clientId) {
    throw new Error('CUSTOMER_ACCOUNT_API_CLIENT_ID is not configured');
  }
  return clientId;
}

function getAuthorizationEndpoint(): string {
  return `https://shopify.com/authentication/${getShopId()}/oauth/authorize`;
}

function getTokenEndpoint(): string {
  return `https://shopify.com/authentication/${getShopId()}/oauth/token`;
}

function getLogoutEndpoint(): string {
  return `https://shopify.com/authentication/${getShopId()}/logout`;
}

export function getRedirectUri(): string {
  return `shop.${getShopId()}.app://callback`;
}

export function getCallbackScheme(): string {
  return `shop.${getShopId()}.app`;
}

let storedCodeVerifier: string | null = null;
let storedState: string | null = null;

export function buildAuthorizationURL(): string {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  storedCodeVerifier = verifier;
  storedState = state;

  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email customer-account-api:full',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  return `${getAuthorizationEndpoint()}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  state: string,
): Promise<OAuthTokenResult> {
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }

  if (!storedCodeVerifier) {
    throw new Error('Missing code verifier');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    code,
    code_verifier: storedCodeVerifier,
  });

  const response = await fetch(getTokenEndpoint(), {
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

  const email = extractEmailFromIdToken(tokens.idToken);
  if (email) {
    await tokenStorage.saveEmail(email);
  }

  storedCodeVerifier = null;
  storedState = null;

  log('Token exchange successful');
  return tokens;
}

export async function refreshAccessToken(): Promise<OAuthTokenResult> {
  const existing = await tokenStorage.getTokens();
  if (!existing?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: getClientId(),
    refresh_token: existing.refreshToken,
  });

  const response = await fetch(getTokenEndpoint(), {
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

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await tokenStorage.getTokens();
  if (!tokens) {
    return null;
  }

  const isExpiringSoon = Date.now() + REFRESH_THRESHOLD_MS >= tokens.expiresAt;

  if (isExpiringSoon && tokens.refreshToken) {
    try {
      const refreshed = await refreshAccessToken();
      return refreshed.accessToken;
    } catch (error) {
      log('Token refresh failed, returning existing token', error);
      return tokens.accessToken;
    }
  }

  return tokens.accessToken;
}

export function extractEmailFromIdToken(idToken: string | null): string | null {
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

export async function logout(): Promise<void> {
  const tokens = await tokenStorage.getTokens();
  await tokenStorage.clearTokens();

  if (tokens?.idToken) {
    try {
      const params = new URLSearchParams({
        id_token_hint: tokens.idToken,
      });
      await fetch(`${getLogoutEndpoint()}?${params.toString()}`, {
        method: 'POST',
      });
    } catch {
      log('Server-side logout request failed');
    }
  }

  log('Logged out');
}

export async function checkExistingSession(): Promise<{
  isAuthenticated: boolean;
  email: string | null;
  tokenExpiresAt: number | null;
}> {
  const tokens = await tokenStorage.getTokens();
  const email = await tokenStorage.getEmail();

  if (!tokens) {
    return {isAuthenticated: false, email: null, tokenExpiresAt: null};
  }

  const isExpired = Date.now() >= tokens.expiresAt;

  if (isExpired && tokens.refreshToken) {
    try {
      const refreshed = await refreshAccessToken();
      const refreshedEmail = extractEmailFromIdToken(refreshed.idToken) ?? email;
      return {
        isAuthenticated: true,
        email: refreshedEmail,
        tokenExpiresAt: refreshed.expiresAt,
      };
    } catch {
      await tokenStorage.clearTokens();
      return {isAuthenticated: false, email: null, tokenExpiresAt: null};
    }
  }

  return {
    isAuthenticated: !isExpired,
    email,
    tokenExpiresAt: tokens.expiresAt,
  };
}
