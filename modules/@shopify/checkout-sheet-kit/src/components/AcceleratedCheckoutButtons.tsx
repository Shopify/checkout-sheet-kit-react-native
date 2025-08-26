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

import React, {useCallback, useMemo, useState} from 'react';
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
  Unknown = 'unknown',
}

export type RenderStateChangeEvent =
  | {state: RenderState.Error; reason?: string}
  | {state: RenderState.Loading}
  | {state: RenderState.Rendered}
  | {state: RenderState.Unknown};

export enum ApplePayLabel {
  addMoney = 'addMoney',
  book = 'book',
  buy = 'buy',
  checkout = 'checkout',
  continue = 'continue',
  contribute = 'contribute',
  donate = 'donate',
  inStore = 'inStore',
  order = 'order',
  plain = 'plain',
  reload = 'reload',
  rent = 'rent',
  setUp = 'setUp',
  subscribe = 'subscribe',
  support = 'support',
  tip = 'tip',
  topUp = 'topUp',
}

type CheckoutIdentifier =
  | {
      cartId: string;
    }
  | {
      variantId: string;
      quantity: number;
    };

interface CommonAcceleratedCheckoutButtonsProps {
  /**
   * Corner radius for the button (defaults to 8)
   */
  cornerRadius?: number;

  /**
   * Wallets to display in the button
   * Defaults to both shopPay and applePay if not specified
   */
  wallets?: AcceleratedCheckoutWallet[];

  /**
   * Label for the Apple Pay button
   */
  applePayLabel?: ApplePayLabel;

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
  onRenderStateChange?: (event: RenderStateChangeEvent) => void;

  /**
   * Called when a web pixel event is triggered
   */
  onWebPixelEvent?: (event: PixelEvent) => void;

  /**
   * Called when a link is clicked within the checkout
   */
  onClickLink?: (url: string) => void;

  /**
   * Called when the size of the button changes
   */
  onSizeChange?: (event: {nativeEvent: {height: number}}) => void;
}

interface CartProps {
  /**
   * The cart ID for cart-based checkout
   */
  cartId: string;
}

interface VariantProps {
  /**
   * The variant ID for product-based checkout
   */
  variantId: string;

  /**
   * The quantity for product-based checkout
   */
  quantity: number;
}

type AcceleratedCheckoutButtonsProps = (CartProps | VariantProps) &
  CommonAcceleratedCheckoutButtonsProps;

interface NativeAcceleratedCheckoutButtonsProps {
  applePayLabel?: string;
  style?: ViewStyle;
  checkoutIdentifier: CheckoutIdentifier;
  cornerRadius?: number;
  wallets?: AcceleratedCheckoutWallet[];
  onFail?: (event: {nativeEvent: CheckoutException}) => void;
  onComplete?: (event: {nativeEvent: CheckoutCompletedEvent}) => void;
  onCancel?: () => void;
  onRenderStateChange?: (event: {
    nativeEvent: {state: string; reason?: string | undefined};
  }) => void;
  onWebPixelEvent?: (event: {nativeEvent: PixelEvent}) => void;
  onClickLink?: (event: {nativeEvent: {url: string}}) => void;
  onSizeChange?: (event: {nativeEvent: {height: number}}) => void;
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
 *   quantity={1}
 *   onComplete={(event) => console.log('Checkout completed!', event.orderDetails)}
 * />
 */

export const AcceleratedCheckoutButtons: React.FC<
  AcceleratedCheckoutButtonsProps
> = ({
  applePayLabel,
  cornerRadius,
  wallets,
  onFail,
  onComplete,
  onCancel,
  onRenderStateChange,
  onWebPixelEvent,
  onClickLink,
  ...props
}) => {
  const isCart = isCartProps(props);
  const isVariant = isVariantProps(props);
  const [dynamicHeight, setDynamicHeight] = useState<number | undefined>(
    undefined,
  );

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
    (event: {nativeEvent: {state: string; reason?: string | undefined}}) => {
      const state = validRenderState(event.nativeEvent.state);
      const reason = event.nativeEvent.reason;

      if (state === RenderState.Error) {
        onRenderStateChange?.({state, reason});
      } else {
        onRenderStateChange?.({state});
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

  const handleSizeChange = useCallback(
    (event: {nativeEvent: {height: number}}) => {
      setDynamicHeight(event.nativeEvent.height);
    },
    [],
  );

  const checkoutIdentifier: CheckoutIdentifier | undefined = useMemo(() => {
    switch (true) {
      case isCart:
        return {cartId: props.cartId};
      case isVariant:
        return {variantId: props.variantId, quantity: props.quantity};
      default:
        return undefined;
    }
  }, [isCart, isVariant, props]);

  // Only render on iOS for now since ShopifyAcceleratedCheckouts is iOS-only
  if (Platform.OS !== 'ios' || parseInt(Platform.Version, 10) < 16) {
    return null;
  }

  if (!checkoutIdentifier) {
    /**
     * @todo
     *
     * The ShopifyAcceleratedCheckouts module will handle this error by returning an empty view over the bridge
     * to the javascript client.
     *
     * The onRenderStateChange event will be invoked with both an error state and a reason to indicate the error, at
     * which point this error handling can be removed.
     *
     */

    const error = new Error(
      'AcceleratedCheckoutButton: Either `cartId` or `variantId` and `quantity` must be provided',
    );
    if (__DEV__) {
      throw error;
    } else {
      // eslint-disable-next-line no-console
      console.warn(error.message);
      return null;
    }
  }

  return (
    <RCTAcceleratedCheckoutButtons
      applePayLabel={applePayLabel}
      style={dynamicHeight ? {height: dynamicHeight} : undefined}
      checkoutIdentifier={checkoutIdentifier}
      cornerRadius={cornerRadius}
      wallets={wallets}
      onFail={handleFail}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onRenderStateChange={handleRenderStateChange}
      onWebPixelEvent={handleWebPixelEvent}
      onClickLink={handleClickLink}
      onSizeChange={handleSizeChange}
    />
  );
};

export default AcceleratedCheckoutButtons;

function validRenderState(state: string): RenderState {
  return (
    Object.values(RenderState).find(renderState => renderState === state) ??
    RenderState.Unknown
  );
}

function isCartProps(
  props: AcceleratedCheckoutButtonsProps,
): props is CartProps {
  return 'cartId' in props;
}

function isVariantProps(
  props: AcceleratedCheckoutButtonsProps,
): props is VariantProps {
  return 'variantId' in props && 'quantity' in props && props.quantity > 0;
}
