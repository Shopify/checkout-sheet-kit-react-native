# Checkout Kit - React Native

[![GitHub license](https://img.shields.io/badge/license-MIT-lightgrey.svg?style=flat)](https://github.com/Shopify/checkout-kit-react-native/blob/main/LICENSE)

![image](https://github.com/Shopify/checkout-kit-swift/assets/318265/94669024-8407-4eb5-bd6d-4c6d47935ec0)


**Shopify Checkout Kit** is a Swift Package library, part of [Shopify's Native SDKs](https://shopify.dev/docs/custom-storefronts/mobile-kit), that enables Swift apps to provide the world’s highest converting, customizable, one-page checkout within the app. The presented experience is a fully-featured checkout that preserves all of the store customizations: Checkout UI extensions, Functions, branding, and more. It also provides platform idiomatic defaults such as support for light and dark mode, and convenient developer APIs to embed, customize, and follow the lifecycle of the checkout experience. Check out our blog to [learn how and why we built Checkout Kit](https://www.shopify.com/partners/blog/mobile-checkout-sdks-for-ios-and-android).

### Requirements

- React Native (Minimum SDK Version 23)
- iOS 13.0+
- The SDK is **not** compatible with checkout.liquid. Your Shopify Store must be migrated for extensibility.

### Getting Started

The SDK is an open-source NPM package. As a quick start, see [sample projects](samples/README.md) or use one of the following ways to integrate the SDK into your project:

## Install

```sh
yarn add react-native-shopify-checkout-kit

# or using npm
npm install react-native-shopify-checkout-kit
```


See [Contributing](./CONTRIBUTING.md) for contribution guidance.

### Basic Usage

Once the SDK has been added as a dependency, you can import the library:

```tsx
import {ShopifyCheckout} from 'react-native-shopify-checkout-kit'
```

To present a checkout to the buyer, your application must first obtain a checkout URL. The most common way is to use the [Storefront GraphQL API](https://shopify.dev/docs/api/storefront) to assemble a cart (via `cartCreate` and related update mutations) and retrive the [checkoutUrl](https://shopify.dev/docs/api/storefront/2023-10/objects/Cart#field-cart-checkouturl) value. You can use any GraphQL client to accomplish this - our [sample app](./sample) uses Apollo, for example:

```tsx
import {ApolloClient, gql, ApolloProvider} from '@apollo/client';

const client = new ApolloClient({
  uri: `https://your-storefront.myshopify.com/api/2023-10/graphql.json`,
  headers: {
    'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
  },
});

// Create a cart
const createCartMutation = gql`
  mutation CreateCart {
    cartCreate(input: {}) {
      cart {
        id
        checkoutUrl
      }
    }
  }
`

// Add to cart
const addToCartMutation = gql`
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
    }
  }
`

function App() {
  const [createCart] = useMutation(createCartMutation)
  const [addToCart] = useMutation(addToCartMutation)

  return (
    // React native code
  )
}

function YourReactNativeApp() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  )
}
```

The `checkoutURL` object is a standard web checkout URL that can be opened in any browser. To present a native checkout sheet in your application, provide the `checkoutURL` alongside optional runtime configuration settings to the `present(checkoutURL)` function provided by the SDK:

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

To help optimize and deliver the best experience the SDK also provides a [preloading API](#preloading) that can be used to initialize the checkout session in the background and ahead of time.

### Configuration

The SDK provides a way to customize the presented checkout experience via the `ShopifyCheckoutKit.configuration` object.

#### `colorScheme`

By default, the SDK will match the user's device color appearance. This behavior can be customized via the `colorScheme` property:

```tsx
import {ColorScheme} from 'react-native-shopify-checkout-kit'

// [Default] Automatically toggle idiomatic light and dark themes based on device preference (`UITraitCollection`)
ShopifyCheckoutKit.configure({
  colorScheme: ColorScheme.automatic
})

// Force idiomatic light color scheme
ShopifyCheckoutKit.configure({
  colorScheme: ColorScheme.light
})

// Force idiomatic dark color scheme
ShopifyCheckoutKit.configure({
  colorScheme: ColorScheme.dark
})

// Force web theme, as rendered by a mobile browser
ShopifyCheckoutKit.configure({
  colorScheme: ColorScheme.web
})
```

#### `spinnerColor`

TODO

_Note: use preloading to optimize and deliver an instant buyer experience._

#### `backgroundColor`

TODO

### Preloading

Initializing a checkout session requires communicating with Shopify servers and, depending on the network weather and the quality of the buyer's connection, can result in undesirable waiting time for the buyer. To help optimize and deliver the best experience, the SDK provides a preloading hint that allows app developers to signal and initialize the checkout session in the background and ahead of time.

Preloading is an advanced feature that can be disabled via a runtime flag:

```tsx
ShopifyCheckout.configure({
  preloading: false // defaults to true
})
```

Once enabled, preloading a checkout is as simple as:

```tsx
ShopifyCheckout.preload(checkoutURL)
```

**Important considerations:**

1. Initiating preload results in background network requests and additional CPU/memory utilization for the client, and should be used when there is a high likelihood that the buyer will soon request to checkout—e.g. when the buyer navigates to the cart overview or a similar app-specific experience.
2. A preloaded checkout session reflects the cart contents at the time when `preload` is called. If the cart is updated after `preload` is called, the application needs to call `preload` again to reflect the updated checkout session.
3. Calling `preload(checkout:)` is a hint, not a guarantee: the library may debounce or ignore calls to this API depending on various conditions; the preload may not complete before `present(checkout:)` is called, in which case the buyer may still see a spinner while the checkout session is finalized.

### Monitoring the lifecycle of a checkout session

TODO

#### Integrating with Web Pixels, monitoring behavioral data

App developers can use [lifecycle events](#monitoring-the-lifecycle-of-a-checkout-session) to monitor and log the status of a checkout session. Web Pixel events are currently not executed within rendered checkout. Support for customer events and behavioral analytics is under development and will be available prior to the general availability of SDK.

### Integrating identity & customer accounts

Buyer-aware checkout experience reduces friction and increases conversion. Depending on the context of the buyer (guest or signed-in), knowledge of buyer preferences, or account/identity system, the application can use one of the following methods to initialize a personalized and contextualized buyer experience.

#### Cart: buyer bag, identity, and preferences

In addition to specifying the line items, the Cart can include buyer identity (name, email, address, etc.), and delivery and payment preferences: see [guide](<[url](https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api/cart/manage)>). Included information will be used to present pre-filled and pre-selected choices to the buyer within checkout.

#### Multipass

[Shopify Plus](https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/shopify-plus-plan) merchants using [Classic Customer Accounts](https://help.shopify.com/en/manual/customers/customer-accounts/classic-customer-accounts) can use [Multipass](https://shopify.dev/docs/api/multipass) ([API documentation](https://shopify.dev/docs/api/multipass)) to integrate an external identity system and initialize a buyer-aware checkout session.

```json
{
  "email": "<Customer's email address>",
  "created_at": "<Current timestamp in ISO8601 encoding>",
  "remote_ip": "<Client IP address>",
  "return_to": "<Checkout URL obtained from Storefront API>",
  ...
}
```

1. Follow the [Multipass documentation](https://shopify.dev/docs/api/multipass) to create a Multipass URL and set `return_to` to be the obtained `checkoutUrl`
2. Provide the Multipass URL to `present(checkout:)`

_Note: the above JSON omits useful customer attributes that should be provided where possible and encryption and signing should be done server-side to ensure Multipass keys are kept secret._

#### Shop Pay

To initialize accelerated Shop Pay checkout, the cart can set a [walletPreference](https://shopify.dev/docs/api/storefront/latest/mutations/cartBuyerIdentityUpdate#field-cartbuyeridentityinput-walletpreferences) to 'shop_pay'. The sign-in state of the buyer is app-local. The buyer will be prompted to sign in to their Shop account on their first checkout, and their sign-in state will be remembered for future checkout sessions.

#### Customer Account API

We are working on a library to provide buyer sign-in and authentication powered by the [new Customer Account API](https://www.shopify.com/partners/blog/introducing-customer-account-api-for-headless-stores)—stay tuned.

---

### Contributing

We welcome code contributions, feature requests, and reporting of issues. Please see [guidelines and instructions](.github/CONTRIBUTING.md).

### License

Checkout Kit is provided under an [MIT License](LICENSE).
