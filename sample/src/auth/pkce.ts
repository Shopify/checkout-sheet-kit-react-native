import {sha256} from '@noble/hashes/sha2.js';
import {randomBytes, utf8ToBytes} from '@noble/hashes/utils.js';

function base64URLEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]/g, '');
}

export class PKCE {
  static generateCodeVerifier(): string {
    return base64URLEncode(randomBytes(32));
  }

  static generateCodeChallenge(verifier: string): string {
    return base64URLEncode(sha256(utf8ToBytes(verifier)));
  }

  static generateState(): string {
    return base64URLEncode(randomBytes(27));
  }
}
