import {type NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useRef} from 'react';
import {View} from 'react-native';
import {type CheckoutStackParamList} from './Navigation';
import {
  CheckoutWebViewController,
  type CheckoutWebViewControllerHandle,
  type CheckoutCompletedEvent,
  type CheckoutException,
} from '..';

type CheckoutScreenProps = NativeStackScreenProps<
  CheckoutStackParamList,
  'CheckoutWebView'
> & {
  outerNavigation: any;
  url: string;
};

// const addressid = 'address-change-id:123';
// const paymentid = 'payment-change-id:123';

export function CheckoutWebView(props: CheckoutScreenProps) {
  // const {address, payments} = useCheckoutContext();
  const checkoutRef = useRef<CheckoutWebViewControllerHandle>(null);

  // onPress={() => props.navigation.navigate('Address', {id: addressid})}>
  // onPress={() => props.navigation.navigate('Payment', {id: paymentid})}>
  //  <Button title="Pay" onPress={() => props.outerNavigation.goBack()} />
  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1, backgroundColor: '#f5f5f5'}}>
        <CheckoutWebViewController
          ref={checkoutRef}
          checkoutUrl={props.url}
          onComplete={(event: CheckoutCompletedEvent) => {
            // eslint-disable-next-line no-console
            console.log('Order completed!', event.orderDetails);
          }}
          onError={(error: CheckoutException) => {
            // eslint-disable-next-line no-console
            console.error('Checkout failed:', error);
            // Optionally reload on error
            checkoutRef.current?.reload();
          }}
          onCancel={() => {
            // eslint-disable-next-line no-console
            console.log('Checkout cancelled');
          }}
          onPixelEvent={event => {
            console.log('---event', event);
          }}
          style={{flex: 1}}
        />
      </View>
    </View>
  );
}

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 16,
//     marginVertical: 8,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
// });
