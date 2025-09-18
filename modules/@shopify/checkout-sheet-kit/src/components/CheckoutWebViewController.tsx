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
} from 'react';
import {
  requireNativeComponent,
  Platform,
  UIManager,
  findNodeHandle,
} from 'react-native';
import type {ViewStyle} from 'react-native';
import type {CheckoutCompletedEvent, CheckoutException, PixelEvent} from '..';

export interface CheckoutWebViewControllerProps {
  /**
   * The checkout URL to load in the webview
   */
  checkoutUrl: string;

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
   * Called when the webview is attached
   */
  onViewAttached?: () => void;

  /**
   * Called when checkout requests an address change (e.g., for native address picker)
   */
  onAddressChangeIntent?: (event: {id: string, type: string, addressType: string}) => void;

  /**
   * Style for the webview container
   */
  style?: ViewStyle;
}

export interface CheckoutWebViewControllerHandle {
  /**
   * Reload the current checkout page
   */
  reload: () => void;
}

interface NativeCheckoutWebViewProps {
  checkoutUrl: string;
  style?: ViewStyle;
  onLoad?: (event: {nativeEvent: {url: string}}) => void;
  onError?: (event: {nativeEvent: CheckoutException}) => void;
  onComplete?: (event: {nativeEvent: CheckoutCompletedEvent}) => void;
  onCancel?: () => void;
  onPixelEvent?: (event: {nativeEvent: PixelEvent}) => void;
  onClickLink?: (event: {nativeEvent: {url: string}}) => void;
  onViewAttached?: () => void;
  onAddressChangeIntent?: (event: {nativeEvent: {
    id: string,
    type: string,
    addressType: string
  }}) => void;
}

const RCTCheckoutWebView =
  requireNativeComponent<NativeCheckoutWebViewProps>('RCTCheckoutWebView');

/**
 * CheckoutWebViewController provides a native webview component for displaying
 * Shopify checkout pages directly within your React Native app.
 *
 * This component uses the native CheckoutWebViewController from ShopifyCheckoutSheetKit
 * to provide a seamless checkout experience with full support for all checkout features
 * including Shop Pay, Apple Pay, and other payment methods.
 *
 * @example
 * <CheckoutWebViewController
 *   checkoutUrl="https://shop.example.com/checkouts/cn/123"
 *   onComplete={(event) => console.log('Checkout completed!', event.orderDetails)}
 *   onError={(error) => console.error('Checkout failed:', error.message)}
 *   style={{flex: 1}}
 * />
 *
 * @example Using with ref to reload
 * const checkoutRef = useRef<CheckoutWebViewControllerHandle>(null);
 *
 * <CheckoutWebViewController
 *   ref={checkoutRef}
 *   checkoutUrl={url}
 *   onError={() => {
 *     // Reload on error
 *     checkoutRef.current?.reload();
 *   }}
 * />
 */
export const CheckoutWebViewController = forwardRef<
  CheckoutWebViewControllerHandle,
  CheckoutWebViewControllerProps
>(
  (
    {
      checkoutUrl,
      onLoad,
      onError,
      onComplete,
      onCancel,
      onPixelEvent,
      onClickLink,
      onViewAttached,
      onAddressChangeIntent,
      style,
    },
    ref,
  ) => {
    const webViewRef = useRef<any>(null);

    const handleLoad = useCallback(
      (event: {nativeEvent: {url: string}}) => {
        onLoad?.(event.nativeEvent);
      },
      [onLoad],
    );

    const handleError = useCallback(
      (event: {nativeEvent: CheckoutException}) => {
        onError?.(event.nativeEvent);
      },
      [onError],
    );

    const handleComplete = useCallback(
      (event: {nativeEvent: CheckoutCompletedEvent}) => {
        onComplete?.(event.nativeEvent);
      },
      [onComplete],
    );

    const handleCancel = useCallback(() => {
      onCancel?.();
    }, [onCancel]);

    const handlePixelEvent = useCallback(
      (event: {nativeEvent: PixelEvent}) => {
        onPixelEvent?.(event.nativeEvent);
      },
      [onPixelEvent],
    );

    const handleClickLink = useCallback(
      (event: {nativeEvent: {url: string}}) => {
        if (event.nativeEvent?.url) {
          onClickLink?.(event.nativeEvent.url);
        }
      },
      [onClickLink],
    );

    const handleViewAttached = useCallback(() => {
      onViewAttached?.();
    }, [onViewAttached]);

    const handleAddressChangeIntent = useCallback(
      (event: {nativeEvent: {id: string, type: string, addressType: string}}) => {
        if (event.nativeEvent) {
          onAddressChangeIntent?.(event.nativeEvent);
        }
      },
      [onAddressChangeIntent],
    );

    const reload = useCallback(() => {
      if (Platform.OS === 'ios' && webViewRef.current) {
        const handle = findNodeHandle(webViewRef.current);
        if (handle) {
          UIManager.dispatchViewManagerCommand(
            handle,
            UIManager.getViewManagerConfig('RCTCheckoutWebView')?.Commands
              ?.reload ?? 1,
            [],
          );
        }
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        reload,
      }),
      [reload],
    );

    // Only render on iOS as the native module is iOS-only
    if (Platform.OS !== 'ios') {
      // eslint-disable-next-line no-console
      console.warn('CheckoutWebViewController is only available on iOS');
      return null;
    }

    return (
      <RCTCheckoutWebView
        ref={webViewRef}
        checkoutUrl={checkoutUrl}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onPixelEvent={handlePixelEvent}
        onClickLink={handleClickLink}
        onViewAttached={handleViewAttached}
        onAddressChangeIntent={handleAddressChangeIntent}
      />
    );
  },
);

CheckoutWebViewController.displayName = 'CheckoutWebViewController';

export default CheckoutWebViewController;
