jest.mock('../src/native/RCTCheckoutWebView');
jest.mock('react-native');

import React, {createRef} from 'react';
import {render, act} from '@testing-library/react-native';
import {ShopifyCheckout} from '../src/components/ShopifyCheckout';
import type {ShopifyCheckoutRef} from '../src/components/ShopifyCheckout';
import {ShopifyCheckoutSheetProvider} from '../src/context';
import {createTestCart} from './testFixtures';

const Wrapper = ({children}: {children: React.ReactNode}) => (
  <ShopifyCheckoutSheetProvider>{children}</ShopifyCheckoutSheetProvider>
);

describe('Checkout Component', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct displayName', () => {
    expect(ShopifyCheckout.displayName).toBe('ShopifyCheckout');
  });

  describe('onCancel callback', () => {
    it('calls onCancel callback when cancel event is triggered', () => {
      const onCancel = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onCancel={onCancel}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onCancel();
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('onLinkClick callback', () => {
    it('calls onLinkClick callback with URL when link is clicked', () => {
      const onLinkClick = jest.fn();
      const testUrl = 'https://example.com/terms';

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onLinkClick={onLinkClick}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onLinkClick({
          nativeEvent: {url: testUrl},
        });
      });

      expect(onLinkClick).toHaveBeenCalledTimes(1);
      expect(onLinkClick).toHaveBeenCalledWith(testUrl);
    });

    it('does not call callback when url is missing', () => {
      const onLinkClick = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onLinkClick={onLinkClick}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onLinkClick({
          nativeEvent: {},
        });
      });

      expect(onLinkClick).not.toHaveBeenCalled();
    });
  });

  describe('onPaymentMethodChangeStart callback', () => {
    it('calls onPaymentMethodChangeStart callback with event data', () => {
      const onPaymentMethodChangeStart = jest.fn();
      const testCart = createTestCart();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onPaymentMethodChangeStart={onPaymentMethodChangeStart}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onPaymentMethodChangeStart({
          nativeEvent: {
            id: 'test-event-123',
            method: 'checkout.paymentMethodChangeStart',
            cart: testCart,
          },
        });
      });

      expect(onPaymentMethodChangeStart).toHaveBeenCalledTimes(1);
      expect(onPaymentMethodChangeStart).toHaveBeenCalledWith({
        id: 'test-event-123',
        method: 'checkout.paymentMethodChangeStart',
        cart: testCart,
      });
    });

    it('does not call callback when nativeEvent is missing', () => {
      const onPaymentMethodChangeStart = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onPaymentMethodChangeStart={onPaymentMethodChangeStart}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onPaymentMethodChangeStart({});
      });

      expect(onPaymentMethodChangeStart).not.toHaveBeenCalled();
    });

    it('includes cart data in the event', () => {
      const onPaymentMethodChangeStart = jest.fn();
      const testCart = createTestCart();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onPaymentMethodChangeStart={onPaymentMethodChangeStart}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      const nativeComponent = getByTestId('checkout-webview');

      act(() => {
        nativeComponent.props.onPaymentMethodChangeStart({
          nativeEvent: {
            id: 'event-with-cart',
            method: 'checkout.paymentMethodChangeStart',
            cart: testCart,
          },
        });
      });

      const receivedEvent = onPaymentMethodChangeStart.mock.calls[0][0];
      expect(receivedEvent.cart).toBeDefined();
      expect(receivedEvent.cart.id).toBe('gid://shopify/Cart/test-cart-123');
      expect(receivedEvent.cart.payment).toBeDefined();
    });
  });

  describe('ref and reload functionality', () => {
    it('exposes reload method via ref', () => {
      const ref = createRef<ShopifyCheckoutRef>();

      render(
        <ShopifyCheckout
          ref={ref}
          checkoutUrl={mockCheckoutUrl}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.reload).toBe('function');
    });
  });

  describe('multiple callbacks', () => {
    it('supports all callbacks simultaneously', () => {
      const onStart = jest.fn();
      const onComplete = jest.fn();
      const onFail = jest.fn();
      const onCancel = jest.fn();
      const onLinkClick = jest.fn();
      const onAddressChangeStart = jest.fn();
      const onPaymentMethodChangeStart = jest.fn();
      const onSubmitStart = jest.fn();

      const {getByTestId} = render(
        <ShopifyCheckout
          checkoutUrl={mockCheckoutUrl}
          onStart={onStart}
          onComplete={onComplete}
          onFail={onFail}
          onCancel={onCancel}
          onLinkClick={onLinkClick}
          onAddressChangeStart={onAddressChangeStart}
          onPaymentMethodChangeStart={onPaymentMethodChangeStart}
          onSubmitStart={onSubmitStart}
          testID="checkout-webview"
        />,
        {wrapper: Wrapper},
      );

      const nativeComponent = getByTestId('checkout-webview');
      const testCart = createTestCart();

      act(() => {
        nativeComponent.props.onStart({
          nativeEvent: {method: 'checkout.start', cart: testCart},
        });
      });
      expect(onStart).toHaveBeenCalledTimes(1);

      act(() => {
        nativeComponent.props.onCancel();
      });
      expect(onCancel).toHaveBeenCalledTimes(1);

      act(() => {
        nativeComponent.props.onLinkClick({
          nativeEvent: {url: 'https://example.com'},
        });
      });
      expect(onLinkClick).toHaveBeenCalledTimes(1);
    });
  });
});
