import {type NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useRef} from 'react';
import {StyleSheet} from 'react-native';
import {
  CheckoutWebViewController,
  type CheckoutException,
  type CheckoutWebViewControllerHandle,
  type CheckoutWebViewControllerProps,
} from '..';
import type {CheckoutAddressChangeIntent} from '../events';
import {type CheckoutStackParamList} from './Navigation';

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
  const ref = useRef<CheckoutWebViewControllerHandle>(null);
  const events = useCheckoutEvents(props, ref);

  const url = getAuthUrl(props.url, props.auth); // Mock implementation

  return (
    <CheckoutWebViewController
      ref={ref}
      checkoutUrl={url.toString()}
      style={styles.container}
      onAddressChangeIntent={events.onAddressChangeIntent}
      onCancel={events.onCancel}
      onComplete={events.onComplete}
      onError={events.onError}
      onPixelEvent={events.onPixelEvent}

      // Used for debugging setting up the component, will remove after refactors to native code
      // onViewAttached={() => {
      //    console.log('Native webview attached!');
      // }}
      // onLoad={event => {
      //    console.log('Native webview loaded with URL:', event.url);
      // }}
    />
  );
}

function getAuthUrl(
  url: CheckoutWebViewProps['url'],
  auth: CheckoutWebViewProps['auth'],
) {
  const authUrl = new URL(url.toString());

  // TODO; Mock implementation
  authUrl.searchParams.append('embed', auth);

  return authUrl;
}

function useCheckoutEvents(
  props: CheckoutWebViewProps,
  ref: React.RefObject<CheckoutWebViewControllerHandle | null>,
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
    ref.current?.reload();
  };

  return {
    ...props,
    onAddressChangeIntent,
    onError,
    onCancel,
  };
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
