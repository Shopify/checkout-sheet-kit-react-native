import {PKCE} from '../pkce';

const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;

describe('PKCE', () => {
  describe('generateCodeVerifier', () => {
    it('returns a base64url-encoded string', () => {
      const verifier = PKCE.generateCodeVerifier();
      expect(verifier).toMatch(BASE64URL_REGEX);
    });

    it('returns a string of 43 characters (32 bytes base64url)', () => {
      const verifier = PKCE.generateCodeVerifier();
      expect(verifier).toHaveLength(43);
    });
  });

  describe('generateCodeChallenge', () => {
    it('returns a base64url-encoded string', () => {
      const challenge = PKCE.generateCodeChallenge('test-verifier');
      expect(challenge).toMatch(BASE64URL_REGEX);
    });

    it('returns a string of 43 characters (SHA-256 hash base64url)', () => {
      const challenge = PKCE.generateCodeChallenge('test-verifier');
      expect(challenge).toHaveLength(43);
    });
  });

  describe('generateState', () => {
    it('returns a base64url-encoded string', () => {
      const state = PKCE.generateState();
      expect(state).toMatch(BASE64URL_REGEX);
    });

    it('returns a string of 36 characters (27 bytes base64url)', () => {
      const state = PKCE.generateState();
      expect(state).toHaveLength(36);
    });
  });

  describe('encapsulation', () => {
    it('does not expose base64URLEncode as a public method', () => {
      expect((PKCE as any).base64URLEncode).toBeUndefined();
    });
  });
});
