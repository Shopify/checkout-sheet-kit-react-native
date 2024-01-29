# Shopify Checkout Sheet Kit - React Native

[![GitHub license](https://img.shields.io/badge/license-MIT-lightgrey.svg?style=flat)](https://github.com/Shopify/checkout-sheet-kit-react-native/blob/main/LICENSE)

![image](https://github.com/Shopify/checkout-sheet-kit-react-native/assets/2034704/73246cc6-bd39-4130-a7df-69b06907b897)

**Shopify Checkout Sheet Kit** is a Native Module that enables React Native apps to provide the world’s highest converting, customizable, one-page checkout within the app. The presented experience is a fully-featured checkout that preserves all of the store customizations: Checkout UI extensions, Functions, branding, and more. It also provides platform idiomatic defaults such as support for light and dark mode, and convenient developer APIs to embed, customize, and follow the lifecycle of the checkout experience.

Check out our blog to
[learn how and why we built the Shopify Checkout Sheet Kit](https://www.shopify.com/partners/blog/mobile-checkout-sdks-for-ios-and-android).

The React Native SDK is part of
[Shopify's Mobile Kit](https://shopify.dev/docs/custom-storefronts/mobile-kit)
which enables developers to delivery best-in-class iOS and Android commerce
experiences.

## Platform Requirements

- **React Native** - Minimum version `0.70`
- **iOS** - Minimum version iOS 13
- **Android** - Minimum Java 11 & Android SDK version `23`
- **Shopify** - This package is _**not**_ compatible with checkout.liquid. Your
  Shopify Store must be migrated for extensibility.

### Getting Started

Shopify Checkout Sheet Kit is an open-source NPM package. 

Use the following steps to get started with adding it to your React Native application:

#### 1. Install

Install the Shopify Checkout Sheet Kit package dependency:

```sh
yarn add @shopify/checkout-sheet-kit

# or using npm
npm install @shopify/checkout-sheet-kit
```

#### 2. Ensure your app meets the minimum Android SDK version requirement

Check the `minSdkVersion` property in your `android/build.gradle` file is at
least `23`.

```diff
// android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
-       minSdkVersion = 21
+       minSdkVersion = 23
        compileSdkVersion = 33
        targetSdkVersion = 33
    }
  // ...
}
```

#### 3. Ensure your app meets the minimum iOS version requirement

Check the `platform :ios` property of your `ios/Podfile` to ensure that the
minimum version number is at least `13`.

```diff
# ios/Podfile
- platform :ios, min_ios_version_supported
+ platform :ios, 13
```

### Basic Usage

Once the SDK has been added as a package dependency and the minimum platform
requirements have been checked, you can begin by importing the library in your
application code:

```tsx
import {ShopifyCheckoutSheetProvider} from '@shopify/checkout-sheet-kit';

function AppWithContext() {
  return (
    <ShopifyCheckoutSheetProvider>
      <App />
    </ShopifyCheckoutSheetProvider>
  );
}
```

Doing so will now allow you to access the Native Module anywhere in your
application using React hooks:

```tsx
import {useShopifyCheckoutSheet} from '@shopify/checkout-sheet-kit';

function App() {
  const shopifyCheckout = useShopifyCheckoutSheet();

  // Present the checkout
  shopifyCheckout.present(checkoutUrl);
}
```

See [Usage with the Storefront API](#usage-with-the-storefront-api) below on how
to get a checkoutUrl to pass to the SDK.

> Note: The recommended usage of the library is through a
> `ShopifyCheckoutSheetProvider` Context provider, but see
> [Programmatic usage](#programamatic-usage) below for details on how to use the
> library without React context.

### Programmatic Usage

To use the library without React context, import the `ShopifyCheckoutSheet`
class from the package and instantiate it. We recommend to instantiating the
class at a relatively high level in your application, and exporting it for use throughout
your app.

```tsx
// shopify.ts
import {ShopifyCheckoutSheet} from '@shopify/checkout-sheet-kit';

export const shopifyCheckout = new ShopifyCheckoutSheet({
  // optional configuration
});
```

Similar to the context approach, you can consume the instance as you would using
hooks.

```tsx
import {shopifyCheckout} from './shopify.ts';

shopifyCheckout.present(checkoutUrl);
```

### Usage with the Storefront API

To present a checkout to the buyer, your application must first obtain a
checkout URL. The most common way is to use the
[Storefront GraphQL API](https://shopify.dev/docs/api/storefront), to create a
cart, add line items, and retrieve a
[checkoutUrl](https://shopify.dev/docs/api/storefront/2023-10/objects/Cart#field-cart-checkouturl)
value.

You can use any GraphQL client to accomplish this - but as an example, our
[sample app](./sample) uses Apollo.

Here's an example of how to get started with Apollo:

```tsx
import {ApolloClient, gql, ApolloProvider} from '@apollo/client';
import {STOREFRONT_NAME, STOREFRONT_ACCESS_TOKEN} from '@env';

// Create a new instance of the ApolloClient
const client = new ApolloClient({
  uri: `https://${STOREFRONT_NAME}.myshopify.com/api/2024-01/graphql.json`,
  headers: {
    'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
  },
});

// Create Cart Mutation
const createCartMutation = gql`
  mutation CreateCart {
    cartCreate {
      cart {
        id
        checkoutUrl
      }
    }
  }
`;

// Add to Cart Mutation
const addToCartMutation = gql`
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
      }
    }
  }
`;

function YourReactNativeApp() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}
```

The `checkoutUrl` object is a standard web checkout URL that can be opened in
any browser. To present a native checkout sheet in your application, provide the
`checkoutUrl` alongside optional runtime configuration settings to the
`present(checkoutUrl)` function provided by the SDK:

```tsx
function App() {
  const [createCart] = useMutation(createCartMutation)
  const [addToCart] = useMutation(addToCartMutation)

  return (
    // React native app code
  )
}
```

The `checkoutUrl` value is a standard web checkout URL that can be opened in any
browser. To present a native checkout sheet in your application, provide the
`checkoutUrl` to the `present(checkoutUrl)` function provided by the SDK:

```tsx
function App() {
  const shopifyCheckout = useShopifyCheckoutSheet()
  const checkoutUrl = useRef<string>(null)
  const [createCart] = useMutation(createCartMutation)
  const [addToCart] = useMutation(addToCartMutation)

  const handleAddToCart = useCallback((merchandiseId) => {
    // Create a cart
    const {data: cartCreateResponse} = await createCart()
    // Add an item to the cart
    const {data: addToCartResponse} = await addToCart({
      variables: {
        cartId: cartCreateResponse.cartCreate.cart.id,
        lines: [{quantity: 1, merchandiseId}]
      }
    })
    // Retrieve checkoutUrl from the Storefront response
    checkoutUrl.current = addToCartResponse.cartLinesAdd.cart.checkoutUrl

    // Preload the checkout in the background for faster presentation
    shopifyCheckout.preload(checkoutUrl.current)
  }, []);

  const handleCheckout = useCallback(() => {
    if (checkoutURL.current) {
      // Present the checkout to the buyer
      shopifyCheckout.present(checkoutURL.current)
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

To help optimize and deliver the best experience the SDK also provides a
[preloading API](#preloading) that can be used to initialize the checkout
session in the background and ahead of time.

### Configuration

The SDK provides a way to customize the presented checkout experience through a
`configuration` object in the Context Provider or a `setConfig` method on an
instance of the `ShopifyCheckoutSheet` class.

| Name          | Required | Default     | Description                                                                                                                                                    |
| ------------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colorScheme` |          | `automatic` | Sets the color scheme for the checkout.                                                                                                                        |
| `preloading`  |          | `true`      | Enable/disable [preloading](#preloading).                                                                                                                      |
| `colors`      |          | `{}`        | An object with `ios` and `android` properties to override the colors for iOS and Android platforms individually. See [`colors`](#colors) for more information. |

Here's an example of how a fully customized configuration object might look:

```tsx
import {
  ColorScheme,
  Configuration,
  ShopifyCheckoutSheetProvider,
} from '@shopify/checkout-sheet-kit';

const config: Configuration = {
  colorScheme: ColorScheme.web,
  preloading: true,
  colors: {
    ios: {
      backgroundColor: '#f0f0e8',
      spinnerColor: '#2d2a38',
    },
    android: {
      backgroundColor: '#f0f0e8',
      spinnerColor: '#2d2a38',
      headerBackgroundColor: '#f0f0e8',
      headerTextColor: '#2d2a38',
    },
  },
};

// If using React Context
function AppWithContext() {
  return (
    <ShopifyCheckoutSheetProvider configuration={config}>
      <App />
    </ShopifyCheckoutSheetProvider>
  );
}

// If using ShopifyCheckoutSheet directly
const shopifyCheckout = new ShopifyCheckoutSheet(config);
```

#### `colorScheme`

The SDK defaults to the `automatic` color scheme option, will switches between
idiomatic `light` and `dark` themes depending on the users preference. This
behavior can be customized via the `colorScheme` property:

| Name        | Default | Description                                                                                      |
| ----------- | ------- | ------------------------------------------------------------------------------------------------ |
| `automatic` | ✔       | Alternates between an idiomatic light and dark theme - depending on the users device preference. |
| `light`     |         | Force the idomatic light theme.                                                                  |
| `dark`      |         | Force the idomatic dark theme.                                                                  |
| `web`       |         | Force your storefront web theme, as rendered by a mobile browser.                                |

#### `colors`

The `colors` configuration property can be used to provide overrides for iOS and
Android applications separately.

```tsx
const config: Configuration = {
  colorScheme: ColorScheme.light,
  colors: {
    ios: {
      backgroundColor: '#ffffff',
      spinnerColor: '#000000',
    },
    android: {
      backgroundColor: '#ffffff',
      spinnerColor: '#2d2a38',
      headerBackgroundColor: '#ffffff',
      headerTextColor: '#000000',
    },
  },
};
```

Note that when using the `automatic` option, the `colors.android` interface is
slightly different, as you can specify different overrides for `light` and
`dark` modes:

```tsx
import {
  ColorScheme,
  Configuration,
  ShopifyCheckoutSheetProvider,
} from '@shopify/checkout-sheet-kit';

const config: Configuration = {
  colorScheme: ColorScheme.automatic,
  colors: {
    // Custom light/dark overrides for Android
    android: {
      light: {
        backgroundColor: '#ffffff',
        spinnerColor: '#2d2a38',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
      },
      dark: {
        backgroundColor: '#000000',
        spinnerColor: '#0087ff',
        headerBackgroundColor: '#000000',
        headerTextColor: '#ffffff',
      },
    },
  },
};

function AppWithContext() {
  return (
    <ShopifyCheckoutSheetProvider configuration={config}>
      <App />
    </ShopifyCheckoutSheetProvider>
  );
}
```

### Preloading

Initializing a checkout session requires communicating with Shopify servers,
thus depending on the network quality and bandwidth available to the buyer can
result in undesirable waiting time for the buyer. To help optimize and deliver
the best experience, the SDK provides a `preloading` "hint" that allows
developers to signal that the checkout session should be initialized in the
background, ahead of time.

Preloading is an advanced feature that can be disabled by setting the
`preloading` configuration value to `false`. It is enabled by default.

Once enabled, preloading a checkout is as simple as calling
`preload(checkoutUrl)` with a valid `checkoutUrl`.

```tsx
// using hooks
const shopifyCheckout = useShopifyCheckoutSheet();
ShopifyCheckout.preload(checkoutUrl);

// using a class instance
const shopifyCheckout = new ShopifyCheckoutSheet();
shopifyCheckout.preload(checkoutUrl);
```

**Important considerations:**

1. Initiating preload results in background network requests and additional
   CPU/memory utilization for the client, and should be used when there is a
   high likelihood that the buyer will soon request to checkout—e.g. when the
   buyer navigates to the cart overview or a similar app-specific experience.
2. A preloaded checkout session reflects the cart contents at the time when
   `preload` is called. If the cart is updated after `preload` is called, the
   application needs to call `preload` again to reflect the updated checkout
   session.
3. Calling `preload(checkoutUrl)` is a hint, **not a guarantee**: the library
   may debounce or ignore calls to this API depending on various conditions; the
   preload may not complete before `present(checkoutUrl)` is called, in which
   case the buyer may still see a spinner while the checkout session is
   finalized.

### Monitoring the lifecycle of a checkout session

There are currently 3 checkout events exposed through the Native Module. You can
subscribe to these events using `addEventListener` and `removeEventListeners`
methods - available on both the context provider as well as the class instance.

| Name        | Callback                             | Description                                              |
| ----------- | ------------------------------------ | -------------------------------------------------------- |
| `close`     | `() => void`                         | Fired when the checkout has been closed.                 |
| `completed` | `() => void`                         | Fired when the checkout has been successfully completed. |
| `error`     | `(error: {message: string}) => void` | Fired when a checkout exception has been raised.         |

#### `addEventListener(eventName, callback)`

Subscribing to an event returns an `EmitterSubscription` object, which contains
a `remove()` function to unsubscribe. Here's an example of how you might create
an event listener in a React `useEffect`, ensuring to remove it on unmount.

```tsx
// Using hooks
const shopifyCheckout = useShopifyCheckoutSheet();

useEffect(() => {
  const close = shopifyCheckout.addEventListener('close', () => {
    // Do something on checkout close
  });

  const completed = shopifyCheckout.addEventListener('completed', () => {
    // Do something on checkout completion
  });

  const error = shopifyCheckout.addEventListener('error', error => {
    // Do something on checkout error
    // console.log(error.message)
  });

  return () => {
    // It is important to clear the subscription on unmount to prevent memory leaks
    close?.remove();
    completed?.remove();
    error?.remove();
  };
}, [shopifyCheckout]);
```

#### `removeEventListeners(eventName)`

On the rare occasion that you want to remove all event listeners for a given
`eventName`, you can use the `removeEventListeners(eventName)` method.

#### Integrating with Web Pixels, monitoring behavioral data

App developers can use
[lifecycle events](#monitoring-the-lifecycle-of-a-checkout-session) to monitor
and log the status of a checkout session. Web Pixel events are currently not
executed within rendered checkout. Support for customer events and behavioral
analytics is under development and will be available prior to the general
availability of SDK.

### Integrating identity & customer accounts

Buyer-aware checkout experience reduces friction and increases conversion.
Depending on the context of the buyer (guest or signed-in), knowledge of buyer
preferences, or account/identity system, the application can use one of the
following methods to initialize a personalized and contextualized buyer
experience.

#### Cart: buyer bag, identity, and preferences

In addition to specifying the line items, the Cart can include buyer identity
(name, email, address, etc.), and delivery and payment preferences: see
[guide](<[url](https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api/cart/manage)>).
Included information will be used to present pre-filled and pre-selected choices
to the buyer within checkout.

#### Multipass

[Shopify Plus](https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/shopify-plus-plan)
merchants using
[Classic Customer Accounts](https://help.shopify.com/en/manual/customers/customer-accounts/classic-customer-accounts)
can use [Multipass](https://shopify.dev/docs/api/multipass)
([API documentation](https://shopify.dev/docs/api/multipass)) to integrate an
external identity system and initialize a buyer-aware checkout session.

```json
{
  "email": "<Customer's email address>",
  "created_at": "<Current timestamp in ISO8601 encoding>",
  "remote_ip": "<Client IP address>",
  "return_to": "<Checkout URL obtained from Storefront API>",
  ...
}
```

1. Follow the [Multipass documentation](https://shopify.dev/docs/api/multipass)
   to create a Multipass URL and set `return_to` to be the obtained
   `checkoutUrl`
2. Provide the Multipass URL to `present(checkoutUrl)`

_Note: the above JSON omits useful customer attributes that should be provided
where possible and encryption and signing should be done server-side to ensure
Multipass keys are kept secret._

#### Shop Pay

To initialize accelerated Shop Pay checkout, the cart can set a
[walletPreference](https://shopify.dev/docs/api/storefront/latest/mutations/cartBuyerIdentityUpdate#field-cartbuyeridentityinput-walletpreferences)
to 'shop_pay'. The sign-in state of the buyer is app-local. The buyer will be
prompted to sign in to their Shop account on their first checkout, and their
sign-in state will be remembered for future checkout sessions.

#### Customer Account API

We are working on a library to provide buyer sign-in and authentication powered
by the
[new Customer Account API](https://www.shopify.com/partners/blog/introducing-customer-account-api-for-headless-stores)—stay
tuned.

---

### Contributing

We welcome code contributions, feature requests, and reporting of issues. Please
see [guidelines and instructions](.github/CONTRIBUTING.md). See
[Contributing](./CONTRIBUTING.md) for development contribution guidance.

### License

Shopify's Checkout Sheet Kit is provided under an [MIT License](LICENSE).
