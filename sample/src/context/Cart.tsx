import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {useShopifyCheckoutKit} from 'react-native-shopify-checkout-kit';
import useShopify from '../hooks/useShopify';

interface Context {
  cartId: string | undefined;
  checkoutURL: string | undefined;
  totalQuantity: number;
  addingToCart: Set<string>;
  addToCart: (variantId: string) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
}

const defaultCartId = undefined;

const CartContext = createContext<Context>({
  cartId: defaultCartId,
  checkoutURL: undefined,
  totalQuantity: 0,
  addingToCart: new Set(),
  addToCart: async () => {},
  removeFromCart: async () => {},
});

type AddingToCartAction =
  | {type: 'add'; variantId: string}
  | {type: 'remove'; variantId: string};

export const CartProvider: React.FC<PropsWithChildren> = ({children}) => {
  const ShopifyCheckoutKit = useShopifyCheckoutKit();
  // Reuse the same cart ID for the lifetime of the app
  const [checkoutURL, setCheckoutURL] =
    useState<Context['checkoutURL']>(undefined);
  // Reuse the same cart ID for the lifetime of the app
  const [cartId, setCartId] = useState<string | undefined>(defaultCartId);
  // Keep track of the number of items in the cart
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
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

  const {mutations, queries} = useShopify();
  const [createCart] = mutations.cartCreate;
  const [addLineItems] = mutations.cartLinesAdd;
  const [removeLineItems] = mutations.cartLinesRemove;
  const [fetchCart] = queries.cart;

  useEffect(() => {
    const subscription = ShopifyCheckoutKit.addEventListener(
      'completed',
      () => {
        // Clear the cart ID and checkout URL when the checkout is completed
        setCartId(defaultCartId);
        setCheckoutURL(undefined);
      },
    );

    return subscription?.remove;
  }, [ShopifyCheckoutKit]);

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
  }, [cartId, fetchCart]);

  const addToCart = useCallback(
    async (variantId: string) => {
      let id = cartId;

      dispatch({type: 'add', variantId});

      if (!id) {
        const cart = await createCart();
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

      if (checkoutURL) {
        ShopifyCheckoutKit.preload(checkoutURL);
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
      createCart,
      fetchCart,
      addLineItems,
      setCartId,
      setTotalQuantity,
      checkoutURL,
      ShopifyCheckoutKit,
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

      dispatch({type: 'remove', variantId});

      setCheckoutURL(data.cartLinesRemove.cart.checkoutUrl);
      setTotalQuantity(data.cartLinesRemove.cart.totalQuantity);

      if (checkoutURL) {
        ShopifyCheckoutKit.preload(checkoutURL);
      }

      if (cartId) {
        fetchCart({
          variables: {
            cartId,
          },
        });
      }
    },
    [
      cartId,
      removeLineItems,
      fetchCart,
      setTotalQuantity,
      checkoutURL,
      ShopifyCheckoutKit,
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
    }),
    [
      cartId,
      checkoutURL,
      addToCart,
      removeFromCart,
      totalQuantity,
      addingToCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => React.useContext(CartContext);
