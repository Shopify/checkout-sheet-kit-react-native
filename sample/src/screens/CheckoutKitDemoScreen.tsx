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

import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  useShopifyCheckoutSheet,
  ShopifyCheckout,
} from '@shopify/checkout-sheet-kit';
import type {ShopifyCheckoutRef} from '@shopify/checkout-sheet-kit';
import {useCart} from '../context/Cart';

const CheckoutKitDemoScreen: React.FC = () => {
  const shopify = useShopifyCheckoutSheet();
  const {checkoutURL} = useCart();
  const [showInlineCheckout, setShowInlineCheckout] = useState(false);

  // Refs for the new component API
  const popupCheckoutRef = useRef<ShopifyCheckoutRef>(null);

  // Mock auth token - OPTIONAL for demo purposes
  // const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoibW9jay1hcGkta2V5IiwidmFyaWFudCI6Im1vY2stdmFyaWFudCIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk4ODAwfQ.mock-signature';

  // Demo checkout URL for testing when cart is empty
  const demoCheckoutURL =
    'https://shopify.github.io/checkout-sheet-kit-react-native/demo-checkout';

  // Use real checkout URL if available, otherwise use demo URL
  const effectiveCheckoutURL = checkoutURL || demoCheckoutURL;
  const isUsingDemoURL = !checkoutURL;

  const handleOldAPIPresent = () => {
    if (effectiveCheckoutURL) {
      if (isUsingDemoURL) {
        Alert.alert(
          'Demo Mode',
          'Using demo checkout URL. Add items to cart for real checkout.',
          [
            {
              text: 'Continue',
              onPress: () => shopify.present(effectiveCheckoutURL),
            },
          ],
        );
      } else {
        shopify.present(effectiveCheckoutURL);
      }
    }
  };

  const handleNewAPIPopup = () => {
    if (effectiveCheckoutURL) {
      if (isUsingDemoURL) {
        Alert.alert(
          'Demo Mode',
          'Using demo checkout URL. Add items to cart for real checkout.',
          [{text: 'Continue', onPress: () => popupCheckoutRef.current?.open()}],
        );
      } else {
        popupCheckoutRef.current?.open();
      }
    }
  };

  const handleNewAPIInline = () => {
    if (effectiveCheckoutURL) {
      if (isUsingDemoURL && !showInlineCheckout) {
        Alert.alert(
          'Demo Mode',
          'Using demo checkout URL without authentication. This demonstrates the inline WebView integration working with optional authentication.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Show Demo',
              onPress: () => setShowInlineCheckout(!showInlineCheckout),
            },
          ],
        );
      } else {
        setShowInlineCheckout(!showInlineCheckout);
      }
    }
  };

  const handlePreload = () => {
    if (effectiveCheckoutURL) {
      shopify.preload(effectiveCheckoutURL);
      // Also preload via new API
      popupCheckoutRef.current?.preload();
      Alert.alert(
        'Preloaded',
        `Checkout has been preloaded for better performance${isUsingDemoURL ? ' (demo URL)' : ''}`,
      );
    }
  };

  const handleCheckoutCompleted = (event: any) => {
    console.log('Checkout completed:', event);
    Alert.alert(
      'Order Complete! 🎉',
      `Order ID: ${event.orderDetails?.id || 'unknown'}${isUsingDemoURL ? ' (Demo)' : ''}`,
    );
    setShowInlineCheckout(false);
  };

  const handleCheckoutError = (error: any) => {
    console.log('Checkout error:', error);

    if (isUsingDemoURL) {
      Alert.alert(
        'Demo Checkout',
        'Demo checkout loaded successfully! In a real app, this would be a real Shopify checkout URL.',
      );
    } else {
      Alert.alert('Checkout Error', error.message || 'Unknown error occurred');
    }
  };

  const handleCheckoutClose = () => {
    console.log('Checkout closed');
    setShowInlineCheckout(false);
  };

  const handleResize = (height: number) => {
    console.log('Checkout resized to height:', height);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden popup checkout using new API */}
      <ShopifyCheckout
        url={checkoutURL}
        ref={popupCheckoutRef}
        mode="popup"
        onCompleted={handleCheckoutCompleted}
        onError={handleCheckoutError}
        onClose={handleCheckoutClose}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checkout Kit API Comparison</Text>
          <Text style={styles.sectionSubtitle}>
            Compare the old hook-based API with the new component-based API
          </Text>
        </View>

        {/* Old API Section */}
        <View style={styles.apiSection}>
          <Text style={styles.apiTitle}>📱 Legacy Hook API</Text>
          <Text style={styles.codeLabel}>Usage:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`const shopify = useShopifyCheckoutSheet();
shopify.present(checkoutUrl);`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOldAPIPresent}>
            <Text style={styles.buttonText}>Present Checkout (Legacy)</Text>
          </TouchableOpacity>
        </View>

        {/* New API Popup Section */}
        <View style={styles.apiSection}>
          <Text style={styles.apiTitle}>🆕 New Component API - Popup</Text>
          <Text style={styles.codeLabel}>Usage:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`const checkout = useRef();

<ShopifyCheckout
  url={url}
  ref={checkout}
/>

checkout.current?.open();`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNewAPIPopup}>
            <Text style={styles.buttonText}>Present Checkout (New API)</Text>
          </TouchableOpacity>
        </View>

        {/* New API Inline Section */}
        <View style={styles.apiSection}>
          <Text style={styles.apiTitle}>🔗 New Component API - Inline</Text>
          <Text style={styles.codeLabel}>Usage:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`<ShopifyCheckout
  url={url}
  auth="{{authToken}}"
  mode="inline"
  autoResizeHeight
/>`}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              showInlineCheckout && styles.activeButton,
            ]}
            onPress={handleNewAPIInline}>
            <Text style={styles.buttonText}>
              {showInlineCheckout ? 'Hide' : 'Show'} Inline Checkout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Performance Section */}
        <View style={styles.apiSection}>
          <Text style={styles.apiTitle}>⚡ Performance Features</Text>
          <Text style={styles.description}>
            Preload checkout for faster presentation
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePreload}>
            <Text style={styles.buttonText}>Preload Checkout</Text>
          </TouchableOpacity>
        </View>

        {/* Inline Checkout Display */}
        {showInlineCheckout && effectiveCheckoutURL && (
          <View style={styles.inlineSection}>
            <Text style={styles.apiTitle}>💳 Inline Checkout</Text>
            {isUsingDemoURL && (
              <Text style={styles.demoNotice}>
                🧪 Demo Mode: Using mock URL and authentication
              </Text>
            )}
            <ShopifyCheckout
              url={effectiveCheckoutURL}
              mode="inline"
              autoResizeHeight={true}
              style={styles.inlineCheckout}
              onCompleted={handleCheckoutCompleted}
              onError={handleCheckoutError}
              onClose={handleCheckoutClose}
              onResize={handleResize}
            />
          </View>
        )}

        {/* Features Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.apiTitle}>📊 Feature Comparison</Text>
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonRow}>
              <Text style={styles.featureLabel}>Feature</Text>
              <Text style={styles.legacyLabel}>Legacy</Text>
              <Text style={styles.newLabel}>New API</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.featureText}>Popup/Sheet Mode</Text>
              <Text style={styles.checkmark}>✅</Text>
              <Text style={styles.checkmark}>✅</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.featureText}>Inline Mode</Text>
              <Text style={styles.cross}>❌</Text>
              <Text style={styles.checkmark}>✅</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.featureText}>Ref-based Control</Text>
              <Text style={styles.cross}>❌</Text>
              <Text style={styles.checkmark}>✅</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.featureText}>Auto-resize</Text>
              <Text style={styles.cross}>❌</Text>
              <Text style={styles.checkmark}>✅</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.featureText}>Authentication</Text>
              <Text style={styles.cross}>❌</Text>
              <Text style={styles.checkmark}>✅</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  apiSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  apiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inlineSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inlineCheckout: {
    minHeight: 400,
    marginTop: 12,
    borderRadius: 8,
  },
  demoNotice: {
    fontSize: 14,
    color: '#FF9500',
    backgroundColor: '#FFF5E6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  comparisonSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  comparisonTable: {
    marginTop: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureLabel: {
    flex: 2,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  legacyLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  newLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  featureText: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  checkmark: {
    flex: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  cross: {
    flex: 1,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CheckoutKitDemoScreen;
