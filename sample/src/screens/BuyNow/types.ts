import type {Cart} from '@shopify/checkout-sheet-kit';

export type BuyNowStackParamList = {
  Checkout: {url: string; auth?: string; cart?: Cart};
  Address: {id: string; cart: Cart};
  Payment: {id: string; cart: Cart};
};
