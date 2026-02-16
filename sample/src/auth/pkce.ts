import crypto from 'react-native-quick-crypto';

function base64URLEncode(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
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
    const bytes = crypto.randomBytes(32);
    return base64URLEncode(bytes.buffer);
  }

  static generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return base64URLEncode(hash.buffer);
  }

  static generateState(): string {
    const bytes = crypto.randomBytes(27);
    return base64URLEncode(bytes.buffer);
  }
}
