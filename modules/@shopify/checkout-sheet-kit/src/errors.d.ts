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
 * Error codes that can be returned from checkout errors.
 */
export enum CheckoutErrorCode {
  // ============================================================================
  // Configuration errors
  // ============================================================================

  /**
   * The app authentication payload passed could not be decoded.
   */
  invalidPayload = 'INVALID_PAYLOAD',

  /**
   * The app authentication JWT signature or encrypted token signature was invalid.
   */
  invalidSignature = 'INVALID_SIGNATURE',

  /**
   * The app authentication access token was not valid for the shop.
   */
  notAuthorized = 'NOT_AUTHORIZED',

  /**
   * The provided app authentication payload has expired.
   */
  payloadExpired = 'PAYLOAD_EXPIRED',

  /**
   * The buyer must be logged in to a customer account to proceed with checkout.
   */
  customerAccountRequired = 'CUSTOMER_ACCOUNT_REQUIRED',

  /**
   * The storefront requires a password to access checkout.
   */
  storefrontPasswordRequired = 'STOREFRONT_PASSWORD_REQUIRED',

  // ============================================================================
  // Cart errors
  // ============================================================================

  /**
   * The cart associated with the checkout has already been completed.
   */
  cartCompleted = 'CART_COMPLETED',

  /**
   * The cart is invalid or no longer exists.
   */
  invalidCart = 'INVALID_CART',

  // ============================================================================
  // Client errors
  // ============================================================================

  /**
   * Checkout preloading has been temporarily disabled via killswitch.
   */
  killswitchEnabled = 'KILLSWITCH_ENABLED',

  /**
   * An unrecoverable error occurred during checkout.
   */
  unrecoverableFailure = 'UNRECOVERABLE_FAILURE',

  /**
   * A policy violation was detected during checkout.
   */
  policyViolation = 'POLICY_VIOLATION',

  /**
   * An error occurred processing a vaulted payment method.
   */
  vaultedPaymentError = 'VAULTED_PAYMENT_ERROR',

  // ============================================================================
  // Internal errors
  // ============================================================================

  /**
   * A client-side error occurred in the SDK.
   */
  clientError = 'CLIENT_ERROR',

  /**
   * An HTTP error occurred while communicating with the checkout.
   */
  httpError = 'HTTP_ERROR',

  /**
   * Failed to send a message to the checkout bridge.
   */
  errorSendingMessage = 'ERROR_SENDING_MESSAGE',

  /**
   * Failed to receive a message from the checkout bridge.
   */
  errorReceivingMessage = 'ERROR_RECEIVING_MESSAGE',

  /**
   * The WebView render process has terminated unexpectedly (Android only).
   */
  renderProcessGone = 'RENDER_PROCESS_GONE',

  // ============================================================================
  // Fallback
  // ============================================================================

  /**
   * An unknown or unrecognized error code was received.
   */
  unknown = 'UNKNOWN',
}

export enum CheckoutNativeErrorType {
  InternalError = 'InternalError',
  ConfigurationError = 'ConfigurationError',
  CheckoutClientError = 'CheckoutClientError',
  CheckoutHTTPError = 'CheckoutHTTPError',
  CheckoutExpiredError = 'CheckoutExpiredError',
  UnknownError = 'UnknownError',
}

/**
 * Maps a native error code string to a CheckoutErrorCode enum value.
 * Handles both SCREAMING_SNAKE_CASE and snake_case formats for compatibility.
 */
function getCheckoutErrorCode(code: string | undefined): CheckoutErrorCode {
  if (!code) {
    return CheckoutErrorCode.unknown;
  }

  const normalizedCode = code.toUpperCase();

  const codeKey = Object.keys(CheckoutErrorCode).find(
    key =>
      CheckoutErrorCode[key as keyof typeof CheckoutErrorCode] ===
      normalizedCode,
  );

  return codeKey
    ? CheckoutErrorCode[codeKey as keyof typeof CheckoutErrorCode]
    : CheckoutErrorCode.unknown;
}

type BridgeError = {
  __typename: CheckoutNativeErrorType;
  code: string;
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
  name: string;

  constructor(exception: CheckoutNativeError) {
    this.code = getCheckoutErrorCode(exception.code);
    this.message = exception.message;
    this.recoverable = exception.recoverable;
    this.name = this.constructor.name;
  }
}

export type CheckoutException =
  | CheckoutClientError
  | CheckoutExpiredError
  | CheckoutHTTPError
  | ConfigurationError
  | GenericError
  | InternalError;

/**
 * Transforms a native error object into the appropriate CheckoutException class.
 * Maps __typename to the correct error class and normalizes error codes.
 *
 * @param exception Raw error object from native bridge
 * @returns Appropriate CheckoutException instance
 */
export function parseCheckoutError(
  exception: CheckoutNativeError,
): CheckoutException {
  switch (exception?.__typename) {
    case CheckoutNativeErrorType.InternalError:
      return new InternalError(exception);
    case CheckoutNativeErrorType.ConfigurationError:
      return new ConfigurationError(exception);
    case CheckoutNativeErrorType.CheckoutClientError:
      return new CheckoutClientError(exception);
    case CheckoutNativeErrorType.CheckoutHTTPError:
      return new CheckoutHTTPError(exception);
    case CheckoutNativeErrorType.CheckoutExpiredError:
      return new CheckoutExpiredError(exception);
    default:
      return new GenericError(exception);
  }
}
