import {useMemo} from 'react';

import {createDebugLogger} from '../utils';

import {useCart} from '../context/Cart';
import type {
  CheckoutCompletedEvent,
  CheckoutException,
  PixelEvent,
  RenderStateChangeEvent,
} from '@shopify/checkout-sheet-kit';
import {Linking} from 'react-native';

interface EventHandlers {
  onFail?: (error: CheckoutException) => void;
  onComplete?: (event: CheckoutCompletedEvent) => void;
  onCancel?: () => void;
  onRenderStateChange?: (event: RenderStateChangeEvent) => void;
  onShouldRecoverFromError?: (error: {message: string}) => boolean;
  onWebPixelEvent?: (event: PixelEvent) => void;
  onClickLink?: (url: string) => void;
}

export function useShopifyEventHandlers(name?: string): EventHandlers {
  const {clearCart} = useCart();

  return useMemo(() => {
    const log = createDebugLogger(name ?? '');
    return {
      onFail: error => {
        log('onFail', error);
      },
      onComplete: event => {
        log('onComplete', event.orderDetails.id);
        clearCart();
      },
      onCancel: () => {
        log('onCancel');
      },
      onRenderStateChange: event => {
        log('onRenderStateChange', event);
      },
      onWebPixelEvent: event => {
        log('onWebPixelEvent', event.name);
      },
      onClickLink: async url => {
        log('onClickLink', url);

        if (await Linking.canOpenURL(url)) {
          await Linking.openURL(url);
        }
      },
    };
  }, [clearCart, name]);
}
