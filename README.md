# Checkout Kit - React Native

TODO


## Install

```sh
yarn add react-native-shopify-checkout-kit

# or using npm
npm install react-native-shopify-checkout-kit
```

## Usage

```tsx
import {ShopifyCheckoutKit} from "react-native-shopify-checkout-kit"

function App() {
  const checkoutURL = useRef<string>(null)

  const handleAddToCart = useCallback((variantId) => {
    // Add item to cart using the Storefront API
    // Retrieve checkoutUrl from the Storefront response
    checkoutURL.current = response.data.cartLinesAdd.cart.checkoutUrl
  }, []);

  const handleCheckout = useCallback(() => {
    if (checkoutURL.current) {
      ShopifyCheckoutKit.present(checkoutURL.current)
    }
  }, [])

  return (
    <Catalog>
      <Product onAddToCart={handleAddToCart} />
      <Button onPress={handleCheckout}>
        <Text>Checkout</Text>
      </Button>
    <Catalog>
  )
}
```


See [Contributing](./CONTRIBUTING.md) for contribution guidance.
