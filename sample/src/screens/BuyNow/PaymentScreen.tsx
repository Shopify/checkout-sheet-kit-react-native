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

import type {RouteProp} from '@react-navigation/native';
import {useNavigation, useRoute} from '@react-navigation/native';
import React from 'react';
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useShopifyEvent} from '@shopify/checkout-sheet-kit/src/CheckoutEventProvider';
import {useCart} from '../../context/Cart';
import type {BuyNowStackParamList} from './types';

export default function PaymentScreen() {
  const route = useRoute<RouteProp<BuyNowStackParamList, 'Payment'>>();
  const navigation = useNavigation();
  const event = useShopifyEvent(route.params.id);
  const {selectedPaymentIndex, setSelectedPaymentIndex} = useCart();

  const paymentOptions = [
    {
      label: 'Personal Visa',
      card: {
        last4: '4242',
        brand: 'Visa',
      },
      billing: {
        useDeliveryAddress: true,
      },
    },
    {
      label: 'Business MasterCard',
      card: {
        last4: '5555',
        brand: 'Mastercard',
      },
      billing: {
        useDeliveryAddress: true,
      },
    },
    {
      label: 'Corporate Amex',
      card: {
        last4: '0005',
        brand: 'American Express',
      },
      billing: {
        useDeliveryAddress: false,
        address: {
          firstName: 'Corporate',
          lastName: 'Billing',
          address1: '123 Business Blvd',
          address2: 'Suite 500',
          city: 'New York',
          provinceCode: 'NY',
          countryCode: 'US',
          zip: '10001',
          phone: '+1-212-555-0100',
          company: 'Acme Corporation',
        },
      },
    },
  ];

  const handlePaymentSelection = () => {
    const selectedPayment = paymentOptions[selectedPaymentIndex];
    event.respondWith({
      card: selectedPayment!.card,
      billing: selectedPayment!.billing,
    });
    navigation.goBack();
  };

  const getCardIcon = (brand: string) => {
    // In a real app, you'd use actual card brand icons
    const brandIcons: {[key: string]: string} = {
      'Visa': '💳',
      'Mastercard': '💳',
      'American Express': '💳',
    };
    return brandIcons[brand] || '💳';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      <Text style={styles.subtitle}>Event ID: {event.id}</Text>

      <View style={styles.paymentList}>
        {paymentOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paymentOption,
              selectedPaymentIndex === index && styles.selectedPayment,
            ]}
            onPress={() => setSelectedPaymentIndex(index)}>
            <View style={styles.radioButton}>
              {selectedPaymentIndex === index && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <View style={styles.paymentInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{getCardIcon(option.card.brand)}</Text>
                <Text style={styles.paymentLabel}>{option.label}</Text>
              </View>
              <Text style={styles.cardDetails}>
                {option.card.brand} •••• {option.card.last4}
              </Text>
              <Text style={styles.billingInfo}>
                {option.billing.useDeliveryAddress
                  ? 'Uses delivery address'
                  : `Separate billing: ${option.billing.address?.city}, ${option.billing.address?.provinceCode}`}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Use Selected Card" onPress={handlePaymentSelection} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  paymentList: {
    width: '100%',
    marginBottom: 30,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPayment: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196f3',
  },
  paymentInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  billingInfo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 10,
    width: '100%',
  },
});