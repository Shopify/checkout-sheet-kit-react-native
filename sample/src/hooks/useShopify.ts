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

import {gql, useLazyQuery, useMutation} from '@apollo/client';
import type {Edges, ShopifyProduct, ShopifyCart} from '../../@types';

const moneyFragment = gql`
  fragment Price on MoneyV2 {
    currencyCode
    amount
  }
`;

const productFragment = gql`
  fragment Product on ProductVariant {
    id
    price {
      ...Price
    }
    product {
      title
    }
    image {
      id
      width
      height
      url
    }
  }

  ${moneyFragment}
`;

const cartCostFragment = gql`
  fragment Cost on CartCost {
    subtotalAmount {
      ...Price
    }
    totalAmount {
      ...Price
    }
    totalTaxAmount {
      ...Price
    }
  }
`;

const PRODUCTS_QUERY = gql`
  query FetchProducts {
    products(first: 10) {
      edges {
        node {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  ...Price
                }
              }
            }
          }
          images(first: 1) {
            edges {
              node {
                id
                width
                height
                url
              }
            }
          }
        }
      }
    }
  }

  ${moneyFragment}
`;

const CART_QUERY = gql`
  query FetchCart($cartId: ID!) {
    cart(id: $cartId) {
      id
      totalQuantity
      cost {
        ...Cost
      }
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ...Product
            }
            cost {
              totalAmount {
                ...Price
              }
            }
          }
        }
      }
    }
  }

  ${productFragment}
  ${moneyFragment}
  ${cartCostFragment}
`;

const CREATE_CART_MUTATION = gql`
  mutation CreateCart {
    cartCreate(input: {}) {
      cart {
        id
        checkoutUrl
      }
    }
  }
`;

const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
    }
  }
`;

const REMOVE_FROM_CART_MUTATION = gql`
  mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
    }
  }
`;

function useShopify() {
  const products = useLazyQuery<{products: Edges<ShopifyProduct>}>(
    PRODUCTS_QUERY,
  );
  const cart = useLazyQuery<{cart: ShopifyCart}>(CART_QUERY, {
    fetchPolicy: 'network-only',
  });
  const cartCreate = useMutation(CREATE_CART_MUTATION);
  const cartLinesAdd = useMutation(ADD_TO_CART_MUTATION);
  const cartLinesRemove = useMutation(REMOVE_FROM_CART_MUTATION);

  return {
    queries: {
      cart,
      products,
    },
    mutations: {
      cartCreate,
      cartLinesAdd,
      cartLinesRemove,
    },
  };
}

export default useShopify;
