import {type NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {Button, Pressable, StyleSheet, Text, View} from 'react-native';
import {useCheckoutContext, type CheckoutStackParamList} from './Navigation';

type CheckoutScreenProps = NativeStackScreenProps<
  CheckoutStackParamList,
  'CheckoutWebView'
>;

const addressid = 'address-change-id:123';
const paymentid = 'payment-change-id:123';

export function CheckoutWebView(props: CheckoutScreenProps) {
  const {address, payments} = useCheckoutContext();

  return (
    <View>
      <Text>CHECKOUT WEBVIEW</Text>

      <Pressable
        onPress={() => props.navigation.navigate('Address', {id: addressid})}>
        <View style={styles.card}>
          <Text>Selected Address</Text>
          <Text>{JSON.stringify(address, null, 2)}</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => props.navigation.navigate('Payment', {id: paymentid})}>
        <View style={styles.card}>
          <Text>Payment Method:</Text>
          <Text>{JSON.stringify(payments, null, 2)}</Text>
        </View>
      </Pressable>

      <Button title="Pay" onPress={() => props.navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
