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

import {NativeModules} from 'react-native';

const {ShopifyCheckout} = NativeModules;

export enum ColorScheme {
  automatic = 'automatic',
  light = 'light',
  dark = 'dark',
  web = 'web_default',
}

export interface ShopifyCheckoutConfiguration {
  /**
   * The selected color scheme for the checkout. See README.md for more details.
   */
  colorScheme?: ColorScheme;
  /**
   * Enable/disable preloading for checkout. This option must be enabled for `.preload()` to work as expected.
   */
  preloading?: boolean;
}

interface ShopifyCheckout {
  /**
   * The version number of the Shopify Checkout SDK.
   */
  version: string;
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
  configure(config: ShopifyCheckoutConfiguration): void;
  /**
   * Return the current config for the checkout. See README.md for more details.
   */
  getConfig(): Promise<ShopifyCheckoutConfiguration>;
}

export default ShopifyCheckout as ShopifyCheckout;
