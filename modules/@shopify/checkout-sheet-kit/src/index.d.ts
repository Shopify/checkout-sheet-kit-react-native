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

import {EmitterSubscription} from 'react-native';
import {PixelEvent} from './pixels';

export type Maybe<T> = T | undefined;

export enum ColorScheme {
  automatic = 'automatic',
  light = 'light',
  dark = 'dark',
  web = 'web_default',
}

export interface IosColors {
  /**
   * A HEX color value for customizing the color of the loading spinner.
   */
  spinnerColor?: string;
  /**
   * A HEX color value for customizing the background color of the webview.
   */
  backgroundColor?: string;
}

export interface AndroidColors {
  /**
   * A HEX color value for customizing the color of the loading spinner.
   */
  spinnerColor: string;
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

export type Configuration =
  | {
      /**
       * The selected color scheme for the checkout. See README.md for more details.
       */
      colorScheme?: ColorScheme.web | ColorScheme.light | ColorScheme.dark;
      /**
       * Enable/disable preloading for checkout. This option must be enabled for `.preload()` to work as expected.
       */
      preloading?: boolean;
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
       * Enable/disable preloading for checkout. This option must be enabled for `.preload()` to work as expected.
       */
      preloading?: boolean;
      /**
       * Platform-specific color overrides
       */
      colors?: {
        ios?: IosColors;
        android?: AndroidAutomaticColors;
      };
    };

export interface CheckoutException {
  message: string;
}

export interface Context {
  document: WebPixelsDocument;
  navigator: WebPixelsNavigator;
  window: WebPixelsWindow;
}

export type CheckoutEvent = 'close' | 'completed' | 'error' | 'pixel';

export type CheckoutEventCallback =
  | (() => void)
  | ((error: CheckoutException) => void)
  | ((event: PixelEvent) => void);

function addEventListener(
  event: 'close' | 'completed',
  callback: () => void,
): Maybe<EmitterSubscription>;

function addEventListener(
  event: 'error',
  callback: (error: CheckoutException) => void,
): Maybe<EmitterSubscription>;

function addEventListener(
  event: 'pixel',
  callback: (event: PixelEvent) => void,
): Maybe<EmitterSubscription>;

function removeEventListeners(event: CheckoutEvent): void;

export type AddEventListener = typeof addEventListener;
export type RemoveEventListeners = typeof removeEventListeners;

export interface ShopifyCheckoutSheetKit {
  /**
   * The version number of the Shopify Checkout SDK.
   */
  readonly version: string;
  /**
   * Preload the checkout for faster presentation.
   */
  preload(checkoutURL: string): void;
  /**
   * Present the checkout.
   */
  present(checkoutURL: string): void;
  /**
   * Configure the checkout. See README.md for more details.
   */
  setConfig(config: Configuration): void;
  /**
   * Return the current config for the checkout. See README.md for more details.
   */
  getConfig(): Promise<Configuration>;
  /**
   * Listen for checkout events
   */
  addEventListener: AddEventListener;
  /**
   * Remove subscriptions to checkout events
   */
  removeEventListeners: RemoveEventListeners;
}
