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
import React, {useMemo, useRef, useState} from 'react';
import {
  ShopifyCheckout,
  type CheckoutAddressChangeStartEvent,
  type CheckoutCompleteEvent,
  type CheckoutPaymentMethodChangeStartEvent,
  type ShopifyCheckoutRef,
  type CheckoutStartEvent,
  type CheckoutSubmitStartEvent,
  type CheckoutPrimaryActionChangeEvent,
  useCheckoutEvents,
} from '@shopify/checkout-sheet-kit';
import type {BuyNowStackParamList} from './types';
import {StyleSheet, View, TouchableOpacity, Text, ActivityIndicator} from 'react-native';

// This component represents a screen in the consumers app that
// wraps the shopify Checkout and provides it the auth param
export default function CheckoutScreen(props: {
  route: RouteProp<BuyNowStackParamList, 'Checkout'>;
}) {
  const navigation = useNavigation<NavigationProp<BuyNowStackParamList>>();
  const ref = useRef<ShopifyCheckoutRef>(null);
  const eventContext = useCheckoutEvents();
  const [primaryAction, setPrimaryAction] = useState<CheckoutPrimaryActionChangeEvent>({
    method: 'checkout.primaryActionChange',
    state: 'disabled',
    action: 'pay',
    cart: props.route.params.cart ?? ({} as any),
  });

  const onStart = (event: CheckoutStartEvent) => {
    console.log('<CheckoutScreen /> onStart', event);
  };

  const onAddressChangeStart = (event: CheckoutAddressChangeStartEvent) => {
    console.log('<CheckoutScreen /> onAddressChangeStart: ', event);
    navigation.navigate('Address', {id: event.id, cart: event.cart});
  };

  const onPaymentMethodChangeStart = (
    event: CheckoutPaymentMethodChangeStartEvent,
  ) => {
    console.log('<CheckoutScreen /> onPaymentMethodChangeStart: ', event);
    navigation.navigate('Payment', {id: event.id, cart: event.cart});
  };

  const onSubmitStart = async (event: CheckoutSubmitStartEvent) => {
    console.log('<CheckoutScreen /> onSubmitStart', event);
    try {
      await eventContext?.respondToEvent(event.id, {
        cart: {
          ...event.cart,
          payment: {
            methods: [
              {
                type: 'creditCard',
                instruments: [
                  {
                    externalReferenceId: 'payment-instrument-123',
                    credentials: [
                      {
                        type: 'remoteToken',
                        token: '1234567890',
                        tokenType: 'delegated',
                        tokenHandler: 'shopify',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      });
    } catch (error) {
      console.error('Failed to respond to submit event:', error);
    }
  };

  const onPrimaryActionChange = (event: CheckoutPrimaryActionChangeEvent) => {
    setPrimaryAction(event);
  };

  const buttonLabel = useMemo(() => {
    return primaryAction.action === 'review' ? 'Review order' : 'Pay now';
  }, [primaryAction.action]);

  const onCancel = () => {
    console.log('<CheckoutScreen /> onCancel: ');
    navigation.getParent()?.goBack();
  };

  const onFail = (error: unknown) => {
    console.log('<CheckoutScreen /> onFail: ', error);
    ref.current?.reload();
  };

  const onComplete = (event: CheckoutCompleteEvent) => {
    console.log('<CheckoutScreen /> onComplete: ', event);
    navigation.getParent()?.goBack();
  };

  return (
    <View style={styles.container}>
      <ShopifyCheckout
        ref={ref}
        checkoutUrl={props.route.params.url}
        auth={props.route.params.auth}
        style={styles.container}
        onStart={onStart}
        onAddressChangeStart={onAddressChangeStart}
        onPaymentMethodChangeStart={onPaymentMethodChangeStart}
        onSubmitStart={onSubmitStart}
        onPrimaryActionChange={onPrimaryActionChange}
        onCancel={onCancel}
        onFail={onFail}
        onComplete={onComplete}
      />

      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[
              styles.button,
              primaryAction.state !== 'enabled' && styles.buttonDisabled,
            ]}
            disabled={primaryAction.state !== 'enabled'}
            onPress={() => ref.current?.reload()}>
            {primaryAction.state === 'loading' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{buttonLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  buttonWrapper: {
    padding: 16,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
