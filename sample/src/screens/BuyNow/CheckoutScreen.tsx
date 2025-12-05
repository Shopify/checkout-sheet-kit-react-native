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

import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import React, {useRef} from 'react';
import {
  ShopifyCheckout,
  type CheckoutAddressChangeStartEvent,
  type CheckoutCompleteEvent,
  type CheckoutPaymentMethodChangeStartEvent,
  type ShopifyCheckoutRef,
  type CheckoutStartEvent,
  type CheckoutSubmitStartEvent,
  useCheckoutEvents,
} from '@shopify/checkout-sheet-kit';
import type {BuyNowStackParamList} from './types';
import {StyleSheet} from 'react-native';

// This component represents a screen in the consumers app that
// wraps the shopify Checkout and provides it the auth param
export default function CheckoutScreen(props: {
  route: RouteProp<BuyNowStackParamList, 'Checkout'>;
}) {
  const navigation = useNavigation<NavigationProp<BuyNowStackParamList>>();
  const ref = useRef<ShopifyCheckoutRef>(null);
  const eventContext = useCheckoutEvents();

  const onStart = (event: CheckoutStartEvent) => {
    console.log('<CheckoutScreen /> onStart', event);
  };

  const onAddressChangeStart = (event: CheckoutAddressChangeStartEvent) => {
    console.log('<CheckoutScreen /> onAddressChangeStart: ', event);
    navigation.navigate('Address', {id: event.id});
  };

  const onPaymentMethodChangeStart = (
    event: CheckoutPaymentMethodChangeStartEvent,
  ) => {
    console.log('<CheckoutScreen /> onPaymentMethodChangeStart: ', event);
    navigation.navigate('Payment', {id: event.id});
  };

  const onSubmitStart = async (event: CheckoutSubmitStartEvent) => {
    console.log('<CheckoutScreen /> onSubmitStart', event);
    try {
      await eventContext?.respondToEvent(event.id, {
        payment: {
          token: '1234567890',
          tokenType: 'delegated',
          tokenProvider: 'shopify',
        },
      });
    } catch (error) {
      console.error('Failed to respond to submit event:', error);
    }
  };

  const onCancel = () => {
    console.log('<CheckoutScreen /> onCancel: ');
    navigation.getParent()?.goBack();
  };

  const onError = (error: unknown) => {
    console.log('<CheckoutScreen /> onError: ', error);
    ref.current?.reload();
  };

  const onComplete = (event: CheckoutCompleteEvent) => {
    console.log('<CheckoutScreen /> onComplete: ', event);
    navigation.getParent()?.goBack();
  };

  return (
    <ShopifyCheckout
      ref={ref}
      checkoutUrl={props.route.params.url}
      auth={props.route.params.auth}
      style={styles.container}
      onStart={onStart}
      onAddressChangeStart={onAddressChangeStart}
      onPaymentMethodChangeStart={onPaymentMethodChangeStart}
      onSubmitStart={onSubmitStart}
      onCancel={onCancel}
      onError={onError}
      onComplete={onComplete}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
