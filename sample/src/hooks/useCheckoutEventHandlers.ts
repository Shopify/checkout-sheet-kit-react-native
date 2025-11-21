import {useMemo} from 'react';

import {createDebugLogger} from '../utils';

import {useCart} from '../context/Cart';
import type {
  CheckoutCompletedEvent,
  CheckoutException,
  CheckoutStartedEvent,
  RenderStateChangeEvent,
} from '@shopify/checkout-sheet-kit';
import {Linking} from 'react-native';

interface EventHandlers {
  onFail?: (error: CheckoutException) => void;
  onComplete?: (event: CheckoutCompletedEvent) => void;
  onStart?: (event: CheckoutStartedEvent) => void;
  onCancel?: () => void;
  onRenderStateChange?: (event: RenderStateChangeEvent) => void;
  onShouldRecoverFromError?: (error: {message: string}) => boolean;
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
        log('onComplete', event.orderConfirmation.order.id);
        clearCart();
      },
      onStart: event => {
        log('onStart', event.cart);
      },
      onCancel: () => {
        log('onCancel');
      },
      onRenderStateChange: event => {
        log('onRenderStateChange', event);
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
