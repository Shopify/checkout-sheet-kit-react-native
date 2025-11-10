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

import React, {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import {
  requireNativeComponent,
  Platform,
  UIManager,
  findNodeHandle,
} from 'react-native';
import type {ViewStyle} from 'react-native';
import type {
  CheckoutCompletedEvent,
  CheckoutException,
  PixelEvent,
} from '..';
import {useCheckoutEvents} from '../CheckoutEventProvider';
import type {CheckoutAddressChangeIntent, CheckoutPaymentChangeIntent} from '../events';

export interface CheckoutProps {
  /**
   * The checkout URL to load in the webview
   */
  checkoutUrl: string;

  /**
   * Authentication token for the checkout
   */
  auth?: string;

  /**
   * Called when the webview loads
   */
  onLoad?: (event: {url: string}) => void;

  /**
   * Called when checkout fails
   */
  onError?: (error: CheckoutException) => void;

  /**
   * Called when checkout is completed successfully
   */
  onComplete?: (event: CheckoutCompletedEvent) => void;

  /**
   * Called when checkout is cancelled
   */
  onCancel?: () => void;

  /**
   * Called when a web pixel event is triggered
   */
  onPixelEvent?: (event: PixelEvent) => void;

  /**
   * Called when a link is clicked within the checkout
   */
  onClickLink?: (url: string) => void;

  /**
   * Called when checkout requests an address change (e.g., for native address picker)
   */
  onAddressChangeIntent?: (event: CheckoutAddressChangeIntent) => void;

  /**
   * Called when checkout requests a payment method change (e.g., for native payment selector)
   */
  onPaymentChangeIntent?: (event: CheckoutPaymentChangeIntent) => void;

  /**
   * Style for the webview container
   */
  style?: ViewStyle;
}

export interface CheckoutRef {
  /**
   * Reload the current checkout page
   */
  reload: () => void;
}

interface NativeCheckoutWebViewProps {
  checkoutUrl: string;
  auth?: string;
  style?: ViewStyle;
  onLoad?: (event: {nativeEvent: {url: string}}) => void;
  onError?: (event: {nativeEvent: CheckoutException}) => void;
  onComplete?: (event: {nativeEvent: CheckoutCompletedEvent}) => void;
  onCancel?: () => void;
  onPixelEvent?: (event: {nativeEvent: PixelEvent}) => void;
  onClickLink?: (event: {nativeEvent: {url: string}}) => void;
  onAddressChangeIntent?: (event: {
    nativeEvent: {
      id: string;
      type: string;
      addressType: string;
    };
  }) => void;
  onPaymentChangeIntent?: (event: {
    nativeEvent: {
      id: string;
      type: string;
      currentCard?: {
        last4: string;
        brand: string;
      };
    };
  }) => void;
}

const RCTCheckoutWebView =
  requireNativeComponent<NativeCheckoutWebViewProps>('RCTCheckoutWebView');

/**
 * Checkout provides a native webview component for displaying
 * Shopify checkout pages directly within your React Native app.
 *
 * This component uses the native CheckoutWebViewController from ShopifyCheckoutSheetKit
 * to provide a seamless checkout experience with full support for all checkout features
 * including Shop Pay, Apple Pay, and other payment methods.
 *
 * @example Basic usage
 * import {Checkout} from '@shopify/checkout-sheet-kit';
 *
 * <Checkout
 *   checkoutUrl="https://shop.example.com/checkouts/cn/123"
 *   onComplete={(event) => console.log('Checkout completed!', event.orderDetails)}
 *   onError={(error) => console.error('Checkout failed:', error.message)}
 *   style={{flex: 1}}
 * />
 *
 * @example Passing an app authentication token to customize checkout and receive richer events
 * <Checkout
 *   checkoutUrl="https://shop.example.com/checkouts/cn/123"
 *   auth="your_auth_token_here"
 *   onComplete={(event) => console.log('Checkout completed!')}
 * />
 *
 * @example Using with ref to reload on error
 * import {useRef} from 'react';
 * import {Checkout, CheckoutHandle} from '@shopify/checkout-sheet-kit';
 *
 * const checkoutRef = useRef<CheckoutHandle>(null);
 *
 * <Checkout
 *   ref={checkoutRef}
 *   checkoutUrl={url}
 *   auth={authToken}
 *   onError={() => {
 *     // Reload on error
 *     checkoutRef.current?.reload();
 *   }}
 * />
 */
export const Checkout = forwardRef<CheckoutRef, CheckoutProps>(
  (
    {
      checkoutUrl,
      auth,
      onLoad,
      onError,
      onComplete,
      onCancel,
      onPixelEvent,
      onClickLink,
      onAddressChangeIntent,
      onPaymentChangeIntent,
      style,
    },
    ref,
  ) => {
    const webViewRef =
      useRef<React.ComponentRef<typeof RCTCheckoutWebView>>(null);
    const eventContext = useCheckoutEvents();

    // Register webview reference with the event provider
    useEffect(() => {
      if (!eventContext) return;

      eventContext.registerWebView(webViewRef);

      return () => eventContext.unregisterWebView();
    }, [eventContext]);

    const handleLoad = useCallback<
      Required<NativeCheckoutWebViewProps>['onLoad']
    >(
      event => {
        onLoad?.(event.nativeEvent);
      },
      [onLoad],
    );

    const handleError = useCallback<
      Required<NativeCheckoutWebViewProps>['onError']
    >(
      (event: {nativeEvent: CheckoutException}) => {
        onError?.(event.nativeEvent);
      },
      [onError],
    );

    const handleComplete = useCallback<
      Required<NativeCheckoutWebViewProps>['onComplete']
    >(
      (event: {nativeEvent: CheckoutCompletedEvent}) => {
        onComplete?.(event.nativeEvent);
      },
      [onComplete],
    );

    const handleCancel = useCallback<
      Required<NativeCheckoutWebViewProps>['onCancel']
    >(() => {
      onCancel?.();
    }, [onCancel]);

    const handlePixelEvent = useCallback<
      Required<NativeCheckoutWebViewProps>['onPixelEvent']
    >(
      (event: {nativeEvent: PixelEvent}) => {
        onPixelEvent?.(event.nativeEvent);
      },
      [onPixelEvent],
    );

    const handleClickLink = useCallback<
      Required<NativeCheckoutWebViewProps>['onClickLink']
    >(
      (event: {nativeEvent: {url: string}}) => {
        if (!event.nativeEvent.url) return;
        onClickLink?.(event.nativeEvent.url);
      },
      [onClickLink],
    );

    const handleAddressChangeIntent = useCallback<
      Required<NativeCheckoutWebViewProps>['onAddressChangeIntent']
    >(
      (event: {
        nativeEvent: {id: string; type: string; addressType: string};
      }) => {
        if (!event.nativeEvent) return;
        onAddressChangeIntent?.(event.nativeEvent);
      },
      [onAddressChangeIntent],
    );

    const handlePaymentChangeIntent = useCallback<
      Required<NativeCheckoutWebViewProps>['onPaymentChangeIntent']
    >(
      (event: {
        nativeEvent: {
          id: string;
          type: string;
          currentCard?: {last4: string; brand: string};
        };
      }) => {
        if (!event.nativeEvent) return;
        onPaymentChangeIntent?.(event.nativeEvent);
      },
      [onPaymentChangeIntent],
    );

    const reload = useCallback(() => {
      if (!webViewRef.current) {
        return;
      }
      const handle = findNodeHandle(webViewRef.current);
      if (!handle) {
        return;
      }

      UIManager.dispatchViewManagerCommand(
        handle,
        UIManager.getViewManagerConfig('RCTCheckoutWebView')?.Commands
          ?.reload ?? 1,
        [],
      );
    }, []);

    useImperativeHandle(ref, () => ({reload}), [reload]);

    // Only render on iOS as the native module is iOS-only
    if (Platform.OS !== 'ios') {
      // eslint-disable-next-line no-console
      console.error('Checkout is only available on iOS');
      return null;
    }

    return (
      <RCTCheckoutWebView
        ref={webViewRef}
        checkoutUrl={checkoutUrl}
        auth={auth}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onPixelEvent={handlePixelEvent}
        onClickLink={handleClickLink}
        onAddressChangeIntent={handleAddressChangeIntent}
        onPaymentChangeIntent={handlePaymentChangeIntent}
      />
    );
  },
);

Checkout.displayName = 'Checkout';

export default Checkout;
