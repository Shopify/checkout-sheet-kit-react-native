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
import React, {useState} from 'react';
import {Alert, Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useShopifyEvent} from '@shopify/checkout-sheet-kit';
import type {CheckoutAddressChangeStartResponsePayload} from '@shopify/checkout-sheet-kit';
import {useCart} from '../../context/Cart';
import type {BuyNowStackParamList} from './types';

export default function AddressScreen() {
  const route = useRoute<RouteProp<BuyNowStackParamList, 'Address'>>();
  const navigation = useNavigation();
  const event = useShopifyEvent(route.params.id);
  const {selectedAddressIndex, setSelectedAddressIndex} = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addressOptions = [
    {
      label: 'San Francisco Office',
      address: {
        firstName: 'Test',
        lastName: 'User',
        address1: '33 New Montgomery St',
        address2: 'Suite 750',
        city: 'San Francisco',
        provinceCode: 'CA',
        countryCode: 'US',
        zip: '94105',
        phone: '+1-415-555-0124',
      },
    },
    {
      label: 'Main Street Apartment',
      address: {
        firstName: 'Test',
        lastName: 'User',
        address1: '123 Main Street',
        address2: 'Apt 2B',
        city: 'Los Angeles',
        provinceCode: 'CA',
        countryCode: 'US',
        zip: '90210',
        phone: '+1-323-555-0199',
      },
    },
    {
      label: 'Fifth Avenue (Invalid)',
      address: {
        firstName: 'Test',
        lastName: 'User',
        address1: '350 Fifth Avenue',
        address2: 'Floor 34',
        city: 'New York',
        provinceCode: 'NY',
        countryCode: 'US',
        zip: 'M5V 1M7',
        phone: '+1-212-736-3100',
      },
    },
  ];

  const handleAddressSelection = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const selectedAddress = addressOptions[selectedAddressIndex];

      const response: CheckoutAddressChangeStartResponsePayload = {
        cart: {
          delivery: {
            addresses: [
              {
                address: selectedAddress!.address,
                selected: true,
              },
            ],
          },
        },
      };

      await event.respondWith(response);

      await new Promise(resolve => setTimeout(resolve, 500));

      navigation.goBack();
    } catch (error) {
      // Handle validation errors, decoding errors, etc.
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update address';

      Alert.alert(
        'Address Update Failed',
        errorMessage,
        [{text: 'OK', onPress: () => setIsSubmitting(false)}],
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Shipping Address</Text>
      <Text style={styles.subtitle}>Event ID: {event.id}</Text>

      <View style={styles.addressList}>
        {addressOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.addressOption,
              selectedAddressIndex === index && styles.selectedAddress,
            ]}
            onPress={() => setSelectedAddressIndex(index)}>
            <View style={styles.radioButton}>
              {selectedAddressIndex === index && (
                <View style={styles.radioButtonSelected} />
              )}
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>{option.label}</Text>
              <Text style={styles.addressDetails}>
                {option.address.city}, {option.address.provinceCode}{' '}
                {option.address.zip}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isSubmitting ? 'Updating...' : 'Use Selected Address'}
          onPress={handleAddressSelection}
          disabled={isSubmitting}
        />
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
  addressList: {
    width: '100%',
    marginBottom: 30,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAddress: {
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
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    gap: 10,
    width: '100%',
  },
});
