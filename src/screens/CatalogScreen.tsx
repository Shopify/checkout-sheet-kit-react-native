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

import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
  StyleSheet,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  DimensionValue,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import ShopifyCheckout from '../../ShopifyCheckout';
import useShopify from '../hooks/useShopify';

import type {ShopifyProduct} from '../../@types';

function App(): JSX.Element {
  const [cartId, setCartId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<number>(0);
  const [addingToCart, setAddingToCart] = useState(new Set());
  const checkoutUrl = useRef<string | null>(null);

  const {queries, mutations} = useShopify();
  const {loading, data} = queries.products;
  const [createCart] = mutations.cartCreate;
  const [addLineItems] = mutations.cartLinesAdd;

  const presentCheckout = async () => {
    if (checkoutUrl.current) {
      ShopifyCheckout.present(checkoutUrl.current);
    }
  };

  const handleAddToCart = useCallback(
    async (variantId: string) => {
      let id = cartId;
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.add(variantId);
        return next;
      });

      if (!id) {
        const cart = await createCart();
        id = cart.data.cartCreate.cart.id;
        setCartId(cartId);
      }

      const {data} = await addLineItems({
        variables: {
          cartId: id,
          lines: [{quantity: 1, merchandiseId: variantId}],
        },
      });

      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });

      checkoutUrl.current = data.cartLinesAdd.cart.checkoutUrl;

      if (checkoutUrl.current) {
        ShopifyCheckout.preload(checkoutUrl.current);
      }
      setLineItems(data.cartLinesAdd.cart.lines.edges.length);
    },
    [cartId, createCart, addLineItems, setCartId, setLineItems],
  );

  const scrollViewStyles = useMemo(
    () => ({
      ...styles.scrollView,
      maxHeight: (lineItems > 0 ? '88%' : '100%') as DimensionValue,
    }),
    [lineItems],
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading catalog...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={scrollViewStyles}>
        <View style={styles.productList}>
          {data?.products.edges.map(({node}) => (
            <Product
              key={node.id}
              product={node}
              loading={addingToCart.has(getVariant(node).id)}
              onAddToCart={handleAddToCart}
            />
          ))}
        </View>
      </ScrollView>
      {lineItems > 0 && (
        <Pressable
          style={styles.cartButton}
          disabled={!lineItems}
          onPress={presentCheckout}>
          <Text style={styles.cartButtonText}>Checkout</Text>
          <Text style={styles.cartButtonTextSubtitle}>
            {lineItems} {lineItems === 1 ? 'item' : 'items'}
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function getVariant(node: ShopifyProduct) {
  return node.variants.edges[0].node;
}

function Product({
  product,
  onAddToCart,
  loading = false,
}: {
  product: ShopifyProduct;
  loading?: boolean;
  onAddToCart: (variantId: string) => void;
}) {
  const image = product.images?.edges[0].node;
  const variant = getVariant(product);

  return (
    <View key={product.id} style={styles.productItem}>
      <Image
        resizeMethod="resize"
        resizeMode="cover"
        style={styles.productImage}
        alt={image?.altText}
        source={{uri: image?.url}}
      />
      <View style={styles.productText}>
        <View>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productPrice}>
            £{Number(variant?.price.amount).toFixed(2)}{' '}
            {variant?.price.currencyCode}
          </Text>
        </View>
        <View style={styles.addToCartButtonContainer}>
          {loading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Pressable
              style={styles.addToCartButton}
              onPress={() => onAddToCart(variant.id)}>
              <Text style={styles.addToCartButtonText}>Add to cart</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default App;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginVertical: 20,
  },
  scrollView: {},
  cartButton: {
    borderRadius: 10,
    margin: 20,
    padding: 10,
    backgroundColor: Colors.black,
    fontWeight: 'bold',
  },
  cartButtonText: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    color: Colors.white,
    fontWeight: 'bold',
  },
  cartButtonTextSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#aaa',
    fontWeight: 'bold',
  },
  productList: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  productItem: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  productText: {
    paddingLeft: 20,
    paddingTop: 10,
    flexShrink: 1,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 14,
    flex: 1,
    color: '#888',
  },
  productImage: {
    width: 80,
    height: 120,
    marginRight: 5,
    borderRadius: 6,
  },
  addToCartButtonContainer: {
    alignItems: 'flex-end',
    flexShrink: 1,
    flexGrow: 0,
  },
  addToCartButton: {
    borderRadius: 10,
    fontSize: 8,
    padding: 5,
  },
  addToCartButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0087ff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
