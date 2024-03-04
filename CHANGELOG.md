# Changelog

## 1.0.4 - March 4, 2024

- Fixes an issue where the parent view controller is dismissed after the
  checkout sheet is dismissed.

## 1.0.3 - February 21, 2024

- Fixes an issue where the checkout can remain in a frozen empty state after
  being dismissed.

## 1.0.2 - February 21, 2024

- Improve "close" event logic by only dismissing the Checkout sheet.

## 1.0.1 - February 20, 2024

- Adds support for view controllers other than the `rootViewController`. This
  allows triggering the Checkout Sheet from modals and formSheets etc.

## 1.0.0 - January 31, 2024

ShopifyCheckoutSheetKit is now generally available for
[Swift](https://github.com/Shopify/checkout-sheet-kit-swift),
[Android](https://github.com/Shopify/checkout-sheet-kit-android) and
[React Native](https://github.com/Shopify/checkout-sheet-kit-react-native) -
providing the world's highest converting, customizable, one-page checkout.

## 0.2.0 - January 30, 2024

Exposes a new `pixel` event type, which enables you to consume
[Standard](https://shopify.dev/docs/api/web-pixels-api/standard-events) and
[Custom](https://shopify.dev/docs/api/web-pixels-api/emitting-data#publishing-custom-events)
Web Pixels from Checkout and relay them to your third-party analytics providers.

## 0.1.1 - January 15, 2024

Updates the README on the NPM regsitry entry page.

## 0.1.0 - January 15, 2024

Initial publication of the `@shopify/checkout-sheet-kit` package.

Please refer to the [Readme](./README.md) for setup intstructions and usage.
