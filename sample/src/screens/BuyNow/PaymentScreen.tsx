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
import {
  useShopifyEvent,
  type CardBrand,
  type CartPaymentInstrument,
  type CheckoutPaymentMethodChangeStartResponsePayload,
} from '@shopify/checkout-sheet-kit';
import {useCart} from '../../context/Cart';
import type {BuyNowStackParamList} from './types';

export default function PaymentScreen() {
  const route = useRoute<RouteProp<BuyNowStackParamList, 'Payment'>>();
  const navigation = useNavigation();
  const event = useShopifyEvent(route.params.id);
  const {selectedPaymentIndex, setSelectedPaymentIndex} = useCart();

  const paymentOptions: Array<{
    label: string;
    instrument: CartPaymentInstrument;
  }> = [
    {
      label: 'Personal Visa',
      instrument: {
        externalReferenceId: 'card-personal-visa-4242',
        cardHolderName: 'John Doe',
        lastDigits: '4242',
        brand: 'VISA',
        month: 12,
        year: 2028,
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'San Francisco',
          provinceCode: 'CA',
          countryCode: 'US',
          zip: '94102',
        },
      },
    },
    {
      label: 'Business MasterCard',
      instrument: {
        externalReferenceId: 'card-business-mc-5555',
        cardHolderName: 'Jane Smith',
        lastDigits: '5555',
        brand: 'MASTERCARD',
        month: 6,
        year: 2027,
        billingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address1: '456 Market St',
          city: 'San Francisco',
          provinceCode: 'CA',
          countryCode: 'US',
          zip: '94103',
        },
      },
    },
    {
      label: 'Corporate Amex',
      instrument: {
        externalReferenceId: 'card-corporate-amex-0005',
        cardHolderName: 'Corporate Account',
        lastDigits: '0005',
        brand: 'AMERICAN_EXPRESS',
        month: 3,
        year: 2026,
        billingAddress: {
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

  const handlePaymentSelection = async () => {
    const selectedPayment = paymentOptions[selectedPaymentIndex];
    if (!selectedPayment) return;

    const response: CheckoutPaymentMethodChangeStartResponsePayload = {
      cart: {
        ...route.params.cart,
        payment: {
          methods: [
            {
              type: 'creditCard',
              instruments: [selectedPayment.instrument],
            },
          ],
        },
      },
    };

    await event.respondWith(response);
    navigation.goBack();
  };

  const getCardIcon = (_brand: CardBrand | undefined) => {
    return '💳';
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
                <Text style={styles.cardIcon}>
                  {getCardIcon(option.instrument.brand)}
                </Text>
                <Text style={styles.paymentLabel}>{option.label}</Text>
              </View>
              <Text style={styles.cardDetails}>
                {option.instrument.brand} •••• {option.instrument.lastDigits}
              </Text>
              <Text style={styles.billingInfo}>
                {option.instrument.billingAddress?.city},{' '}
                {option.instrument.billingAddress?.provinceCode}
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
