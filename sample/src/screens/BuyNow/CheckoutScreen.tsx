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
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Checkout,
  type CheckoutRef,
  type CheckoutOptions,
} from '@shopify/checkout-sheet-kit';
import type {BuyNowStackParamList} from './types';
import {StyleSheet} from 'react-native';
import {authConfig, hasAuthCredentials} from '../../config/authConfig';
import {generateAuthToken} from '../../utils/crypto/jwtTokenGenerator';
import {useConfig} from '../../context/Config';

function useAuth(enabled: boolean): string | undefined {
  const [token, setToken] = useState<string | undefined>();

  useEffect(() => {
    if (!enabled || !hasAuthCredentials()) {
      setToken(undefined);
      return;
    }

    try {
      const generatedToken = generateAuthToken(
        authConfig.apiKey,
        authConfig.sharedSecret,
        authConfig.accessToken,
      );
      setToken(generatedToken ?? undefined);
    } catch (error) {
      console.error('[CheckoutScreen] Auth token generation error:', error);
      setToken(undefined);
    }
  }, [enabled]);

  return token;
}

// This component represents a screen in the consumers app that
// wraps the shopify Checkout and provides it the auth param
export default function CheckoutScreen(props: {
  route: RouteProp<BuyNowStackParamList, 'Checkout'>;
}) {
  const navigation = useNavigation<NavigationProp<BuyNowStackParamList>>();
  const ref = useRef<CheckoutRef>(null);
  const {appConfig} = useConfig();
  const authToken = useAuth(appConfig.appAuthenticationEnabled);

  const checkoutOptions = useMemo<CheckoutOptions | undefined>(() => {
    if (!authToken) {
      return undefined;
    }
    return {
      authentication: {
        token: authToken,
      },
    };
  }, [authToken]);

  const onAddressChangeIntent = (event: {id: string}) => {
    navigation.navigate('Address', {id: event.id});
  };

  const onPaymentChangeIntent = (event: {id: string}) => {
    navigation.navigate('Payment', {id: event.id});
  };

  const onCancel = () => {
    navigation.getParent()?.goBack();
  };

  const onError = () => {
    ref.current?.reload();
  };

  const onComplete = () => {
    navigation.getParent()?.goBack();
  };

  return (
    <Checkout
      ref={ref}
      checkoutUrl={props.route.params.url}
      options={checkoutOptions}
      style={styles.container}
      onAddressChangeIntent={onAddressChangeIntent}
      onPaymentChangeIntent={onPaymentChangeIntent}
      onCancel={onCancel}
      onError={onError}
      onComplete={onComplete}
      onPixelEvent={event => console.log(event.name)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
