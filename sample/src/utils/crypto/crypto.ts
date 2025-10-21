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
 * Pure JavaScript crypto utilities for testing authentication flows.
 * This is slower than native implementations but simpler and has no native dependencies.
 *
 * Uses crypto-js library (https://www.npmjs.com/package/crypto-js)
 */

import CryptoJS from 'crypto-js';

/**
 * Computes SHA-256 hash of input string
 * @returns WordArray (crypto-js format)
 */
export function sha256(input: string): CryptoJS.lib.WordArray {
  return CryptoJS.SHA256(input);
}

/**
 * Computes HMAC-SHA256 of data with given key
 * @returns WordArray (crypto-js format)
 */
export function hmacSha256(
  data: CryptoJS.lib.WordArray,
  key: CryptoJS.lib.WordArray,
): CryptoJS.lib.WordArray {
  return CryptoJS.HmacSHA256(data, key);
}

/**
 * Converts WordArray to Uint8Array
 */
export function wordArrayToUint8Array(
  wordArray: CryptoJS.lib.WordArray,
): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);

  for (let i = 0; i < sigBytes; i++) {
    // eslint-disable-next-line no-bitwise
    const word = words[i >>> 2];
    if (word !== undefined) {
      // eslint-disable-next-line no-bitwise
      u8[i] = (word >>> (24 - (i % 4) * 8)) & 0xff;
    }
  }

  return u8;
}

/**
 * Converts Uint8Array to WordArray
 */
export function uint8ArrayToWordArray(u8arr: Uint8Array): CryptoJS.lib.WordArray {
  const len = u8arr.length;
  const words: number[] = [];

  for (let i = 0; i < len; i++) {
    // eslint-disable-next-line no-bitwise
    const idx = i >>> 2;
    if (words[idx] === undefined) {
      words[idx] = 0;
    }
    const byte = u8arr[i];
    if (byte !== undefined) {
      // eslint-disable-next-line no-bitwise
      words[idx] = (words[idx] ?? 0) | ((byte & 0xff) << (24 - (i % 4) * 8));
    }
  }

  return CryptoJS.lib.WordArray.create(words, len);
}

/**
 * Generates random bytes (using Math.random - NOT cryptographically secure)
 * For testing only!
 */
export function getRandomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}
