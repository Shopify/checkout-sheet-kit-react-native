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
 * This mirrors the Swift AccessTokenEncryptor implementation for compatibility.
 * Uses crypto-js for pure JavaScript implementation (no native dependencies).
 */

import CryptoJS from 'crypto-js';
import {Buffer} from 'buffer';
import {
  sha256,
  hmacSha256,
  wordArrayToUint8Array,
  uint8ArrayToWordArray,
  getRandomBytes,
} from './crypto';

const AES_128_KEY_SIZE = 16; // 128 bits = 16 bytes

/**
 * Encrypts an access token using AES-128-CBC with HMAC-SHA256 signature
 * Matches the Swift implementation in AccessTokenEncryptor.swift
 *
 * @param plaintext - The access token to encrypt
 * @param secret - The shared secret
 * @returns Base64url-encoded encrypted data, or null if encryption fails
 */
export function encryptAndSignBase64URLSafe(
  plaintext: string,
  secret: string,
): string | null {
  try {
    // Derive keys from the shared secret using SHA-256
    // Splits the 32-byte hash into two 16-byte keys:
    // - Bytes 0-15: encryption key
    // - Bytes 16-31: signature key
    const secretHash = sha256(secret);
    const secretHashBytes = wordArrayToUint8Array(secretHash);

    const encryptionKeyBytes = secretHashBytes.slice(0, AES_128_KEY_SIZE);
    const signatureKeyBytes = secretHashBytes.slice(AES_128_KEY_SIZE);

    const encryptionKey = uint8ArrayToWordArray(encryptionKeyBytes);
    const signatureKey = uint8ArrayToWordArray(signatureKeyBytes);

    // Generate random IV (16 bytes)
    const ivBytes = getRandomBytes(AES_128_KEY_SIZE);
    const iv = uint8ArrayToWordArray(ivBytes);

    // Encrypt using AES-128-CBC
    const encrypted = CryptoJS.AES.encrypt(plaintext, encryptionKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const ciphertextBytes = wordArrayToUint8Array(encrypted.ciphertext);

    // Combine IV + ciphertext
    const combined = new Uint8Array(ivBytes.length + ciphertextBytes.length);
    combined.set(ivBytes, 0);
    combined.set(ciphertextBytes, ivBytes.length);

    // Sign the combined data
    const combinedWordArray = uint8ArrayToWordArray(combined);
    const signatureWordArray = hmacSha256(combinedWordArray, signatureKey);
    const signatureBytes = wordArrayToUint8Array(signatureWordArray);

    // Combine everything: IV + ciphertext + signature
    const signedData = new Uint8Array(
      combined.length + signatureBytes.length,
    );
    signedData.set(combined, 0);
    signedData.set(signatureBytes, combined.length);

    // Return base64url-encoded result
    return base64URLEncode(signedData);
  } catch (error) {
    console.error('[AccessTokenEncryptor] Encryption failed:', error);
    return null;
  }
}

/**
 * Encodes Uint8Array as base64url (RFC 4648 Section 5)
 */
function base64URLEncode(data: Uint8Array): string {
  // Use Buffer for base64 encoding (available in React Native)
  const base64 = Buffer.from(data).toString('base64');

  // Convert to base64url (no padding, URL-safe characters)
  // eslint-disable-next-line no-div-regex
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
