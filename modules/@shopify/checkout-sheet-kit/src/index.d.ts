/*
MIT License

Copyright 2023 - Present, Shopify Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import type {EmitterSubscription} from 'react-native';
import type {CheckoutCompletedEvent, CheckoutStartedEvent} from './events';
import type {CheckoutException} from './errors';

export type Maybe<T> = T | undefined;

/**
 * Configuration options for checkout sheet kit features
 */
export interface Features {
  /**
   * When enabled, the checkout will handle geolocation permission requests internally.
   * If disabled, geolocation requests will emit a 'geolocationRequest' event that
   * must be handled by the application.
   */
  handleGeolocationRequests: boolean;
}

export enum ColorScheme {
  automatic = 'automatic',
  light = 'light',
  dark = 'dark',
  web = 'web_default',
}

export interface IosColors {
  /**
   * A HEX color value for customizing the color of the progress bar.
   */
  tintColor?: string;
  /**
   * A HEX color value for customizing the background color of the webview.
   */
  backgroundColor?: string;
  /**
   * A HEX color value for customizing the color of the close button.
   */
  closeButtonColor?: string;
}

export interface AndroidColors {
  /**
   * A HEX color value for customizing the color of the progress bar.
   */
  progressIndicator: string;
  /**
   * A HEX color value for customizing the background color of the webview.
   */
  backgroundColor: string;
  /**
   * A HEX color value for customizing the background color of the webview header.
   */
  headerBackgroundColor: string;
  /**
   * A HEX color value for customizing the text color of the webview header.
   */
  headerTextColor: string;
  /**
   * A HEX color value for customizing the color of the close button.
   */
  closeButtonColor?: string;
}

export interface AndroidAutomaticColors {
  /**
   * Color overrides when the theme preference is 'light'.
   */
  light: AndroidColors;
  /**
   * Color overrides when the theme preference is 'dark'.
   */
  dark: AndroidColors;
}

interface CommonConfiguration {
  /**
   * Enable/disable preloading for checkout. This option must be enabled for `.preload()` to work as expected.
   */
  preloading?: boolean;
  /**
   * Sets the title of the Checkout sheet.
   *
   * * Important: This will only modify the Checkout Sheet on iOS, not Android.
   *
   * To implement localization support for iOS:
   *  1. Create a "Localizable.xcstrings" file under "ios/{YourApplication}"
   *  2. Set a translated value for a "shopify_checkout_sheet_title" key
   *
   * To implement localization support for Android:
   *  1. Open the "android/app/src/main/res/values/strings.xml" file
   *  2. Add "<string name="checkout_web_view_title">Checkout</string>"
   */
  title?: string;
}

export type Configuration = CommonConfiguration & {
  acceleratedCheckouts?: AcceleratedCheckoutConfiguration;
} & (
    | {
        /**
         * The selected color scheme for the checkout. See README.md for more details.
         */
        colorScheme?: ColorScheme.web | ColorScheme.light | ColorScheme.dark;
        /**
         * Platform-specific color overrides
         */
        colors?: {
          ios?: IosColors;
          android?: AndroidColors;
        };
      }
    | {
        /**
         * The selected color scheme for the checkout. See README.md for more details.
         */
        colorScheme?: ColorScheme.automatic;
        /**
         * Platform-specific color overrides
         */
        colors?: {
          ios?: IosColors;
          android?: AndroidAutomaticColors;
        };
      }
  );

export type CheckoutEvent =
  | 'close'
  | 'complete'
  | 'start'
  | 'error'
  | 'geolocationRequest';

export interface GeolocationRequestEvent {
  origin: string;
}

export type CloseEventCallback = () => void;
export type GeolocationRequestEventCallback = (
  event: GeolocationRequestEvent,
) => void;
export type CheckoutExceptionCallback = (error: CheckoutException) => void;
export type CheckoutCompletedEventCallback = (
  event: CheckoutCompletedEvent,
) => void;
export type CheckoutStartedEventCallback = (
  event: CheckoutStartedEvent,
) => void;

export type CheckoutEventCallback =
  | CloseEventCallback
  | CheckoutExceptionCallback
  | CheckoutCompletedEventCallback
  | CheckoutStartedEventCallback
  | GeolocationRequestEventCallback;

/**
 * Available wallet types for accelerated checkout
 */
export enum AcceleratedCheckoutWallet {
  shopPay = 'shopPay',
  applePay = 'applePay',
}

export enum ApplePayContactField {
  email = 'email',
  phone = 'phone',
}

/**
 * Configuration for AcceleratedCheckouts
 */
export interface AcceleratedCheckoutConfiguration {
  /**
   * The storefront domain (e.g., "your-shop.myshopify.com")
   */
  storefrontDomain: string;

  /**
   * The storefront access token with `write_cart_wallet_payments` scope
   */
  storefrontAccessToken: string;

  /**
   * Customer information for personalized checkout
   */
  customer?: {
    email?: string;
    phoneNumber?: string;
    accessToken?: string;
  };
  /**
   * Enable and configure accelerated checkout wallets.
   */
  wallets?: {
    /**
     * Apple Pay specific configuration.
     * When provided, Apple Pay buttons can render and the Apple Pay sheet will
     * request the specified buyer contact fields.
     */
    applePay?: {
      /**
       * Buyer contact fields to request in the Apple Pay sheet.
       * Supported values:
       *  - 'email': request the buyer's email address
       *  - 'phone': request the buyer's phone number
       */
      contactFields: ApplePayContactField[];
      /**
       * The Apple Merchant Identifier used to sign Apple Pay payment requests on iOS.
       * Example: 'merchant.com.yourcompany'
       */
      merchantIdentifier: string;
    };
  };
}

function addEventListener(
  event: 'close',
  callback: () => void,
): Maybe<EmitterSubscription>;

function addEventListener(
  event: 'complete',
  callback: CheckoutCompletedEventCallback,
): Maybe<EmitterSubscription>;

function addEventListener(
  event: 'start',
  callback: CheckoutStartedEventCallback,
): Maybe<EmitterSubscription>;

function addEventListener(
  event: 'error',
  callback: CheckoutExceptionCallback,
): Maybe<EmitterSubscription>;

function addEventListener(
  event: 'geolocationRequest',
  callback: GeolocationRequestEventCallback,
): Maybe<EmitterSubscription>;

function removeEventListeners(event: CheckoutEvent): void;

export type AddEventListener = typeof addEventListener;
export type RemoveEventListeners = typeof removeEventListeners;

/**
 * Authentication configuration for checkout
 */
export interface CheckoutAuthentication {
  /**
   * JWT authentication token
   */
  token: string;
}

/**
 * Optional configuration for checkout presentation and preloading
 */
export interface CheckoutOptions {
  /**
   * Application authentication configuration
   */
  authentication?: CheckoutAuthentication;
}

export interface ShopifyCheckoutSheetKit {
  /**
   * The version number of the Shopify Checkout SDK.
   */
  readonly version: string;
  /**
   * Preload the checkout for faster presentation.
   */
  preload(checkoutURL: string, options?: CheckoutOptions): void;

  /**
   * Invalidate preload cache.
   */
  invalidate(): void;
  /**
   * Present the checkout.
   */
  present(checkoutURL: string, options?: CheckoutOptions): void;
  /**
   * Configure the checkout. See README.md for more details.
   */
  setConfig(config: Configuration): Promise<void>;
  /**
   * Return the current config for the checkout. See README.md for more details.
   */
  getConfig(): Promise<Configuration>;
  /**
   * Listen for checkout events
   */
  addEventListener: AddEventListener;
  /**
   * Remove subscriptions to checkout events.
   */
  removeEventListeners: RemoveEventListeners;
  /**
   * Cleans up any event callbacks to prevent memory leaks.
   */
  teardown(): void;

  /**
   * Configure AcceleratedCheckouts for Shop Pay and Apple Pay buttons
   */
  configureAcceleratedCheckouts(
    config: AcceleratedCheckoutConfiguration,
  ): Promise<boolean>;

  /**
   * Check if accelerated checkout is available for the given cart or product
   */
  isAcceleratedCheckoutAvailable(): Promise<boolean>;
}
