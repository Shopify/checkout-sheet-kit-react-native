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

export enum CheckoutErrorCode {
  customerAccountRequired = 'customer_account_required',
  storefrontPasswordRequired = 'storefront_password_required',
  checkoutLiquidNotMigrated = 'checkout_liquid_not_migrated',
  cartExpired = 'cart_expired',
  cartCompleted = 'cart_completed',
  invalidCart = 'invalid_cart',
  unknown = 'unknown',
}

export interface ClientError {
  __typename: 'ClientError';
  code: CheckoutErrorCode;
}

export interface HTTPError {
  __typename: 'HTTPError';
  statusCode: number;
}

export interface GenericCheckoutError {
  message: string;
  recoverable: boolean;
}

export interface AuthenticationError extends GenericCheckoutError {
  __typename: 'AuthenticationError';
  code: CheckoutErrorCode;
}

export interface SDKError extends GenericCheckoutError {
  __typename: 'SDKError';
}

export interface ConfigurationError extends GenericCheckoutError {
  __typename: 'ConfigurationError';
  code: CheckoutErrorCode;
}

export interface CheckoutUnavailableError extends GenericCheckoutError {
  __typename: 'CheckoutUnavailableError';
  code: ClientError | HTTPError;
}

export interface CheckoutExpiredError extends GenericCheckoutError {
  __typename: 'CheckoutExpiredError';
  code: CheckoutErrorCode;
}

export type CheckoutException =
  | AuthenticationError
  | SDKError
  | ConfigurationError
  | CheckoutUnavailableError
  | CheckoutExpiredError;
