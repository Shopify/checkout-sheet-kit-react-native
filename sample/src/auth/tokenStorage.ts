import EncryptedStorage from 'react-native-encrypted-storage';
import type {OAuthTokenResult} from './types';

const TOKENS_KEY = 'customer_account_tokens';
const EMAIL_KEY = 'customer_account_email';

export async function saveTokens(tokens: OAuthTokenResult): Promise<void> {
  await EncryptedStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export async function getTokens(): Promise<OAuthTokenResult | null> {
  const raw = await EncryptedStorage.getItem(TOKENS_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as OAuthTokenResult;
}

export async function clearTokens(): Promise<void> {
  await EncryptedStorage.removeItem(TOKENS_KEY);
  await EncryptedStorage.removeItem(EMAIL_KEY);
}

export async function saveEmail(email: string): Promise<void> {
  await EncryptedStorage.setItem(EMAIL_KEY, email);
}

export async function getEmail(): Promise<string | null> {
  return EncryptedStorage.getItem(EMAIL_KEY);
}
