import type {PropsWithChildren} from 'react';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {atom, useAtom} from 'jotai';
import {useShopifyCheckoutSheet} from '@shopify/checkout-sheet-kit';
import useShopify from '../hooks/useShopify';
import {useConfig} from './Config';
import {createBuyerIdentityCartInput} from '../utils';

interface Context {
  cartId: string | undefined;
  checkoutURL: string | undefined;
  totalQuantity: number;
  addingToCart: Set<string>;
  clearCart: () => void;
  addToCart: (variantId: string) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
}

const defaultCartId = undefined;
const defaultCheckoutURL = undefined;
const defaultTotalQuantity = 0;

const CartContext = createContext<Context>({
  cartId: defaultCartId,
  checkoutURL: undefined,
  totalQuantity: 0,
  addingToCart: new Set(),
  addToCart: async () => {},
  removeFromCart: async () => {},
  clearCart: () => {},
});

type AddingToCartAction =
  | {type: 'add'; variantId: string}
  | {type: 'remove'; variantId: string};

const checkoutURLState = atom<Context['checkoutURL']>(defaultCheckoutURL);
const cartIdState = atom<Context['cartId']>(defaultCartId);
const totalQuantityState = atom<Context['totalQuantity']>(defaultTotalQuantity);

export const CartProvider: React.FC<PropsWithChildren> = ({children}) => {
  const shopify = useShopifyCheckoutSheet();
  // Reuse the same cart ID for the lifetime of the app
  const [checkoutURL, setCheckoutURL] = useAtom(checkoutURLState);
  // Reuse the same cart ID for the lifetime of the app
  const [cartId, setCartId] = useAtom(cartIdState);
  // Keep track of the number of items in the cart
  const [totalQuantity, setTotalQuantity] = useAtom(totalQuantityState);
  // Maintain a loading state for items being added to the cart
  const addingToCartReducer = (
    state: Set<string>,
    action: AddingToCartAction,
  ): Set<string> => {
    switch (action.type) {
      case 'add':
        return new Set([...state, action.variantId]);
      case 'remove':
        return new Set([...state].filter(id => id !== action.variantId));
      default:
        throw new Error();
    }
  };
  // Maintain a loading state for items being added to the cart
  const defaultSet: Set<string> = new Set();
  const [addingToCart, dispatch] = useReducer(addingToCartReducer, defaultSet);
  const {appConfig} = useConfig();

  const {mutations, queries} = useShopify();
  const [createCart] = mutations.cartCreate;
  const [addLineItems] = mutations.cartLinesAdd;
  const [removeLineItems] = mutations.cartLinesRemove;
  const [fetchCart] = queries.cart;

  const clearCart = useCallback(() => {
    setCartId(defaultCartId);
    setCheckoutURL(undefined);
    setTotalQuantity(0);
  }, [setCartId, setCheckoutURL, setTotalQuantity]);

  useEffect(() => {
    const subscription = shopify.addEventListener('completed', () => {
      // Clear the cart ID and checkout URL when the checkout is completed
      clearCart();
    });

    return subscription?.remove;
  }, [shopify, clearCart, setCartId, setCheckoutURL, setTotalQuantity]);

  useEffect(() => {
    async function getCart() {
      try {
        const {data} = await fetchCart({
          variables: {
            cartId,
          },
        });
        if (data?.cart.totalQuantity) {
          setTotalQuantity(data?.cart.totalQuantity);
        }
      } catch {}
    }

    if (cartId) {
      getCart();
    }
  }, [cartId, fetchCart, setTotalQuantity]);

  const addToCart = useCallback(
    async (variantId: string) => {
      let id = cartId;

      dispatch({type: 'add', variantId});

      if (!id) {
        const cartInput = createBuyerIdentityCartInput(appConfig);
        const cart = await createCart({variables: {input: cartInput}});
        id = cart.data.cartCreate.cart.id;

        if (id) {
          setCartId(id);
        }
      }

      const {data} = await addLineItems({
        variables: {
          cartId: id,
          lines: [{quantity: 1, merchandiseId: variantId}],
        },
      });

      dispatch({type: 'remove', variantId});

      setCheckoutURL(data.cartLinesAdd.cart.checkoutUrl);
      setTotalQuantity(data.cartLinesAdd.cart.totalQuantity);

      if (data.cartLinesAdd.cart.checkoutUrl) {
        shopify.preload(data.cartLinesAdd.cart.checkoutUrl);
      }

      if (id) {
        fetchCart({
          variables: {
            cartId: id,
          },
        });
      }
    },
    [
      cartId,
      addLineItems,
      setCheckoutURL,
      setTotalQuantity,
      appConfig,
      createCart,
      setCartId,
      shopify,
      fetchCart,
    ],
  );

  const removeFromCart = useCallback(
    async (variantId: string) => {
      if (!cartId) {
        return;
      }

      dispatch({type: 'add', variantId});

      const {data} = await removeLineItems({
        variables: {
          cartId,
          lineIds: [variantId],
        },
      });

      setCheckoutURL(data.cartLinesRemove.cart.checkoutUrl);
      setTotalQuantity(data.cartLinesRemove.cart.totalQuantity);

      if (checkoutURL) {
        shopify.preload(checkoutURL);
      }

      if (cartId) {
        await fetchCart({
          variables: {
            cartId,
          },
        });
      }

      dispatch({type: 'remove', variantId});
    },
    [
      cartId,
      removeLineItems,
      setCheckoutURL,
      setTotalQuantity,
      checkoutURL,
      shopify,
      fetchCart,
    ],
  );

  const value = useMemo(
    () => ({
      cartId,
      checkoutURL,
      addToCart,
      removeFromCart,
      totalQuantity,
      addingToCart,
      clearCart,
    }),
    [
      cartId,
      checkoutURL,
      addToCart,
      removeFromCart,
      totalQuantity,
      addingToCart,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => React.useContext(CartContext);
