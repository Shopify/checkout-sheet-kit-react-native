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
  invalidPayload = 'invalid_payload',

  /**
   * The app authentication JWT signature or encrypted token signature was invalid.
   */
  invalidSignature = 'invalid_signature',

  /**
   * The app authentication access token was not valid for the shop.
   */
  notAuthorized = 'not_authorized',

  /**
   * The provided app authentication payload has expired.
   */
  payloadExpired = 'payload_expired',

  /**
   * The buyer must be logged in to a customer account to proceed with checkout.
   */
  customerAccountRequired = 'customer_account_required',

  /**
   * The storefront requires a password to access checkout.
   */
  storefrontPasswordRequired = 'storefront_password_required',

  // ============================================================================
  // Cart errors
  // ============================================================================

  /**
   * The cart associated with the checkout has already been completed.
   */
  cartCompleted = 'cart_completed',

  /**
   * The cart is invalid or no longer exists.
   */
  invalidCart = 'invalid_cart',

  // ============================================================================
  // Client errors
  // ============================================================================

  /**
   * Checkout preloading has been temporarily disabled via killswitch.
   */
  killswitchEnabled = 'killswitch_enabled',

  /**
   * An unrecoverable error occurred during checkout.
   */
  unrecoverableFailure = 'unrecoverable_failure',

  /**
   * A policy violation was detected during checkout.
   */
  policyViolation = 'policy_violation',

  /**
   * An error occurred processing a vaulted payment method.
   */
  vaultedPaymentError = 'vaulted_payment_error',

  // ============================================================================
  // Internal errors
  // ============================================================================

  /**
   * A client-side error occurred in the SDK.
   */
  clientError = 'client_error',

  /**
   * An HTTP error occurred while communicating with the checkout.
   */
  httpError = 'http_error',

  /**
   * Failed to send a message to the checkout bridge.
   */
  sendingBridgeEventError = 'error_sending_message',

  /**
   * Failed to receive a message from the checkout bridge.
   */
  receivingBridgeEventError = 'error_receiving_message',

  /**
   * The WebView render process has terminated unexpectedly (Android only).
   */
  renderProcessGone = 'render_process_gone',

  // ============================================================================
  // Fallback
  // ============================================================================

  /**
   * An unknown or unrecognized error code was received.
   */
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

/**
 * Maps a native error code string to a CheckoutErrorCode enum value.
 */
function getCheckoutErrorCode(code: string | undefined): CheckoutErrorCode {
  if (!code) {
    return CheckoutErrorCode.unknown;
  }

  const normalizedCode = code.toLowerCase();

  const codeKey = Object.keys(CheckoutErrorCode).find(
    key => CheckoutErrorCode[key as keyof typeof CheckoutErrorCode] === normalizedCode,
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
