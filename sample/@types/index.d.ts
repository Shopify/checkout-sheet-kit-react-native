export type Edges<T> = {
  edges: {node: T}[];
};

interface Price {
  amount: string;
  currencyCode: string;
}

interface CartCost {
  subtotalAmount: Price;
  totalAmount: Price;
  totalTaxAmount: Price;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  images: Edges<{
    id: string;
    altText: string;
    url: string;
  }>;
  variants: Edges<{
    id: string;
    price: Price;
  }>;
}

export interface CartItem {
  id: string;
  price: Price;
  product: {
    title: string;
  };
  image: {
    id: string;
    width: number;
    height: number;
    url: string;
    altText: string;
  };
}

export interface ShopifyCart {
  cost: CartCost;
  lines: Edges<{
    id: string;
    merchandise: CartItem;
    quantity: number;
  }>;
  totalQuantity: number;
}
