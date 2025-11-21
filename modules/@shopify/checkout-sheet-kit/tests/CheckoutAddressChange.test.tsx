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

describe('Checkout Component - Address Change Events', () => {
  const mockCheckoutUrl = 'https://example.myshopify.com/checkout';

  it('calls onAddressChangeStart callback with complete event data', () => {
    const onAddressChangeStart = jest.fn();

    const {getByTestId} = render(
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onAddressChangeStart={onAddressChangeStart}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onAddressChangeStart({
        nativeEvent: {
          id: 'test-event-123',
          type: 'addressChangeStart',
          addressType: 'shipping',
        },
      });
    });

    expect(onAddressChangeStart).toHaveBeenCalledTimes(1);
    expect(onAddressChangeStart).toHaveBeenCalledWith({
      id: 'test-event-123',
      type: 'addressChangeStart',
      addressType: 'shipping',
    });
  });

  it('does not crash when onAddressChangeStart prop is not provided', () => {
    const {getByTestId} = render(
      <Checkout checkoutUrl={mockCheckoutUrl} testID="checkout-webview" />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    expect(() => {
      act(() => {
        nativeComponent.props.onAddressChangeStart({
          nativeEvent: {
            id: 'test-event',
            type: 'addressChangeStart',
            addressType: 'shipping',
          },
        });
      });
    }).not.toThrow();
  });

  it('does not call callback when nativeEvent is missing', () => {
    const onAddressChangeStart = jest.fn();

    const {getByTestId} = render(
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onAddressChangeStart={onAddressChangeStart}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onAddressChangeStart({});
    });

    expect(onAddressChangeStart).not.toHaveBeenCalled();
  });

  it('works alongside other checkout callbacks', () => {
    const onComplete = jest.fn();
    const onCancel = jest.fn();
    const onAddressChangeStart = jest.fn();

    const {getByTestId} = render(
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onComplete={onComplete}
        onCancel={onCancel}
        onAddressChangeStart={onAddressChangeStart}
        testID="checkout-webview"
      />,
    );

    const nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onAddressChangeStart({
        nativeEvent: {
          id: 'event-123',
          type: 'addressChangeStart',
          addressType: 'shipping',
        },
      });
    });

    expect(onAddressChangeStart).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('can be updated with new callback', () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();

    const {getByTestId, rerender} = render(
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onAddressChangeStart={firstCallback}
        testID="checkout-webview"
      />,
    );

    let nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onAddressChangeStart({
        nativeEvent: {
          id: 'event-1',
          type: 'addressChangeStart',
          addressType: 'shipping',
        },
      });
    });

    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).not.toHaveBeenCalled();

    rerender(
      <Checkout
        checkoutUrl={mockCheckoutUrl}
        onAddressChangeStart={secondCallback}
        testID="checkout-webview"
      />,
    );

    nativeComponent = getByTestId('checkout-webview');

    act(() => {
      nativeComponent.props.onAddressChangeStart({
        nativeEvent: {
          id: 'event-2',
          type: 'addressChangeStart',
          addressType: 'shipping',
        },
      });
    });

    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });
});

