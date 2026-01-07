// Mock the native view component BEFORE imports
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = jest.requireActual('react');

  RN.UIManager.getViewManagerConfig = jest.fn(() => ({
    Commands: {},
  }));

  RN.NativeModules.ShopifyCheckoutSheetKit = {
    version: '0.7.0',
    preload: jest.fn(),
    present: jest.fn(),
    dismiss: jest.fn(),
    invalidateCache: jest.fn(),
    getConfig: jest.fn(async () => ({preloading: true})),
    setConfig: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListeners: jest.fn(),
    initiateGeolocationRequest: jest.fn(),
    configureAcceleratedCheckouts: jest.fn(),
    isAcceleratedCheckoutAvailable: jest.fn(),
  };

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
import {ShopifyCheckoutSheetProvider} from '../src/context';
import {createTestCart} from './testFixtures';

const Wrapper = ({children}: {children: React.ReactNode}) => (
  <ShopifyCheckoutSheetProvider>{children}</ShopifyCheckoutSheetProvider>
);

describe('Checkout Component - Submit Start Events', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  it('calls onSubmitStart callback with event data', () => {
    const onSubmitStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onSubmitStart={onSubmitStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');
    const testCart = createTestCart();

    act(() => {
      nativeComponent.props.onSubmitStart({
        nativeEvent: {
          id: 'test-event-123',
          method: 'checkout.submitStart',
          cart: testCart,
          sessionId: 'checkout-session-123',
        },
      });
    });

    expect(onSubmitStart).toHaveBeenCalledTimes(1);
    expect(onSubmitStart).toHaveBeenCalledWith({
      id: 'test-event-123',
      method: 'checkout.submitStart',
      cart: testCart,
      sessionId: 'checkout-session-123',
    });
  });

  it('does not crash when onSubmitStart prop is not provided', () => {
    const {getByTestId} = render(
      <ShopifyCheckout checkoutUrl={mockCheckoutUrl} testID="checkout-webview" />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');

    expect(() => {
      act(() => {
        nativeComponent.props.onSubmitStart({
          nativeEvent: {
            id: 'test-event',
            method: 'checkout.submitStart',
            cart: createTestCart(),
            sessionId: 'checkout-session-123',
          },
        });
      });
    }).not.toThrow();
  });

  it('does not call callback when nativeEvent is missing', () => {
    const onSubmitStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onSubmitStart={onSubmitStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onSubmitStart({});
    });

    expect(onSubmitStart).not.toHaveBeenCalled();
  });
});
