# Shopify Checkout Kit - React Native

[![GitHub license](https://img.shields.io/badge/license-MIT-lightgrey.svg?style=flat)](https://github.com/Shopify/checkout-sheet-kit-react-native/blob/main/LICENSE)
[![GitHub Release](https://img.shields.io/github/release/shopify/checkout-sheet-kit-react-native.svg?style=flat)]()

<img width="3200" height="800" alt="gradients" src="https://github.com/user-attachments/assets/156492b7-5a64-43d2-b574-2e8f29ed8780" />

**Shopify Checkout Kit** is a Native Module that enables React Native apps
to provide the world’s highest converting, customizable, one-page checkout
within the app. The presented experience is a fully-featured checkout that
preserves all of the store customizations: Checkout UI extensions, Functions,
branding, and more. It also provides platform idiomatic defaults such as support
for light and dark mode, and convenient developer APIs to embed, customize, and
follow the lifecycle of the checkout experience.

Note: We're in the process of renaming "Checkout Sheet Kit" to "Checkout Kit." The dev docs and README already use the new name, while the package itself will be updated in an upcoming version.

Check out our blog to
[learn how and why we built the Shopify Checkout Kit](https://www.shopify.com/partners/blog/mobile-checkout-sdks-for-ios-and-android).

The React Native SDK is part of
[Shopify's Mobile Kit](https://shopify.dev/docs/custom-storefronts/mobile-kit)
which enables developers to delivery best-in-class iOS and Android commerce
experiences.

- [Platform Requirements](#platform-requirements)
- [Getting Started](#getting-started)
  - [1. Installation](#1-installation)
  - [2. Minimum Android requirements](#2-minimum-android-requirements)
  - [3. Minimum iOS requirements](#3-minimum-ios-requirements)
- [Basic Usage](#basic-usage)
- [Programmatic Usage](#programmatic-usage)
- [Usage with the Shopify Storefront API](#usage-with-the-shopify-storefront-api)
- [Configuration](#configuration)
  - [Colors](#colors)
  - [Localization](#localization)
    - [Checkout Sheet title](#checkout-sheet-title)
      - [iOS - Localization](#ios---localization)
      - [Android - Localization](#android---localization)
    - [Currency](#currency)
    - [Language](#language)
- [Preloading](#preloading)
  - [Important considerations](#important-considerations)
  - [Flash Sales](#flash-sales)
  - [When to preload](#when-to-preload)
  - [Cache invalidation](#cache-invalidation)
- [Checkout lifecycle](#checkout-lifecycle)
  - [`addEventListener(eventName, callback)`](#addeventlistenereventname-callback)
  - [`removeEventListeners(eventName)`](#removeeventlistenerseventname)
- [Identity \& customer accounts](#identity--customer-accounts)
  - [Cart: buyer bag, identity, and preferences](#cart-buyer-bag-identity-and-preferences)
    - [Multipass](#multipass)
    - [Shop Pay](#shop-pay)
    - [Customer Account API](#customer-account-api)
- [Offsite Payments](#offsite-payments)
  - [Universal Links - iOS](#universal-links---ios)
- [Pickup points / Pickup in store](#pickup-points--pickup-in-store)
  - [Geolocation - iOS](#geolocation---ios)
  - [Geolocation - Android](#geolocation---android)
    - [Opting out of the default behavior](#opting-out-of-the-default-behavior)
- [Contributing](#contributing)
- [License](#license)

## Platform Requirements

- **React Native** - Minimum version `0.70`
- **iOS** - Minimum version iOS 13
- **Android** - Minimum Java 11 & Android SDK version `23`

## Getting Started

Shopify Checkout Kit is an open-source NPM package.

Use the following steps to get started with adding it to your React Native
application:

### 1. Installation

Install the Shopify Checkout Kit package dependency:

```sh
yarn add @shopify/checkout-sheet-kit

# or using npm
npm install @shopify/checkout-sheet-kit
```

### 2. Minimum Android requirements

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

### 3. Minimum iOS requirements

Check the `platform :ios` property of your `ios/Podfile` to ensure that the
minimum version number is at least `13`.

```diff
# ios/Podfile
- platform :ios, min_ios_version_supported
+ platform :ios, 13
```

## Basic Usage

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

See [usage with the Storefront API](#usage-with-the-storefront-api) below for details on how
to obtain a checkout URL to pass to the kit.

> [!NOTE]
> The recommended usage of the library is through a
> `ShopifyCheckoutSheetProvider` Context provider, but see
> [Programmatic usage](#programamatic-usage) below for details on how to use the
> library without React context.

## Programmatic Usage

To use the library without React context, import the `ShopifyCheckoutSheet`
class from the package and instantiate it. We recommend to instantiating the
class at a relatively high level in your application, and exporting it for use
throughout your app.

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

## Usage with the Shopify Storefront API

To present a checkout to the buyer, your application must first obtain a
checkout URL. The most common way is to use the
[Storefront GraphQL API](https://shopify.dev/docs/api/storefront), to create a
cart, add line items, and retrieve a
[checkoutUrl](https://shopify.dev/docs/api/storefront/2023-10/objects/Cart#field-cart-checkouturl)
value. Alternatively, a [cart permalink](https://help.shopify.com/en/manual/products/details/cart-permalink) can be provided.

You can use any GraphQL client to accomplish this - but as an example, our
[sample app](./sample) uses Apollo.

Here's an example of how to get started with Apollo:

```tsx
import {ApolloClient, gql, ApolloProvider} from '@apollo/client';
import {STOREFRONT_NAME, STOREFRONT_ACCESS_TOKEN} from '@env';

// Create a new instance of the ApolloClient
const client = new ApolloClient({
  uri: `https://${STOREFRONT_NAME}.myshopify.com/api/2025-07/graphql.json`,
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

> [!TIP]
> To help optimize and deliver the best experience the SDK also provides
> a [preloading API](#preloading) that can be used to initialize the checkout
> session in the background and ahead of time.

## Configuration

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
      tintColor: '#2d2a38',
    },
    android: {
      backgroundColor: '#f0f0e8',
      progressIndicator: '#2d2a38',
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

### Colors

The SDK defaults to the `automatic` color scheme option, will switches between
idiomatic `light` and `dark` themes depending on the users preference. This
behavior can be customized via the `colorScheme` property:

| Name        | Default | Description                                                                                      |
| ----------- | ------- | ------------------------------------------------------------------------------------------------ |
| `automatic` | ✔      | Alternates between an idiomatic light and dark theme - depending on the users device preference. |
| `light`     |         | Force the idomatic light theme.                                                                  |
| `dark`      |         | Force the idomatic dark theme.                                                                   |
| `web`       |         | Force your storefront web theme, as rendered by a mobile browser.                                |

The `colors` configuration property can be used to provide overrides for iOS and
Android applications separately.

```tsx
const config: Configuration = {
  colorScheme: ColorScheme.light,
  colors: {
    ios: {
      backgroundColor: '#ffffff',
      tintColor: '#000000',
      closeButtonColor: '#333333',
    },
    android: {
      backgroundColor: '#ffffff',
      progressIndicator: '#2d2a38',
      headerBackgroundColor: '#ffffff',
      headerTextColor: '#000000',
      closeButtonColor: '#333333',
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
        progressIndicator: '#2d2a38',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
        closeButtonColor: '#000000',
      },
      dark: {
        backgroundColor: '#000000',
        progressIndicator: '#0087ff',
        headerBackgroundColor: '#000000',
        headerTextColor: '#ffffff',
        closeButtonColor: '#ffffff',
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

### Localization

#### Checkout Sheet title

##### iOS - Localization

On iOS, you can set a localized value on the `title` attribute of the
configuration.

Alternatively, use a Localizable.xcstrings file in your app by doing the
following:

1. Create a `Localizable.xcstrings` file under "ios/{YourApplicationName}"
2. Add an entry for the key `"shopify_checkout_sheet_title"`

##### Android - Localization

On Android, you can add a string entry for the key `"checkout_web_view_title"`
to the "android/app/src/res/values/strings.xml" file for your application.

```diff
<resources>
    <string name="app_name">Your App Name</string>
+    <string name="checkout_web_view_title">Checkout</string>
</resources>
```

> [!IMPORTANT]
> The `title` configuration attribute will only affect iOS. For Android you **must** use
> `res/values/strings.xml`.

#### Currency

To set an appropriate currency for a given cart, the Storefront API offers an
`@inContext(country)` directive which will ensure the correct currency is
presented.

```tsx
const CREATE_CART_MUTATION = gql`
  mutation CreateCart($input: CartInput, $country: CountryCode = CA)
  @inContext(country: $country) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
    }
  }
`;
```

See [Storefront Directives](https://shopify.dev/docs/api/storefront#directives)
for more information.

#### Language

Similarly to currency, you can use an `@inContext(language)` directive to set
the language for your checkout.

```tsx
const CREATE_CART_MUTATION = gql`
  mutation CreateCart($input: CartInput, $language: Language = EN)
  @inContext(language: $language) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
    }
  }
`;
```

See [Storefront Directives](https://shopify.dev/docs/api/storefront#directives)
for more information.

## Preloading

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

### Important considerations

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

### Flash Sales

It is important to note that during Flash Sales or periods of high amounts of traffic, buyers may be entered into a queue system.

**Calls to preload which result in a buyer being enqueued will be rejected.** This means that a buyer will never enter the queue without their knowledge.

### When to preload

Calling `preload()` each time an item is added to a buyer's cart can put significant strain on Shopify systems, which in return can result in rejected requests. Rejected requests will not result in a visual error shown to users, but will degrade the experience since they will need to load checkout from scratch.

Instead, a better approach is to call `preload()` when you have a strong enough signal that the buyer intends to check out. In some cases this might mean a buyer has navigated to a "cart" screen.

### Cache invalidation

Should you wish to manually clear the preload cache, there is a `ShopifyCheckoutSheetKit.invalidate()` helper function to do so.

## Checkout lifecycle

The checkout events exposed through the Native Module can be
un/subscribed to using the `addEventListener` and `removeEventListeners`
methods - available on both the context provider as well as the class instance.

| Name        | Callback                                  | Description                                                  |
| ----------- | ----------------------------------------- | ------------------------------------------------------------ |
| `close`     | `() => void`                              | Fired when the checkout has been closed.                     |
| `complete` | `(event: CheckoutCompleteEvent) => void` | Fired when the checkout has been successfully completed.     |
| `start`   | `(event: CheckoutStartEvent) => void`   | Fired when the checkout has been started.                    |
| `error`     | `(error: {message: string}) => void`      | Fired when a checkout exception has been raised.             |

### `addEventListener(eventName, callback)`

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

  const completed = shopifyCheckout.addEventListener(
    'complete',
    (event: CheckoutCompleteEvent) => {
      // Lookup order on checkout completion
      const orderId = event.orderDetails.id;
    },
  );

  const error = shopifyCheckout.addEventListener(
    'error',
    (error: CheckoutError) => {
      // Do something on checkout error
      // console.log(error.message)
    },
  );

  return () => {
    // It is important to clear the subscription on unmount to prevent memory leaks
    close?.remove();
    completed?.remove();
    error?.remove();
  };
}, [shopifyCheckout]);
```

### `removeEventListeners(eventName)`

On the rare occasion that you want to remove all event listeners for a given
`eventName`, you can use the `removeEventListeners(eventName)` method.

## Identity & customer accounts

Buyer-aware checkout experience reduces friction and increases conversion.
Depending on the context of the buyer (guest or signed-in), knowledge of buyer
preferences, or account/identity system, the application can use one of the
following methods to initialize a personalized and contextualized buyer
experience.

### Cart: buyer bag, identity, and preferences

In addition to specifying the line items, the Cart can include buyer identity
(name, email, address, etc.), and delivery and payment preferences: see
[guide](https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api/cart/manage).
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
  "return_to": "<Checkout URL obtained from Storefront API>"
}
```

1. Follow the [Multipass documentation](https://shopify.dev/docs/api/multipass)
   to create a Multipass URL and set `return_to` to be the obtained
   `checkoutUrl`
2. Provide the Multipass URL to `present(checkoutUrl)`

> [!IMPORTANT]
> The above JSON omits useful customer attributes that should be
> provided where possible and encryption and signing should be done server-side
> to ensure Multipass keys are kept secret.

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

## Offsite Payments

Certain payment providers finalize transactions by redirecting customers to
external banking apps. To enhance the user experience for your buyers, you can
set up your storefront to support Universal Links on iOS and App links on
Android, allowing customers to be redirected back to your app once the payment
is completed.

### Universal Links - iOS

See the
[Universal Links guide](https://github.com/Shopify/checkout-sheet-kit-react-native/blob/main/documentation/universal_links_ios.md)
for information on how to get started with adding support for Offsite Payments
in your app.

It is crucial for your app to be configured to handle URL clicks during the
checkout process effectively. By default, the kit includes the following
delegate method to manage these interactions. This code ensures that external
links, such as HTTPS and deep-links, are opened correctly by iOS.

```swift
public func checkoutDidClickLink(url: URL) {
  if UIApplication.shared.canOpenURL(url) {
    UIApplication.shared.open(url)
  }
}
```

## Pickup points / Pickup in store

### Geolocation - iOS

Geolocation permission requests are handled out of the box by iOS, provided you've added the required location usage description to your `Info.plist` file:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Your location is required to locate pickup points near you.</string>
```

> [!TIP]
> Consider also adding `NSLocationAlwaysAndWhenInUseUsageDescription` if your app needs background location access for other features.

### Geolocation - Android

Android differs to iOS in that permission requests must be handled in two places:
(1) in your `AndroidManifest.xml` and (2) at runtime.

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

The Checkout Kit native module will emit a `geolocationRequest` event when the webview requests geolocation
information. By default, the kit will listen for this event and request access to both coarse and fine access when
invoked.

The geolocation request flow follows this sequence:

1. When checkout needs location data (e.g., to show nearby pickup points), it triggers a geolocation request.
2. The native module emits a `geolocationRequest` event.
3. If using default behavior, the module automatically handles the Android runtime permission request.
4. The result is passed back to checkout, which then proceeds to show relevant pickup points if permission was granted.

> [!NOTE]
> If the user denies location permissions, the checkout will still function but will not be able to show nearby pickup points. Users can manually enter their location instead.

#### Opting out of the default behavior

> [!NOTE]
> This section is only applicable for Android.

In order to opt-out of the default permission handling, you can set `features.handleGeolocationRequests` to `false`
when you instantiate the `ShopifyCheckoutSheet` class.

If you're using the sheet programmatically, you can do so by specifying a `features` object as the second argument:

```tsx
const checkoutSheetKit = new ShopifyCheckoutSheet(config, {handleGeolocationRequests: false});
```

If you're using the context provider, you can pass the same `features` object as a prop to the `ShopifyCheckoutSheetProvider` component:

```tsx
<ShopifyCheckoutSheetProvider configuration={config} features={{handleGeolocationRequests: false}}>
  {children}
</ShopifyCheckoutSheetProvider>
```

When opting out, you'll need to implement your own permission handling logic and communicate the result back to the checkout sheet. This can be useful if you want to:

- Customize the permission request UI/UX
- Coordinate location permissions with other app features
- Implement custom fallback behavior when permissions are denied

The steps here to implement your own logic are to:

1. Listen for the `geolocationRequest`
2. Request the desired permissions
3. Invoke the native callback by calling `initiateGeolocationRequest` with the permission status

```tsx
// Listen for "geolocationRequest" events
shopify.addEventListener('geolocationRequest', async (event: GeolocationRequestEvent) => {
  const coarse = 'android.permission.ACCESS_COARSE_LOCATION';
  const fine = 'android.permission.ACCESS_FINE_LOCATION';

  // Request one or many permissions at once
  const results = await PermissionsAndroid.requestMultiple([coarse, fine]);

  // Check the permission status results
  const permissionGranted = results[coarse] === 'granted' || results[fine] === 'granted';

  // Dispatch an event to the native module to invoke the native callback with the permission status
  shopify.initiateGeolocationRequest(permissionGranted);
})
```

---

## Contributing

See the [contributing documentation](CONTRIBUTING.md) for details on how to get started.

## License

Shopify's Checkout Kit is provided under an [MIT License](LICENSE).
