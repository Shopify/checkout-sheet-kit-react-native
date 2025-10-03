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
import {Checkout} from '@shopify/checkout-sheet-kit';
import type {BuyNowStackParamList} from './types';

function getAuthUrl(url: string, auth: string) {
  const authUrl = new URL(url);
  // TODO; Mock implementation
  authUrl.searchParams.append('embed', auth);
  return authUrl;
}

/// Mock implementation
function useAuth() {
  return '';
}

export default function CheckoutWebViewScreen(props: {
  route: RouteProp<BuyNowStackParamList, 'CheckoutWebView'>;
}) {
  const navigation = useNavigation<NavigationProp<BuyNowStackParamList>>();
  const ref = useRef<any>(null);
  const auth = useAuth();
  const url = getAuthUrl(props.route.params.url, auth);

  const onAddressChangeIntent = (event: {id: string}) => {
    navigation.navigate('Address', {id: event.id});
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
      checkoutUrl={url.toString()}
      style={{flex: 1}}
      onAddressChangeIntent={onAddressChangeIntent}
      onCancel={onCancel}
      onError={onError}
      onComplete={onComplete}
      onPixelEvent={event => console.log(event.name)}
    />
  );
}
