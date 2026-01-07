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
import {ShopifyCheckout} from '../src/components/ShopifyCheckout';
import {createTestCart} from './testFixtures';

describe('Checkout Component - Complete Events', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  const createTestOrderConfirmation = () => ({
    url: 'https://example.myshopify.com/orders/test-order-123',
    order: {
      id: 'gid://shopify/Order/test-order-123',
    },
    number: '1001',
    isFirstOrder: false,
  });

  it('calls onComplete callback with complete event data including method field', () => {
    const onComplete = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onComplete={onComplete}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    const testCart = createTestCart();
    const testOrderConfirmation = createTestOrderConfirmation();

    act(() => {
      nativeComponent.props.onComplete({
        nativeEvent: {
          method: 'checkout.complete',
          cart: testCart,
          orderConfirmation: testOrderConfirmation,
        },
      });
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      method: 'checkout.complete',
      cart: testCart,
      orderConfirmation: testOrderConfirmation,
    });
  });

  it('includes method field in the event', () => {
    const onComplete = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onComplete={onComplete}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onComplete({
        nativeEvent: {
          method: 'checkout.complete',
          cart: createTestCart(),
          orderConfirmation: createTestOrderConfirmation(),
        },
      });
    });

    const receivedEvent = onComplete.mock.calls[0][0];
    expect(receivedEvent.method).toBe('checkout.complete');
  });

  it('includes cart data in the event', () => {
    const onComplete = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onComplete={onComplete}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');
    const testCart = createTestCart();

    act(() => {
      nativeComponent.props.onComplete({
        nativeEvent: {
          method: 'checkout.complete',
          cart: testCart,
          orderConfirmation: createTestOrderConfirmation(),
        },
      });
    });

    const receivedEvent = onComplete.mock.calls[0][0];
    expect(receivedEvent.cart).toBeDefined();
    expect(receivedEvent.cart.id).toBe('gid://shopify/Cart/test-cart-123');
  });

  it('includes orderConfirmation data in the event', () => {
    const onComplete = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onComplete={onComplete}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');
    const testOrderConfirmation = createTestOrderConfirmation();

    act(() => {
      nativeComponent.props.onComplete({
        nativeEvent: {
          method: 'checkout.complete',
          cart: createTestCart(),
          orderConfirmation: testOrderConfirmation,
        },
      });
    });

    const receivedEvent = onComplete.mock.calls[0][0];
    expect(receivedEvent.orderConfirmation).toBeDefined();
    expect(receivedEvent.orderConfirmation.order.id).toBe(
      'gid://shopify/Order/test-order-123',
    );
    expect(receivedEvent.orderConfirmation.number).toBe('1001');
  });

  it('does not crash when onComplete prop is not provided', () => {
    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    expect(() => {
      act(() => {
        nativeComponent.props.onComplete({
          nativeEvent: {
            method: 'checkout.complete',
            cart: createTestCart(),
            orderConfirmation: createTestOrderConfirmation(),
          },
        });
      });
    }).not.toThrow();
  });
});
