import {type NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useRef} from 'react';
import {View} from 'react-native';
import {type CheckoutStackParamList} from './Navigation';
import {
  CheckoutWebViewController,
  type CheckoutException,
  type CheckoutWebViewControllerHandle,
  type CheckoutWebViewControllerProps,
} from '..';
import type {CheckoutAddressChangeIntent} from '../events';

type CheckoutDelegateEvents = Pick<
  CheckoutWebViewControllerProps,
  | 'onPixelEvent'
  | 'onComplete'
  | 'onCancel'
  | 'onClickLink'
  | 'onError'
  | 'onAddressChangeIntent'
>;
type NavigationProps = NativeStackScreenProps<
  CheckoutStackParamList,
  'CheckoutWebView'
>;
type CheckoutWebViewProps = NavigationProps &
  CheckoutDelegateEvents & {
    url: URL;
    auth: string;
    goBack: () => void;
  };

export function CheckoutWebView(props: CheckoutWebViewProps) {
  const checkoutRef = useRef<CheckoutWebViewControllerHandle>(null);
  const delegate = useCheckoutDelegate(props, checkoutRef);

  const url = new URL(props.url.toString());
  url.searchParams.append('embed', props.auth); // Mock implementation

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1}}>
        <CheckoutWebViewController
          ref={checkoutRef}
          checkoutUrl={url.toString()}
          style={{flex: 1, minHeight: 400}}
          onAddressChangeIntent={delegate.onAddressChangeIntent}
          onCancel={delegate.onCancel}
          onComplete={delegate.onComplete}
          onError={delegate.onError}
          onPixelEvent={delegate.onPixelEvent}

          // Used for debugging setting up the component, will remove after refactors to native code
          // onViewAttached={() => {
          //    console.log('Native webview attached!');
          // }}
          // onLoad={event => {
          //    console.log('Native webview loaded with URL:', event.url);
          // }}
        />
      </View>
    </View>
  );
}

function useCheckoutDelegate(
  props: CheckoutWebViewProps,
  checkoutRef: React.RefObject<CheckoutWebViewControllerHandle | null>,
): CheckoutDelegateEvents {
  const onAddressChangeIntent = (event: CheckoutAddressChangeIntent) => {
    props.onAddressChangeIntent?.(event);
    props.navigation.navigate('Address', {id: event.id});
  };

  const onCancel = () => {
    props.onCancel?.();
    props.goBack();
  };

  const onError = (error: CheckoutException) => {
    props.onError?.(error);
    checkoutRef.current?.reload();
  };

  return {
    ...props,
    onAddressChangeIntent,
    onError,
    onCancel,
  };
}
