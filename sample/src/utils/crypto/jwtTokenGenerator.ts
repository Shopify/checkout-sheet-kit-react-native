/*
MIT License

Copyright 2023 - Present, Shopify Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * ⚠️ WARNING: FOR TESTING ONLY ⚠️
 *
 * This is a sample implementation for testing authentication flows.
 * DO NOT USE IN PRODUCTION. JWT tokens must be generated server-side.
 *
 * This mirrors the Swift JWTTokenGenerator implementation for compatibility.
 * Uses crypto-js for pure JavaScript implementation (no native dependencies).
 */

import CryptoJS from 'crypto-js';
import {Buffer} from 'buffer';
import {encryptAndSignBase64URLSafe} from './accessTokenEncryptor';

/** JWT header field keys */
const JWTHeaderKey = {
  algorithm: 'alg',
} as const;

/** JWT header field values */
const JWTHeaderValue = {
  hmacSHA256: 'HS256',
} as const;

/** JWT payload field keys */
const JWTPayloadKey = {
  apiKey: 'api_key',
  accessToken: 'access_token',
  issuedAt: 'iat',
  jwtID: 'jti',
} as const;

/**
 * Generates a JWT authentication token for authenticated checkouts
 *
 * @param apiKey - The app's API key
 * @param sharedSecret - The app's shared secret
 * @param accessToken - The app's access token
 * @returns JWT token string, or null if generation fails
 */
export function generateAuthToken(
  apiKey: string,
  sharedSecret: string,
  accessToken: string,
): string | null {
  try {
    // Encrypt the access token
    const encryptedAccessToken = encryptAndSignBase64URLSafe(
      accessToken,
      sharedSecret,
    );

    if (!encryptedAccessToken) {
      console.error('[JWTTokenGenerator] Failed to encrypt access token');
      return null;
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const jti = generateUUID();

    const payload = {
      [JWTPayloadKey.apiKey]: apiKey,
      [JWTPayloadKey.accessToken]: encryptedAccessToken,
      [JWTPayloadKey.issuedAt]: issuedAt,
      [JWTPayloadKey.jwtID]: jti,
    };

    return encodeJWT(payload, sharedSecret);
  } catch (error) {
    console.error('[JWTTokenGenerator] Token generation failed:', error);
    return null;
  }
}

/**
 * Encodes a JWT with HS256 (HMAC-SHA256) signature
 *
 * @param payload - The JWT payload as an object
 * @param secret - The shared secret for HMAC signing
 * @returns Complete JWT string (header.payload.signature), or null if encoding fails
 */
function encodeJWT(
  payload: Record<string, any>,
  secret: string,
): string | null {
  try {
    const header = {
      [JWTHeaderKey.algorithm]: JWTHeaderValue.hmacSHA256,
    };

    // Create base64url-encoded header and payload
    const headerBase64 = base64URLEncode(JSON.stringify(header));
    const payloadBase64 = base64URLEncode(JSON.stringify(payload));

    // Create signing input: "header.payload"
    const signingInput = `${headerBase64}.${payloadBase64}`;

    // Sign with HMAC-SHA256 using crypto-js
    const signature = CryptoJS.HmacSHA256(signingInput, secret);

    // Convert signature to base64url
    const signatureBase64 = signature
      .toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/[=]/g, '');

    // Return complete JWT: "header.payload.signature"
    return `${signingInput}.${signatureBase64}`;
  } catch (error) {
    console.error('[JWTTokenGenerator] JWT encoding failed:', error);
    return null;
  }
}

/**
 * Encodes string as base64url (RFC 4648 Section 5)
 */
function base64URLEncode(input: string): string {
  // Use Buffer for base64 encoding (available in React Native)
  const base64 = Buffer.from(input, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
}

/**
 * Generates a UUID v4 string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
