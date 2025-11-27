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
} from 'react-native';
import type {ViewStyle} from 'react-native';
import type {
  CheckoutCompleteEvent,
  CheckoutException,
} from '..';
import {useCheckoutEvents} from '../CheckoutEventProvider';
import type {CheckoutAddressChangeStart, CheckoutPaymentChangeIntent, CheckoutStartEvent} from '../events';

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
   * Called when checkout starts, providing the initial cart state
   */
  onStart?: (event: CheckoutStartEvent) => void;

  /**
   * Called when checkout fails
   */
  onError?: (error: CheckoutException) => void;

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
  onAddressChangeStart?: (event: CheckoutAddressChangeStart) => void;

  /**
   * Style for the webview container
   */
  style?: ViewStyle;

  /**
   * Test identifier for testing
   */
  testID?: string;
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
  testID?: string;
  onStart?: (event: {nativeEvent: CheckoutStartEvent}) => void;
  onError?: (event: {nativeEvent: CheckoutException}) => void;
  onComplete?: (event: {nativeEvent: CheckoutCompleteEvent}) => void;
  onCancel?: () => void;
  onLinkClick?: (event: {nativeEvent: {url: string}}) => void;
  onAddressChangeStart?: (event: {nativeEvent: CheckoutAddressChangeStart}) => void;
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
      onStart,
      onError,
      onComplete,
      onCancel,
      onLinkClick,
      onAddressChangeStart,
      style,
      testID,
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


    const handleStart = useCallback<
      Required<NativeCheckoutWebViewProps>['onStart']
    >(
      (event: {nativeEvent: CheckoutStartEvent}) => {
        onStart?.(event.nativeEvent);
      },
      [onStart],
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
      (event: {nativeEvent: CheckoutCompleteEvent}) => {
        onComplete?.(event.nativeEvent);
      },
      [onComplete],
    );

    const handleCancel = useCallback<
      Required<NativeCheckoutWebViewProps>['onCancel']
    >(() => {
      onCancel?.();
    }, [onCancel]);

    const handleLinkClick = useCallback<
      Required<NativeCheckoutWebViewProps>['onLinkClick']
    >(
      (event: {nativeEvent: {url: string}}) => {
        if (!event.nativeEvent.url) return;
        onLinkClick?.(event.nativeEvent.url);
      },
      [onLinkClick],
    );

    const handleAddressChangeStart = useCallback<
      Required<NativeCheckoutWebViewProps>['onAddressChangeStart']
    >(
      (event: {nativeEvent: CheckoutAddressChangeStart}) => {
        if (!event.nativeEvent) return;
        onAddressChangeStart?.(event.nativeEvent);
      },
      [onAddressChangeStart],
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

      UIManager.dispatchViewManagerCommand(
        handle,
        commandId,
        [],
      );
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
        onError={handleError}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onLinkClick={handleLinkClick}
        onAddressChangeStart={handleAddressChangeStart}
      />
    );
  },
);

Checkout.displayName = 'Checkout';

export default Checkout;
