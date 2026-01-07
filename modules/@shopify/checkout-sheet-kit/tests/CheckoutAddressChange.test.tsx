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

describe('Checkout Component - Address Change Events', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  it('calls onAddressChangeStart callback with complete event data', () => {
    const onAddressChangeStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onAddressChangeStart={onAddressChangeStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');

    const testCart = createTestCart();

    act(() => {
      nativeComponent.props.onAddressChangeStart({
        nativeEvent: {
          id: 'test-event-123',
          method: 'checkout.addressChangeStart',
          addressType: 'shipping',
          cart: testCart,
        },
      });
    });

    expect(onAddressChangeStart).toHaveBeenCalledTimes(1);
    expect(onAddressChangeStart).toHaveBeenCalledWith({
      id: 'test-event-123',
      method: 'checkout.addressChangeStart',
      addressType: 'shipping',
      cart: testCart,
    });
  });

  it('does not crash when onAddressChangeStart prop is not provided', () => {
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
        nativeComponent.props.onAddressChangeStart({
          nativeEvent: {
            id: 'test-event',
            method: 'checkout.addressChangeStart',
            addressType: 'shipping',
            cart: createTestCart(),
          },
        });
      });
    }).not.toThrow();
  });

  it('does not call callback when nativeEvent is missing', () => {
    const onAddressChangeStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onAddressChangeStart={onAddressChangeStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onAddressChangeStart({});
    });

    expect(onAddressChangeStart).not.toHaveBeenCalled();
  });

  it('includes cart data in the event', () => {
    const onAddressChangeStart = jest.fn();

    const {getByTestId} = render(
      <ShopifyCheckout
        checkoutUrl={mockCheckoutUrl}
        onAddressChangeStart={onAddressChangeStart}
        testID="checkout-webview"
      />,
      {wrapper: Wrapper},
    );

    const nativeComponent = getByTestId('checkout-webview');
    const testCart = createTestCart();

    act(() => {
      nativeComponent.props.onAddressChangeStart({
        nativeEvent: {
          id: 'event-with-cart',
          method: 'checkout.addressChangeStart',
          addressType: 'shipping',
          cart: testCart,
        },
      });
    });

    const receivedEvent = onAddressChangeStart.mock.calls[0][0];
    expect(receivedEvent.cart).toBeDefined();
    expect(receivedEvent.cart.id).toBe('gid://shopify/Cart/test-cart-123');
    expect(receivedEvent.cart.delivery).toBeDefined();
    expect(receivedEvent.cart.delivery.addresses).toHaveLength(1);
  });
});
