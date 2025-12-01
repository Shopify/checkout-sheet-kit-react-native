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
import {Checkout} from '../src/components/Checkout';
import {createTestCart} from './testFixtures';

describe('Checkout Component - Start Events', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  it('calls onStart callback with complete event data including method field', () => {
    const onStart = jest.fn();

    const {getByTestId} = render(
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onStart={onStart}
        testID="checkout-webview"
      />,
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
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onStart={onStart}
        testID="checkout-webview"
      />,
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
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onStart={onStart}
        testID="checkout-webview"
      />,
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
      <Checkout checkoutUrl={mockCheckoutUrl} testID="checkout-webview" />,
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
