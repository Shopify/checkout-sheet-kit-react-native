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

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import type {ShopifyProduct} from '../../@types';
import type {Colors} from '../context/Theme';
import {useTheme} from '../context/Theme';
import {useCart} from '../context/Cart';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../App';
import {
  AcceleratedCheckoutButtons,
  AcceleratedCheckoutWallet,
  ApplePayLabel,
  useShopifyCheckoutSheet,
} from '@shopify/checkout-sheet-kit';
import {useShopifyEventHandlers} from '../hooks/useCheckoutEventHandlers';
import {BuyNowButton, CartDataSource} from '../components/BuyNowButton';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

function ProductDetailsScreen({route}: Props) {
  const {colors, cornerRadius} = useTheme();
  const {addToCart, addingToCart} = useCart();
  const styles = createStyles(colors, cornerRadius);

  if (!route?.params) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollView}>
        <ProductDetails
          product={route?.params.product}
          onAddToCart={addToCart}
          loading={
            route?.params.variant
              ? addingToCart.has(route?.params.variant.id)
              : false
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function getVariant(node: ShopifyProduct) {
  return node.variants.edges[0]?.node;
}

function ProductDetails({
  product,
  onAddToCart,
  loading = false,
}: {
  product: ShopifyProduct;
  loading?: boolean;
  onAddToCart: (variantId: string) => void;
}) {
  const {colors, cornerRadius} = useTheme();
  const styles = createStyles(colors, cornerRadius);
  const image = product.images?.edges[0]?.node;
  const variant = getVariant(product);
  const {acceleratedCheckoutsAvailable} = useShopifyCheckoutSheet();

  const eventHandlers = useShopifyEventHandlers(
    'PDP - AcceleratedCheckoutButtons',
  );

  return (
    <View key={product.id} style={styles.productItem}>
      {image?.url && (
        <Image
          resizeMethod="resize"
          resizeMode="cover"
          style={styles.productImage}
          alt={image?.altText}
          source={{
            uri: image.url,
          }}
        />
      )}
      <View style={styles.productText}>
        <View>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productDescription}>
            {product.description.slice(0, 100)} ...
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {acceleratedCheckoutsAvailable && variant?.id && (
            <AcceleratedCheckoutButtons
              {...eventHandlers}
              applePayLabel={ApplePayLabel.order}
              wallets={[AcceleratedCheckoutWallet.applePay]}
              variantId={variant.id}
              quantity={1}
              cornerRadius={cornerRadius}
            />
          )}

          <Pressable
            disabled={loading}
            style={styles.addToCartButton}
            onPress={() => variant?.id && onAddToCart(variant.id)}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.addToCartButtonText}>Add to cart</Text>
            )}
          </Pressable>

          {variant?.id && (
            <BuyNowButton
              variantId={variant.id}
              cartDataSource={CartDataSource.Permalink}
              disabled={loading}
            />
          )}
        </View>
      </View>
    </View>
  );
}

export default ProductDetailsScreen;

function createStyles(colors: Colors, cornerRadius: number) {
  return StyleSheet.create({
    container: {
      maxHeight: '100%',
    },
    scrollView: {
      paddingBottom: 55,
    },
    productItem: {
      flex: 1,
      flexDirection: 'column',
      marginBottom: 10,
      padding: 20,
      backgroundColor: colors.backgroundSubdued,
      borderRadius: 5,
    },
    productText: {
      paddingTop: 10,
      flexShrink: 1,
      flexGrow: 1,
      color: colors.textSubdued,
      justifyContent: 'space-between',
    },
    productTitle: {
      fontSize: 20,
      marginTop: 10,
      marginBottom: 5,
      marginHorizontal: 5,
      fontWeight: 'bold',
      lineHeight: 28,
      textAlign: 'left',
      color: colors.text,
    },
    productDescription: {
      fontSize: 16,
      marginTop: 5,
      marginBottom: 10,
      marginHorizontal: 5,
      lineHeight: 20,
      textAlign: 'left',
      color: colors.text,
    },
    productPrice: {
      fontSize: 14,
      flex: 1,
      color: colors.textSubdued,
    },
    productImage: {
      width: '100%',
      height: 400,
      marginTop: 5,
      borderRadius: cornerRadius,
    },
    buttonContainer: {
      marginTop: 20,
      gap: 8,
    },
    addToCartButton: {
      borderRadius: cornerRadius,
      backgroundColor: colors.secondary,
      paddingHorizontal: 10,
      paddingVertical: 14,
      height: 48,
    },
    addToCartButtonText: {
      fontSize: 20,
      lineHeight: 20,
      color: colors.secondaryText,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });
}
