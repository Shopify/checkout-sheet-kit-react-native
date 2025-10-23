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

export interface CustomerData {
  email?: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
}

/**
 * Default shop domain for cart permalink
 * Using buy-for-me-store with variant ID 63445659779094 (Sneakers)
 */
export const DEFAULT_SHOP_DOMAIN = 'buy-for-me-store.myshopify.com';

/**
 * Demo customer data for testing cart permalink with prefilled checkout fields
 */
export const DEMO_CUSTOMER: CustomerData = {
  email: 'test.user@shopify.com',
  firstName: 'Test',
  lastName: 'User',
  address1: '33 New Montgomery St',
  address2: 'Suite 750',
  city: 'San Francisco',
  province: 'CA',
  zip: '94105',
  country: 'United States',
};

/**
 * Extracts numeric variant ID from Shopify GID format
 * @param variantId Either a Shopify GID (gid://shopify/ProductVariant/123) or numeric ID
 * @returns Numeric variant ID as string
 */
function extractNumericVariantId(variantId: string): string {
  if (variantId.startsWith('gid://')) {
    // Extract last segment from GID format
    const segments = variantId.split('/');
    const numericId = segments[segments.length - 1];
    return numericId || variantId;
  }
  return variantId;
}

/**
 * Builds a Shopify cart permalink URL with optional customer data prefill
 *
 * @param variantId Product variant ID (can be GID format or numeric)
 * @param quantity Quantity to add to cart
 * @param shopDomain The Shopify store domain (defaults to DEFAULT_SHOP_DOMAIN)
 * @param customerData Customer data to prefill checkout fields (defaults to DEMO_CUSTOMER)
 * @returns Complete cart permalink URL
 *
 * @example
 * ```typescript
 * // Using all defaults (shop domain and customer data)
 * const url = buildCartPermalink('63445659779094', 1);
 * // Returns: https://buy-for-me-store.myshopify.com/cart/63445659779094:1?checkout[email]=...
 *
 * // Custom shop domain, default customer data
 * const url = buildCartPermalink('63445659779094', 1, 'my-shop.myshopify.com');
 *
 * // Custom everything
 * const url = buildCartPermalink(
 *   '63445659779094',
 *   1,
 *   'my-shop.myshopify.com',
 *   {
 *     email: 'custom@example.com',
 *     firstName: 'Jane',
 *     lastName: 'Doe',
 *   }
 * );
 * ```
 */
export function buildCartPermalink(
  variantId: string,
  quantity: number,
  shopDomain: string = DEFAULT_SHOP_DOMAIN,
  customerData: CustomerData = DEMO_CUSTOMER,
): string {
  const numericId = extractNumericVariantId(variantId);
  const url = new URL(`https://${shopDomain}/cart/${numericId}:${quantity}`);

  // Add checkout prefill parameters
  if (customerData) {
    if (customerData.email) {
      url.searchParams.append('checkout[email]', customerData.email);
    }
    if (customerData.firstName) {
      url.searchParams.append(
        'checkout[shipping_address][first_name]',
        customerData.firstName,
      );
    }
    if (customerData.lastName) {
      url.searchParams.append(
        'checkout[shipping_address][last_name]',
        customerData.lastName,
      );
    }
    if (customerData.address1) {
      url.searchParams.append(
        'checkout[shipping_address][address1]',
        customerData.address1,
      );
    }
    if (customerData.address2) {
      url.searchParams.append(
        'checkout[shipping_address][address2]',
        customerData.address2,
      );
    }
    if (customerData.city) {
      url.searchParams.append(
        'checkout[shipping_address][city]',
        customerData.city,
      );
    }
    if (customerData.province) {
      url.searchParams.append(
        'checkout[shipping_address][province]',
        customerData.province,
      );
    }
    if (customerData.zip) {
      url.searchParams.append(
        'checkout[shipping_address][zip]',
        customerData.zip,
      );
    }
    if (customerData.country) {
      url.searchParams.append(
        'checkout[shipping_address][country]',
        customerData.country,
      );
    }
  }

  return url.toString();
}

