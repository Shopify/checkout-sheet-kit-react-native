import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from 'react';
import ShopifyCheckout from '../../../package/ShopifyCheckout';
import useShopify from '../hooks/useShopify';

interface Context {
  checkoutURL: string | undefined;
  totalQuantity: number;
  addingToCart: Set<string>;
  addToCart: (variantId: string) => Promise<void>;
}

const CartContext = createContext<Context>({
  checkoutURL: undefined,
  totalQuantity: 0,
  addingToCart: new Set(),
  addToCart: async () => {},
});

type AddingToCartAction =
  | {type: 'add'; variantId: string}
  | {type: 'remove'; variantId: string};

export const CartProvider: React.FC<PropsWithChildren> = ({children}) => {
  // Reuse the same cart ID for the lifetime of the app
  const [checkoutURL, setCheckoutURL] =
    useState<Context['checkoutURL']>(undefined);
  // Reuse the same cart ID for the lifetime of the app
  const [cartId, setCartId] = useState<string | undefined>(undefined);
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

  const {mutations} = useShopify();
  const [createCart] = mutations.cartCreate;
  const [addLineItems] = mutations.cartLinesAdd;

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
        ShopifyCheckout.preload(checkoutURL);
      }
    },
    [
      cartId,
      createCart,
      addLineItems,
      setCartId,
      setTotalQuantity,
      checkoutURL,
    ],
  );

  const value = useMemo(
    () => ({
      checkoutURL,
      addToCart,
      totalQuantity,
      addingToCart,
    }),
    [checkoutURL, addToCart, totalQuantity, addingToCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => React.useContext(CartContext);
