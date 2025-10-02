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
  storefrontPasswordRequired = 'storefront_password_required',
  cartExpired = 'cart_expired',
  cartCompleted = 'cart_completed',
  invalidCart = 'invalid_cart',
  clientError = 'client_error',
  httpError = 'http_error',
  sendingBridgeEventError = 'error_sending_message',
  receivingBridgeEventError = 'error_receiving_message',
  renderProcessGone = 'render_process_gone',
  unknown = 'unknown',
}

export enum CheckoutNativeErrorType {
  InternalError = 'InternalError',
  ConfigurationError = 'ConfigurationError',
  CheckoutClientError = 'CheckoutClientError',
  CheckoutHTTPError = 'CheckoutHTTPError',
  CheckoutExpiredError = 'CheckoutExpiredError',
  UnknownError = 'UnknownError',
}

function getCheckoutErrorCode(code: string | undefined): CheckoutErrorCode {
  const codeKey = Object.keys(CheckoutErrorCode).find(
    key => CheckoutErrorCode[key as keyof typeof CheckoutErrorCode] === code,
  );

  return codeKey ? CheckoutErrorCode[codeKey] : CheckoutErrorCode.unknown;
}

type BridgeError = {
  __typename: CheckoutNativeErrorType;
  code: CheckoutErrorCode;
  message: string;
  recoverable: boolean;
};

export type CheckoutNativeError =
  | BridgeError
  | (BridgeError & {statusCode: number});

class GenericErrorWithCode {
  message: string;
  recoverable: boolean;
  code: CheckoutErrorCode;

  constructor(exception: CheckoutNativeError) {
    this.code = getCheckoutErrorCode(exception.code);
    this.message = exception.message;
    this.recoverable = exception.recoverable;
    this.name = this.constructor.name;
  }
}

class GenericNetworkError {
  code: CheckoutErrorCode;
  message: string;
  recoverable: boolean;
  statusCode: number;

  constructor(exception: CheckoutNativeError) {
    this.code = getCheckoutErrorCode(exception.code);
    this.statusCode = exception.statusCode;
    this.message = exception.message;
    this.recoverable = exception.recoverable;
    this.name = this.constructor.name;
  }
}

export class ConfigurationError extends GenericErrorWithCode {}
export class CheckoutClientError extends GenericErrorWithCode {}
export class CheckoutExpiredError extends GenericErrorWithCode {}
export class CheckoutHTTPError extends GenericNetworkError {}

export class GenericError {
  code: CheckoutErrorCode;
  message?: string;
  recoverable: boolean;
  statusCode?: number;
  name: string;

  constructor(exception?: CheckoutNativeError) {
    this.code = getCheckoutErrorCode(exception?.code);
    this.message = exception?.message;
    this.name = this.constructor.name;
    this.recoverable = exception?.recoverable ?? false;
    this.statusCode = exception?.statusCode;
  }
}

export class InternalError {
  code: CheckoutErrorCode;
  message: string;
  recoverable: boolean;

  constructor(exception: CheckoutNativeError) {
    this.code = getCheckoutErrorCode(exception.code);
    this.message = exception.message;
    this.recoverable = exception.recoverable;
  }
}

export type CheckoutException =
  | CheckoutClientError
  | CheckoutExpiredError
  | CheckoutHTTPError
  | ConfigurationError
  | GenericError
  | InternalError;
