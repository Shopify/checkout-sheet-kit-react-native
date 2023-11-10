export type Edges<T> = {
  edges: {node: T}[];
};

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
    price: {
      amount: string;
      currencyCode: string;
    };
  }>;
}
