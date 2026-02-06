import SHA256 from 'crypto-js/sha256';
import WordArray from 'crypto-js/lib-typedarrays';
import Base64 from 'crypto-js/enc-base64';

function base64URLEncode(wordArray: CryptoJS.lib.WordArray): string {
  return Base64.stringify(wordArray)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  const randomBytes = WordArray.random(32);
  return base64URLEncode(randomBytes);
}

export function generateCodeChallenge(verifier: string): string {
  const hash = SHA256(verifier);
  return base64URLEncode(hash);
}

export function generateState(): string {
  const randomBytes = WordArray.random(27);
  return base64URLEncode(randomBytes);
}
