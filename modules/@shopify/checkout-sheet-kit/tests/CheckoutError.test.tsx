// Mock the native view component BEFORE imports
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = jest.requireActual('react');

  RN.UIManager.getViewManagerConfig = jest.fn(() => ({
    Commands: {},
  }));

  // Create mock component
  const MockRCTCheckoutWebView = (props: any) => {
    return React.createElement('View', props);
  };

  return Object.setPrototypeOf(
    {
      requireNativeComponent: jest.fn(() => MockRCTCheckoutWebView),
    },
    RN,
  );
});

import React from 'react';
import {render, act} from '@testing-library/react-native';
import {ShopifyCheckout} from '../src/components/Checkout';
import {
  CheckoutErrorCode,
  ConfigurationError,
  CheckoutClientError,
  CheckoutExpiredError,
  CheckoutHTTPError,
  InternalError,
  GenericError,
} from '../src/errors.d';

describe('Checkout Component - Error Events', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  describe('error transformation', () => {
    it('transforms native error to ConfigurationError class', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'ConfigurationError',
            code: 'STOREFRONT_PASSWORD_REQUIRED',
            message: 'Storefront password required',
            recoverable: false,
          },
        });
      });

      expect(onFail).toHaveBeenCalledTimes(1);

      const receivedError = onFail.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(ConfigurationError);
      expect(receivedError.code).toBe(
        CheckoutErrorCode.storefrontPasswordRequired,
      );
      expect(receivedError.message).toBe('Storefront password required');
      expect(receivedError.recoverable).toBe(false);
      // Should not expose __typename
      expect(receivedError).not.toHaveProperty('__typename');
    });

    it('transforms native error to CheckoutClientError class', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'CheckoutClientError',
            code: 'KILLSWITCH_ENABLED',
            message: 'Checkout unavailable',
            recoverable: false,
          },
        });
      });

      expect(onFail).toHaveBeenCalledTimes(1);

      const receivedError = onFail.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(CheckoutClientError);
      // KILLSWITCH_ENABLED is now in the enum
      expect(receivedError.code).toBe(CheckoutErrorCode.killswitchEnabled);
      expect(receivedError.message).toBe('Checkout unavailable');
    });

    it('transforms native error to CheckoutExpiredError class', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'CheckoutExpiredError',
            code: 'CART_COMPLETED',
            message: 'Cart already completed',
            recoverable: false,
          },
        });
      });

      expect(onFail).toHaveBeenCalledTimes(1);

      const receivedError = onFail.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(CheckoutExpiredError);
      expect(receivedError.code).toBe(CheckoutErrorCode.cartCompleted);
      expect(receivedError.message).toBe('Cart already completed');
    });

    it.each([
      // Configuration errors
      {nativeCode: 'INVALID_PAYLOAD', expectedCode: CheckoutErrorCode.invalidPayload},
      {nativeCode: 'INVALID_SIGNATURE', expectedCode: CheckoutErrorCode.invalidSignature},
      {nativeCode: 'NOT_AUTHORIZED', expectedCode: CheckoutErrorCode.notAuthorized},
      {nativeCode: 'PAYLOAD_EXPIRED', expectedCode: CheckoutErrorCode.payloadExpired},
      {nativeCode: 'CUSTOMER_ACCOUNT_REQUIRED', expectedCode: CheckoutErrorCode.customerAccountRequired},
      {nativeCode: 'STOREFRONT_PASSWORD_REQUIRED', expectedCode: CheckoutErrorCode.storefrontPasswordRequired},
      // Expired checkout errors
      {nativeCode: 'CART_COMPLETED', expectedCode: CheckoutErrorCode.cartCompleted},
      {nativeCode: 'INVALID_CART', expectedCode: CheckoutErrorCode.invalidCart},
      // Client errors
      {nativeCode: 'KILLSWITCH_ENABLED', expectedCode: CheckoutErrorCode.killswitchEnabled},
      {nativeCode: 'UNRECOVERABLE_FAILURE', expectedCode: CheckoutErrorCode.unrecoverableFailure},
      {nativeCode: 'POLICY_VIOLATION', expectedCode: CheckoutErrorCode.policyViolation},
      {nativeCode: 'VAULTED_PAYMENT_ERROR', expectedCode: CheckoutErrorCode.vaultedPaymentError},
    ])(
      'maps native code $nativeCode to CheckoutErrorCode enum',
      ({nativeCode, expectedCode}) => {
        const onFail = jest.fn();

        const {getByTestId} = render(
          <ShopifyCheckout
            checkoutUrl={mockCheckoutUrl}
            onFail={onFail}
            testID="checkout-webview"
          />,
        );

        const nativeComponent = getByTestId('checkout-webview');

        act(() => {
          nativeComponent.props.onError({
            nativeEvent: {
              __typename: 'ConfigurationError',
              code: nativeCode,
              message: `Test error for ${nativeCode}`,
              recoverable: false,
            },
          });
        });

        const receivedError = onFail.mock.calls[0][0];
        expect(receivedError.code).toBe(expectedCode);
      },
    );
  });

  it('does not crash when onFail prop is not provided', () => {
    const {getByTestId} = render(
      <ShopifyCheckout checkoutUrl={mockCheckoutUrl} testID="checkout-webview" />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    expect(() => {
      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'ConfigurationError',
            code: 'STOREFRONT_PASSWORD_REQUIRED',
            message: 'Test error',
            recoverable: false,
          },
        });
      });
    }).not.toThrow();
  });

  describe('error object structure', () => {
    it('ConfigurationError has correct properties', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'ConfigurationError',
            code: 'INVALID_PAYLOAD',
            message: 'The authentication payload could not be decoded',
            recoverable: false,
          },
        });
      });

      const error = onFail.mock.calls[0][0];

      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error).toMatchObject({
        code: CheckoutErrorCode.invalidPayload,
        message: 'The authentication payload could not be decoded',
        recoverable: false,
        name: 'ConfigurationError',
      });
      expect(error).not.toHaveProperty('__typename');
      expect(error).not.toHaveProperty('statusCode');
    });

    it('CheckoutClientError has correct properties', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'CheckoutClientError',
            code: 'UNRECOVERABLE_FAILURE',
            message: 'An unrecoverable error occurred',
            recoverable: false,
          },
        });
      });

      const error = onFail.mock.calls[0][0];

      expect(error).toBeInstanceOf(CheckoutClientError);
      expect(error).toMatchObject({
        code: CheckoutErrorCode.unrecoverableFailure,
        message: 'An unrecoverable error occurred',
        recoverable: false,
        name: 'CheckoutClientError',
      });
      expect(error).not.toHaveProperty('__typename');
      expect(error).not.toHaveProperty('statusCode');
    });

    it('CheckoutExpiredError has correct properties', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'CheckoutExpiredError',
            code: 'INVALID_CART',
            message: 'The cart is no longer valid',
            recoverable: true,
          },
        });
      });

      const error = onFail.mock.calls[0][0];

      expect(error).toBeInstanceOf(CheckoutExpiredError);
      expect(error).toMatchObject({
        code: CheckoutErrorCode.invalidCart,
        message: 'The cart is no longer valid',
        recoverable: true,
        name: 'CheckoutExpiredError',
      });
      expect(error).not.toHaveProperty('__typename');
      expect(error).not.toHaveProperty('statusCode');
    });

    it('CheckoutHTTPError has correct properties including statusCode', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'CheckoutHTTPError',
            code: 'http_error',
            message: 'Service temporarily unavailable',
            recoverable: true,
            statusCode: 503,
          },
        });
      });

      const error = onFail.mock.calls[0][0];

      expect(error).toBeInstanceOf(CheckoutHTTPError);
      expect(error).toMatchObject({
        code: CheckoutErrorCode.httpError,
        message: 'Service temporarily unavailable',
        recoverable: true,
        statusCode: 503,
        name: 'CheckoutHTTPError',
      });
      expect(error).not.toHaveProperty('__typename');
    });

    it('InternalError has correct properties', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'InternalError',
            code: 'error_sending_message',
            message: 'Failed to send bridge message',
            recoverable: false,
          },
        });
      });

      const error = onFail.mock.calls[0][0];

      expect(error).toBeInstanceOf(InternalError);
      expect(error).toMatchObject({
        code: CheckoutErrorCode.sendingBridgeEventError,
        message: 'Failed to send bridge message',
        recoverable: false,
        name: 'InternalError',
      });
      expect(error).not.toHaveProperty('__typename');
    });

    it('GenericError is returned for unknown __typename', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'SomeUnknownErrorType',
            code: 'some_unknown_code',
            message: 'Something went wrong',
            recoverable: false,
          },
        });
      });

      const error = onFail.mock.calls[0][0];

      expect(error).toBeInstanceOf(GenericError);
      expect(error).toMatchObject({
        code: CheckoutErrorCode.unknown,
        message: 'Something went wrong',
        recoverable: false,
        name: 'GenericError',
      });
      expect(error).not.toHaveProperty('__typename');
    });

    it('GenericError preserves statusCode when provided', () => {
      const onFail = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onFail={onFail}
          testID="checkout-webview"
        />,
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onError({
          nativeEvent: {
            __typename: 'UnknownError',
            code: 'unknown',
            message: 'Server error',
            recoverable: false,
            statusCode: 500,
          },
        });
      });

      const error = onFail.mock.calls[0][0];

      expect(error).toBeInstanceOf(GenericError);
      expect(error).toMatchObject({
        code: CheckoutErrorCode.unknown,
        message: 'Server error',
        recoverable: false,
        statusCode: 500,
        name: 'GenericError',
      });
      expect(error).not.toHaveProperty('__typename');
    });
  });
});

