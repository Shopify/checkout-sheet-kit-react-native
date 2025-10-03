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

import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import React from 'react';
import {Button} from 'react-native';
import {CheckoutEventProvider} from '@shopify/checkout-sheet-kit/src/CheckoutEventProvider';
import type {RootStackParamList} from '../../App';
import CheckoutScreen from './CheckoutScreen';
import AddressScreen from './AddressScreen';
import PaymentScreen from './PaymentScreen';
import type {BuyNowStackParamList} from './types';

const BuyNowStackNavigator = createNativeStackNavigator<BuyNowStackParamList>();

type BuyNowStackProps = {
  route: RouteProp<RootStackParamList, 'BuyNow'>;
};

export default function BuyNowStack(props: BuyNowStackProps) {
  return (
    <CheckoutEventProvider>
      <BuyNowStackNavigator.Navigator
        initialRouteName="Checkout"
        screenOptions={({navigation}) => ({
          headerStyle: {backgroundColor: '#ffffff'},
          headerTintColor: '#000',
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <Button
              title="Cancel"
              color="black"
              onPress={() => navigation.getParent()?.goBack()}
            />
          ),
        })}>
        <BuyNowStackNavigator.Screen
          name="Checkout"
          component={CheckoutScreen}
          initialParams={{url: props.route.params.url}}
          options={{title: 'Shopify Checkout'}}
        />
        <BuyNowStackNavigator.Screen
          name="Address"
          component={AddressScreen}
          options={{title: 'Shipping Address'}}
        />
        <BuyNowStackNavigator.Screen
          name="Payment"
          component={PaymentScreen}
          options={{title: 'Payment Details'}}
        />
      </BuyNowStackNavigator.Navigator>
    </CheckoutEventProvider>
  );
}
