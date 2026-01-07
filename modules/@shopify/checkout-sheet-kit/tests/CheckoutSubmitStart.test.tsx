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
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        testID="checkout-webview"
      />,
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
