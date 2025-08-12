import {useMemo} from 'react';

import {createDebugLogger} from '../utils';

import {useCart} from '../context/Cart';
import type {
  CheckoutCompletedEvent,
  CheckoutException,
  PixelEvent,
} from '@shopify/checkout-sheet-kit';
import {Linking} from 'react-native';

interface EventHandlers {
  onPress?: () => void;
  onFail?: (error: CheckoutException) => void;
  onComplete?: (event: CheckoutCompletedEvent) => void;
  onCancel?: () => void;
  onShouldRecoverFromError?: (error: {message: string}) => boolean;
  onWebPixelEvent?: (event: PixelEvent) => void;
  onClickLink?: (url: string) => void;
}

export function useShopifyEventHandlers(name?: string): EventHandlers {
  const log = createDebugLogger(name ?? '');
  const {clearCart} = useCart();

  return useMemo(() => {
    return {
      onPress: () => {
        log('onPress');
      },
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
  }, [log, clearCart]);
}
