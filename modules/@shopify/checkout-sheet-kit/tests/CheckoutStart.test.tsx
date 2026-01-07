jest.mock('../src/native/RCTCheckoutWebView');
jest.mock('react-native');

import React from 'react';
import {render, act} from '@testing-library/react-native';
import {ShopifyCheckout} from '../src/components/ShopifyCheckout';
import {ShopifyCheckoutSheetProvider} from '../src/context';
import {createTestCart} from './testFixtures';

const Wrapper = ({children}: {children: React.ReactNode}) => (
  <ShopifyCheckoutSheetProvider>{children}</ShopifyCheckoutSheetProvider>
);

describe('Checkout Component - Start Events', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  it('calls onStart callback with complete event data including method field', () => {
    const onStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onStart={onStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');

    const testCart = createTestCart();

    act(() => {
      nativeComponent.props.onStart({
        nativeEvent: {
          method: 'checkout.start',
          cart: testCart,
        },
      });
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith({
      method: 'checkout.start',
      cart: testCart,
    });
  });

  it('includes method field in the event', () => {
    const onStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onStart={onStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onStart({
        nativeEvent: {
          method: 'checkout.start',
          cart: createTestCart(),
        },
      });
    });

    const receivedEvent = onStart.mock.calls[0][0];
    expect(receivedEvent.method).toBe('checkout.start');
  });

  it('includes cart data in the event', () => {
    const onStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onStart={onStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');
    const testCart = createTestCart();

    act(() => {
      nativeComponent.props.onStart({
        nativeEvent: {
          method: 'checkout.start',
          cart: testCart,
        },
      });
    });

    const receivedEvent = onStart.mock.calls[0][0];
    expect(receivedEvent.cart).toBeDefined();
    expect(receivedEvent.cart.id).toBe('gid://shopify/Cart/test-cart-123');
  });

  it('does not crash when onStart prop is not provided', () => {
    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');

    expect(() => {
      act(() => {
        nativeComponent.props.onStart({
          nativeEvent: {
            method: 'checkout.start',
            cart: createTestCart(),
          },
        });
      });
    }).not.toThrow();
  });
});
