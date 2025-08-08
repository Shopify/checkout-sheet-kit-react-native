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
import type {AcceleratedCheckoutWallet} from '.';

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
   * Called when an error occurs during checkout
   */
  onError?: (error: {message: string}) => void;

  /**
   * Called when checkout is completed successfully
   */
  onCheckoutCompleted?: () => void;
}

const RCTAcceleratedCheckoutButtons =
  requireNativeComponent<AcceleratedCheckoutButtonsProps>(
    'RCTAcceleratedCheckoutButtons',
  );

/**
 * AcceleratedCheckoutButton provides pre-built payment UI components for Shop Pay and Apple Pay.
 * It enables faster checkout with fewer steps and supports both cart and product page checkout.
 *
 * @example Cart-based checkout
 * <AcceleratedCheckoutButton
 *   cartId="gid://shopify/Cart/123"
 *   onCheckoutCompleted={() => console.log('Checkout completed!')}
 *   onError={(error) => console.error('Checkout error:', error.message)}
 * />
 *
 * @example Product-based checkout
 * <AcceleratedCheckoutButton
 *   variantId="gid://shopify/ProductVariant/456"
 *   quantity={2}
 *   onCheckoutCompleted={() => console.log('Checkout completed!')}
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
  onError,
  onCheckoutCompleted,
}) => {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleError = useCallback(
    (event: {message: string}) => {
      const {message} = event;
      if (message) {
        onError?.({message});
      }
    },
    [onError],
  );

  const handleCheckoutCompleted = useCallback(() => {
    onCheckoutCompleted?.();
  }, [onCheckoutCompleted]);

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
      onError={handleError}
      onCheckoutCompleted={handleCheckoutCompleted}
    />
  );
};

export default AcceleratedCheckoutButtons;
