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

import React, {useCallback, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

import {useShopifyCheckoutSheet} from '@shopify/checkout-sheet-kit';
import useShopify from '../hooks/useShopify';

import type {CartLineItem, CartItem} from '../../@types';
import type {Colors} from '../context/Theme';
import {useTheme} from '../context/Theme';
import {useCart} from '../context/Cart';
import {currency} from '../utils';

function CartScreen(): React.JSX.Element {
  const ShopifyCheckout = useShopifyCheckoutSheet();
  const [refreshing, setRefreshing] = React.useState(false);
  const {cartId, checkoutURL, totalQuantity, removeFromCart, addingToCart} =
    useCart();
  const {queries} = useShopify();

  const [fetchCart, {data, loading, error}] = queries.cart;

  const {colors} = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    if (cartId) {
      fetchCart({
        variables: {
          cartId,
        },
      });
    }
  }, [fetchCart, cartId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCart({
      variables: {
        cartId,
      },
    }).then(() => setRefreshing(false));
  }, [cartId, fetchCart]);

  const presentCheckout = async () => {
    if (checkoutURL) {
      ShopifyCheckout.present(checkoutURL);
    }
  };

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>
          An error occurred while fetching the cart
        </Text>
        <Text style={styles.loadingText}>
          {error?.name} {error?.message}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  if (!data || !data.cart || data.cart.lines.edges.length === 0 || !cartId) {
    return (
      <View style={styles.loading}>
        <Icon name="shopping-bag" size={60} color="#bbc1d6" />
        <Text style={styles.loadingText}>Your cart is empty.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.productList}>
          {data?.cart.lines.edges.map(({node}) => (
            <CartItem
              key={node.merchandise.id}
              item={node}
              quantity={node.quantity}
              loading={addingToCart.has(node.id)}
              onRemove={() => removeFromCart(node.id)}
            />
          ))}
        </View>

        <View style={styles.costContainer}>
          <View style={styles.costBlock}>
            <Text style={styles.costBlockText}>Subtotal</Text>
            <Text style={styles.costBlockText}>
              {price(data.cart.cost.subtotalAmount)}
            </Text>
          </View>

          <View style={styles.costBlock}>
            <Text style={styles.costBlockText}>Taxes</Text>
            <Text style={styles.costBlockText}>
              {price(data.cart.cost.totalTaxAmount)}
            </Text>
          </View>

          <View style={styles.costBlock}>
            <Text style={styles.costBlockTextStrong}>Total</Text>
            <Text style={styles.costBlockTextStrong}>
              {price(data.cart.cost.totalAmount)}
            </Text>
          </View>
        </View>

        {totalQuantity > 0 && (
          <Pressable
            style={styles.cartButton}
            disabled={totalQuantity === 0}
            onPress={presentCheckout}>
            <Text style={styles.cartButtonText}>Checkout</Text>
            <Text style={styles.cartButtonTextSubtitle}>
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} -{' '}
              {price(data.cart.cost.totalAmount)}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function price(value: {amount: string; currencyCode: string}) {
  if (!value) {
    return '-';
  }

  const {amount, currencyCode} = value;
  return currency(amount, currencyCode);
}

function CartItem({
  item,
  quantity,
  onRemove,
  loading,
}: {
  item: CartLineItem;
  quantity: number;
  loading?: boolean;
  onRemove: () => void;
}) {
  const {colors} = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      key={item.id}
      style={{
        ...styles.productItem,
        ...(loading ? styles.productItemLoading : {}),
      }}>
      {item.merchandise.image?.url && (
        <Image
          resizeMethod="resize"
          resizeMode="cover"
          style={styles.productImage}
          alt={item.merchandise.image?.altText}
          source={{uri: item.merchandise.image?.url}}
        />
      )}
      <View style={styles.productText}>
        <View style={styles.productTextContainer}>
          <Text style={styles.productTitle}>
            {item.merchandise.product.title}
          </Text>
          <Text style={styles.productDescription}>Quantity: {quantity}</Text>
        </View>
        <View>
          <Text style={styles.productPrice}>
            {price(item.cost?.totalAmount)}
          </Text>
          <Pressable style={styles.removeButton} onPress={onRemove}>
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.removeButtonText}>Remove</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginVertical: 20,
      color: colors.text,
    },
    scrollView: {
      paddingBottom: 10,
    },
    cartButton: {
      position: 'absolute',
      width: 'auto',
      bottom: 10,
      height: 55,
      left: 0,
      right: 0,
      borderRadius: 10,
      marginHorizontal: 20,
      padding: 10,
      backgroundColor: colors.secondary,
      fontWeight: 'bold',
    },
    cartButtonText: {
      fontSize: 16,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.secondaryText,
      fontWeight: 'bold',
    },
    cartButtonTextSubtitle: {
      fontSize: 12,
      textAlign: 'center',
      color: colors.textSubdued,
      fontWeight: 'bold',
    },
    productList: {
      marginVertical: 20,
      paddingHorizontal: 16,
    },
    productItem: {
      display: 'flex',
      flexDirection: 'row',
      marginBottom: 10,
      padding: 10,
      backgroundColor: colors.backgroundSubdued,
      borderRadius: 5,
    },
    productItemLoading: {
      opacity: 0.6,
    },
    productTextContainer: {
      flex: 1,
    },
    productText: {
      paddingLeft: 10,
      display: 'flex',
      flex: 1,
      color: colors.textSubdued,
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
    },
    productTitle: {
      fontSize: 16,
      marginBottom: 5,
      fontWeight: 'bold',
      lineHeight: 20,
      color: colors.text,
    },
    productDescription: {
      fontSize: 14,
      color: colors.textSubdued,
    },
    productPrice: {
      fontSize: 15,
      alignSelf: 'flex-start',
      paddingTop: 10,
      paddingHorizontal: 10,
      paddingBottom: 2,
      fontWeight: 'bold',
      color: colors.text,
    },
    removeButton: {
      alignSelf: 'flex-end',
      marginRight: 10,
      marginTop: 2,
    },
    removeButtonText: {
      color: colors.textSubdued,
    },
    productImage: {
      width: 40,
      height: 60,
      borderRadius: 6,
    },
    costContainer: {
      marginBottom: 10,
      marginHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 65,
      paddingHorizontal: 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    costBlock: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
      paddingVertical: 5,
    },
    costBlockText: {
      fontSize: 14,
      color: colors.textSubdued,
    },
    costBlockTextStrong: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
    },
  });
}

export default CartScreen;
