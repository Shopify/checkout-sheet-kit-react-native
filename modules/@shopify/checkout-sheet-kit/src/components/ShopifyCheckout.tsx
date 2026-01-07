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
  UIManager,
  findNodeHandle,
  type ViewStyle,
} from 'react-native';
import {useShopifyCheckoutSheet} from '../context';
import type {
  CheckoutAddressChangeStartEvent,
  CheckoutCompleteEvent,
  CheckoutPaymentMethodChangeStartEvent,
  CheckoutStartEvent,
  CheckoutSubmitStartEvent,
} from '../events.d';
import {
  parseCheckoutError,
  type CheckoutException,
  type CheckoutNativeError,
} from '../errors.d';

export interface ShopifyCheckoutProps {
  /**
   * The checkout URL to load in the webview
   */
  checkoutUrl: string;

  /**
   * Authentication token for the checkout
   */
  auth?: string;

  /**
   * Called when checkout starts, providing the initial cart state
   */
  onStart?: (event: CheckoutStartEvent) => void;

  /**
   * Called when checkout fails
   */
  onFail?: (error: CheckoutException) => void;

  /**
   * Called when checkout is completed successfully
   */
  onComplete?: (event: CheckoutCompleteEvent) => void;

  /**
   * Called when checkout is cancelled
   */
  onCancel?: () => void;

  /**
   * Called when a link is clicked within the checkout
   */
  onLinkClick?: (url: string) => void;

  /**
   * Called when checkout starts an address change flow (e.g., for native address picker).
   *
   * Note: This callback is only invoked when native address selection is enabled
   * for the authenticated app.
   */
  onAddressChangeStart?: (event: CheckoutAddressChangeStartEvent) => void;

  /**
   * Called when the buyer attempts to submit the checkout.
   *
   * Note: This callback is only invoked when native payment delegation is configured
   * for the authenticated app.
   */
  onSubmitStart?: (event: CheckoutSubmitStartEvent) => void;

  /**
   * Called when checkout starts a payment method change flow (e.g., for native picker).
   *
   * Note: This callback is only invoked when native address selection is enabled
   * for the authenticated app.
   */
  onPaymentMethodChangeStart?: (
    event: CheckoutPaymentMethodChangeStartEvent,
  ) => void;
  /**
   * Style for the webview container
   */
  style?: ViewStyle;

  /**
   * Test identifier for testing
   */
  testID?: string;
}

export interface ShopifyCheckoutRef {
  /**
   * Reload the current checkout page
   */
  reload: () => void;
}

interface NativeShopifyCheckoutWebViewProps {
  checkoutUrl: string;
  auth?: string;
  style?: ViewStyle;
  testID?: string;
  onStart?: (event: {nativeEvent: CheckoutStartEvent}) => void;
  onFail?: (event: {nativeEvent: CheckoutNativeError}) => void;
  onComplete?: (event: {nativeEvent: CheckoutCompleteEvent}) => void;
  onCancel?: () => void;
  onLinkClick?: (event: {nativeEvent: {url: string}}) => void;
  onAddressChangeStart?: (event: {
    nativeEvent: CheckoutAddressChangeStartEvent;
  }) => void;
  onSubmitStart?: (event: {nativeEvent: CheckoutSubmitStartEvent}) => void;
  onPaymentMethodChangeStart?: (event: {
    nativeEvent: CheckoutPaymentMethodChangeStartEvent;
  }) => void;
}

const RCTCheckoutWebView =
  requireNativeComponent<NativeShopifyCheckoutWebViewProps>(
    'RCTCheckoutWebView',
  );

/**
 * Checkout provides a native webview component for displaying
 * Shopify checkout pages directly within your React Native app.
 *
 * This component uses the native CheckoutWebViewController from ShopifyCheckoutSheetKit
 * to provide a seamless checkout experience with full support for all checkout features
 * including Shop Pay, Apple Pay, and other payment methods.
 *
 * @example Basic usage
 * import {ShopifyCheckout} from '@shopify/checkout-sheet-kit';
 *
 * <ShopifyCheckout
 *   checkoutUrl="https://shop.example.com/checkouts/cn/123"
 *   onComplete={(event) => console.log('Checkout completed!', event.orderDetails)}
 *   onFail={(error) => console.error('Checkout failed:', error.message)}
 *   style={{flex: 1}}
 * />
 *
 * @example Passing an app authentication token to customize checkout and receive richer events
 * <ShopifyCheckout
 *   checkoutUrl="https://shop.example.com/checkouts/cn/123"
 *   auth="your_auth_token_here"
 *   onComplete={(event) => console.log('Checkout completed!')}
 * />
 *
 * @example Using with ref to reload on error
 * import {useRef} from 'react';
 * import {ShopifyCheckout, CheckoutHandle} from '@shopify/checkout-sheet-kit';
 *
 * const checkoutRef = useRef<ShopifyCheckoutHandle>(null);
 *
 * <ShopifyCheckout
 *   ref={checkoutRef}
 *   checkoutUrl={url}
 *   auth={authToken}
 *   onFail={() => {
 *     // Reload on error
 *     checkoutRef.current?.reload();
 *   }}
 * />
 */
export const ShopifyCheckout = forwardRef<
  ShopifyCheckoutRef,
  ShopifyCheckoutProps
>(
  (
    {
      checkoutUrl,
      auth,
      onStart,
      onFail,
      onComplete,
      onCancel,
      onLinkClick,
      onAddressChangeStart,
      onPaymentMethodChangeStart,
      onSubmitStart,
      style,
      testID,
    },
    ref,
  ) => {
    const webViewRef =
      useRef<React.ComponentRef<typeof RCTCheckoutWebView>>(null);
    const {registerWebView, unregisterWebView} = useShopifyCheckoutSheet();

    useEffect(() => {
      registerWebView(webViewRef);
      return () => unregisterWebView();
    }, [registerWebView, unregisterWebView]);

    const handleStart = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onStart']
    >(
      (event: {nativeEvent: CheckoutStartEvent}) => {
        onStart?.(event.nativeEvent);
      },
      [onStart],
    );

    const handleError = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onFail']
    >(
      event => {
        const transformedError = parseCheckoutError(event.nativeEvent);
        onFail?.(transformedError);
      },
      [onFail],
    );

    const handleComplete = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onComplete']
    >(
      event => {
        onComplete?.(event.nativeEvent);
      },
      [onComplete],
    );

    const handleCancel = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onCancel']
    >(() => {
      onCancel?.();
    }, [onCancel]);

    const handleLinkClick = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onLinkClick']
    >(
      event => {
        if (!event.nativeEvent.url) return;
        onLinkClick?.(event.nativeEvent.url);
      },
      [onLinkClick],
    );

    const handleAddressChangeStart = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onAddressChangeStart']
    >(
      event => {
        if (!event.nativeEvent) return;
        onAddressChangeStart?.(event.nativeEvent);
      },
      [onAddressChangeStart],
    );

    const handlePaymentMethodChangeStart = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onPaymentMethodChangeStart']
    >(
      event => {
        if (!event.nativeEvent) return;
        onPaymentMethodChangeStart?.(event.nativeEvent);
      },
      [onPaymentMethodChangeStart],
    );

    const handleSubmitStart = useCallback<
      Required<NativeShopifyCheckoutWebViewProps>['onSubmitStart']
    >(
      event => {
        if (!event.nativeEvent) return;
        onSubmitStart?.(event.nativeEvent);
      },
      [onSubmitStart],
    );

    const reload = useCallback(() => {
      if (!webViewRef.current) {
        return;
      }

      const handle = findNodeHandle(webViewRef.current);
      if (!handle) {
        return;
      }

      const viewConfig = UIManager.getViewManagerConfig('RCTCheckoutWebView');
      const commandId = viewConfig?.Commands?.reload ?? 'reload';

      UIManager.dispatchViewManagerCommand(handle, commandId, []);
    }, []);

    useImperativeHandle(ref, () => ({reload}), [reload]);

    return (
      <RCTCheckoutWebView
        ref={webViewRef}
        checkoutUrl={checkoutUrl}
        auth={auth}
        style={style}
        testID={testID}
        onStart={handleStart}
        onFail={handleError}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onLinkClick={handleLinkClick}
        onAddressChangeStart={handleAddressChangeStart}
        onPaymentMethodChangeStart={handlePaymentMethodChangeStart}
        onSubmitStart={handleSubmitStart}
      />
    );
  },
);

ShopifyCheckout.displayName = 'ShopifyCheckout';

export default ShopifyCheckout;
