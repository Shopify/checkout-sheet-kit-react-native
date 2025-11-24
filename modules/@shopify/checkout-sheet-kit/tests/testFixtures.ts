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

import type {Cart} from '../src/events.d';

/**
 * Shared test fixtures for creating test objects.
 */

/**
 * Creates a test Cart instance with sensible defaults.
 *
 * @param overrides - Optional partial Cart object to override defaults
 * @returns A Cart instance suitable for testing
 *
 * @example
 * ```typescript
 * const cart = createTestCart();
 * const cartWithCustomId = createTestCart({ id: 'custom-id' });
 * ```
 */
export function createTestCart(overrides?: Partial<Cart>): Cart {
  return {
    id: 'gid://shopify/Cart/test-cart-123',
    lines: [],
    cost: {
      subtotalAmount: {
        amount: '100.00',
        currencyCode: 'USD',
      },
      totalAmount: {
        amount: '100.00',
        currencyCode: 'USD',
      },
    },
    buyerIdentity: {},
    deliveryGroups: [],
    discountCodes: [],
    appliedGiftCards: [],
    discountAllocations: [],
    delivery: {
      addresses: [
        {
          address: {
            countryCode: 'US',
            city: 'San Francisco',
            provinceCode: 'CA',
          },
        },
      ],
    },
    ...overrides,
  };
}

