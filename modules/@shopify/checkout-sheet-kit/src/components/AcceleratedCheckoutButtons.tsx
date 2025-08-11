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

import React, {useCallback} from 'react';
import {requireNativeComponent, Platform} from 'react-native';
import type {ViewStyle} from 'react-native';
import type {
  AcceleratedCheckoutWallet,
  CheckoutCompletedEvent,
  CheckoutException,
  PixelEvent,
} from '..';

export enum RenderState {
  Loading = 'loading',
  Rendered = 'rendered',
  Error = 'error',
}

interface AcceleratedCheckoutButtonsProps {
  /**
   * The cart ID for cart-based checkout
   */
  cartId?: string;

  /**
   * The variant ID for product-based checkout
   */
  variantId?: string;

  /**
   * The quantity for product-based checkout (defaults to 1)
   */
  quantity?: number;

  /**
   * Corner radius for the button (defaults to 8)
   */
  cornerRadius?: number;

  /**
   * Style for the container view
   */
  style?: ViewStyle;

  /**
   * Wallets to display in the button
   * Defaults to both shopPay and applePay if not specified
   */
  wallets?: AcceleratedCheckoutWallet[];

  /**
   * Called when the button is pressed
   */
  onPress?: () => void;

  /**
   * Called when checkout fails
   */
  onFail?: (error: CheckoutException) => void;

  /**
   * Called when checkout is completed successfully
   */
  onComplete?: (event: CheckoutCompletedEvent) => void;

  /**
   * Called when checkout is cancelled
   */
  onCancel?: () => void;

  /**
   * Called when the render state changes
   * States from SDK: loading, rendered, error
   */
  onRenderStateChange?: (state: RenderState) => void;

  /**
   * Called when a web pixel event is triggered
   */
  onWebPixelEvent?: (event: PixelEvent) => void;

  /**
   * Called when a link is clicked within the checkout
   */
  onClickLink?: (url: string) => void;
}

interface NativeAcceleratedCheckoutButtonsProps {
  style?: ViewStyle;
  cartId?: string;
  variantId?: string;
  quantity?: number;
  cornerRadius?: number;
  wallets?: AcceleratedCheckoutWallet[];
  onPress?: () => void;
  onFail?: (event: {nativeEvent: CheckoutException}) => void;
  onComplete?: (event: {nativeEvent: CheckoutCompletedEvent}) => void;
  onCancel?: () => void;
  onRenderStateChange?: (event: {nativeEvent: {state: string}}) => void;
  onWebPixelEvent?: (event: {nativeEvent: PixelEvent}) => void;
  onClickLink?: (event: {nativeEvent: {url: string}}) => void;
}

const RCTAcceleratedCheckoutButtons =
  requireNativeComponent<NativeAcceleratedCheckoutButtonsProps>(
    'RCTAcceleratedCheckoutButtons',
  );

/**
 * AcceleratedCheckoutButton provides pre-built payment UI components for Shop Pay and Apple Pay.
 * It enables faster checkout with fewer steps and supports both cart and product page checkout.
 *
 * @example Cart-based checkout
 * <AcceleratedCheckoutButtons
 *   cartId="gid://shopify/Cart/123"
 *   onComplete={(event) => console.log('Checkout completed!', event.orderDetails)}
 *   onFail={(error) => console.error('Checkout failed:', error.message)}
 * />
 *
 * @example Product-based checkout
 * <AcceleratedCheckoutButtons
 *   variantId="gid://shopify/ProductVariant/456"
 *   quantity={2}
 *   onComplete={(event) => console.log('Checkout completed!', event.orderDetails)}
 * />
 */

export const AcceleratedCheckoutButtons: React.FC<
  AcceleratedCheckoutButtonsProps
> = ({
  cartId,
  variantId,
  quantity = 1,
  cornerRadius = 8,
  style,
  wallets,
  onPress,
  onFail,
  onComplete,
  onCancel,
  onRenderStateChange,
  onWebPixelEvent,
  onClickLink,
}) => {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleFail = useCallback(
    (event: {nativeEvent: CheckoutException}) => {
      onFail?.(event.nativeEvent);
    },
    [onFail],
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

  const handleRenderStateChange = useCallback(
    (event: {nativeEvent: {state: string}}) => {
      if (event.nativeEvent?.state) {
        onRenderStateChange?.(event.nativeEvent.state as RenderState);
      }
    },
    [onRenderStateChange],
  );

  const handleWebPixelEvent = useCallback(
    (event: {nativeEvent: PixelEvent}) => {
      onWebPixelEvent?.(event.nativeEvent);
    },
    [onWebPixelEvent],
  );

  const handleClickLink = useCallback(
    (event: {nativeEvent: {url: string}}) => {
      if (event.nativeEvent?.url) {
        onClickLink?.(event.nativeEvent.url);
      }
    },
    [onClickLink],
  );

  // Only render on iOS for now since ShopifyAcceleratedCheckouts is iOS-only
  if (Platform.OS !== 'ios') {
    return null;
  }

  // Require either cartId or variantId
  if (!cartId && !variantId) {
    // eslint-disable-next-line no-console
    console.warn(
      'AcceleratedCheckoutButton: Either `cartId` or `variantId` must be provided',
    );
    return null;
  }

  return (
    <RCTAcceleratedCheckoutButtons
      style={style}
      cartId={cartId}
      variantId={variantId}
      quantity={quantity}
      cornerRadius={cornerRadius}
      wallets={wallets}
      onPress={handlePress}
      onFail={handleFail}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onRenderStateChange={handleRenderStateChange}
      onWebPixelEvent={handleWebPixelEvent}
      onClickLink={handleClickLink}
    />
  );
};

export default AcceleratedCheckoutButtons;
