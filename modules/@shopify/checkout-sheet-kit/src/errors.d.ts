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

export enum CheckoutNativeErrorType {
  AuthenticationError = 'AuthenticationError',
  InternalError = 'InternalError',
  ConfigurationError = 'ConfigurationError',
  CheckoutClientError = 'CheckoutClientError',
  CheckoutHTTPError = 'CheckoutHTTPError',
  CheckoutExpiredError = 'CheckoutExpiredError',
  UnknownError = 'UnknownError',
}

export type CheckoutNativeError =
  | {
      __typename: CheckoutNativeErrorType;
      message: string;
      recoverable: boolean;
    }
  | {
      __typename: CheckoutNativeErrorType;
      code: string;
      message: string;
      recoverable: boolean;
    }
  | {
      __typename: CheckoutNativeErrorType;
      message: string;
      recoverable: boolean;
      statusCode: number;
    };

class GenericErrorWithCode {
  message: string;
  recoverable: boolean;
  code: string;

  constructor(exception: CheckoutNativeError) {
    this.code = exception.code;
    this.message = exception.message;
    this.recoverable = exception.recoverable;
    this.name = this.constructor.name;
  }
}

class GenericNetworkError {
  message: string;
  recoverable: boolean;
  statusCode: number;

  constructor(exception: CheckoutNativeError) {
    this.statusCode = exception.statusCode;
    this.message = exception.message;
    this.recoverable = exception.recoverable;
    this.name = this.constructor.name;
  }
}

export class AuthenticationError extends GenericErrorWithCode {}
export class ConfigurationError extends GenericErrorWithCode {}
export class CheckoutClientError extends GenericErrorWithCode {}
export class CheckoutExpiredError extends GenericErrorWithCode {}
export class CheckoutHTTPError extends GenericNetworkError {}

export class InternalError {
  message: string;
  recoverable: boolean;

  constructor(exception: CheckoutNativeError) {
    this.message = exception.message;
    this.recoverable = exception.recoverable;
  }
}

export type CheckoutException =
  | AuthenticationError
  | InternalError
  | ConfigurationError
  | CheckoutClientError
  | CheckoutHTTPError
  | CheckoutExpiredError;
