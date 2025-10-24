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
import React, {useEffect, useRef, useState} from 'react';
import {
  Checkout,
  type CheckoutRef,
  type CheckoutOptions,
} from '@shopify/checkout-sheet-kit';
import Config from 'react-native-config';
import type {BuyNowStackParamList} from './types';
import {StyleSheet} from 'react-native';

/**
 * Response from Shopify's access token endpoint
 */
interface AccessTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Hook that fetches an authentication token from the authorization server.
 */
function useAuth(): string | undefined {
  const [token, setToken] = useState<string | undefined>();

  useEffect(() => {
    const fetchToken = async () => {
      const clientId = Config.SHOPIFY_CLIENT_ID || '';
      const clientSecret = Config.SHOPIFY_CLIENT_SECRET || '';
      const authEndpoint = Config.SHOPIFY_AUTH_ENDPOINT || '';

      // Skip if credentials are not configured
      if (!clientId || !clientSecret) {
        return;
      }

      try {
        const response = await fetch(
          authEndpoint,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'client_credentials',
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch access token: ${response.status} ${response.statusText}`,
          );
        }

        const data: AccessTokenResponse = await response.json();
        setToken(data.access_token);
      } catch (error) {
        console.error('Error fetching auth token:', error);
      }
    };

    fetchToken();
  }, []);



  return token;
}

// This component represents a screen in the consumers app that
// wraps the shopify Checkout and provides it the auth param
export default function CheckoutScreen(props: {
  route: RouteProp<BuyNowStackParamList, 'Checkout'>;
}) {
  const navigation = useNavigation<NavigationProp<BuyNowStackParamList>>();
  const ref = useRef<CheckoutRef>(null);
  const authToken = useAuth();

  const checkoutOptions: CheckoutOptions | undefined = authToken
    ? {
        authentication: {
          token: authToken,
        },
      }
    : undefined;

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
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
