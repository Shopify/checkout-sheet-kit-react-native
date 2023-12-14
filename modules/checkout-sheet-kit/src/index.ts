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

import {
  NativeModules,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';
import {ShopifyCheckoutSheetProvider, useShopifyCheckoutSheet} from './context';
import type {
  CheckoutEvent,
  CheckoutEventCallback,
  Configuration,
  ShopifyCheckoutSheet as ShopifyCheckout,
} from './index.d';
import {ColorScheme} from './index.d';

const RNShopifyCheckout = NativeModules.ShopifyCheckoutSheetKit;

if (!('ShopifyCheckoutSheetKit' in NativeModules)) {
  throw new Error(`
  "@shopify/checkout-sheet-kit" is not correctly linked.

  If you are building for iOS, make sure to run "pod install" first and restart the metro server.`);
}

class ShopifyCheckoutSheet implements ShopifyCheckout {
  private eventEmitter: NativeEventEmitter;

  constructor(configuration?: Configuration) {
    if (configuration != null) {
      this.configure(configuration);
    }

    this.eventEmitter = new NativeEventEmitter(RNShopifyCheckout);
  }

  public readonly version: string = RNShopifyCheckout.version;

  public configure(configuration: Configuration): void {
    RNShopifyCheckout.configure(configuration);
  }

  public preload(checkoutUrl: string): void {
    RNShopifyCheckout.preload(checkoutUrl);
  }

  public present(checkoutUrl: string): void {
    RNShopifyCheckout.present(checkoutUrl);
  }

  public async getConfig(): Promise<Configuration> {
    return RNShopifyCheckout.getConfig();
  }

  public addEventListener(
    eventName: CheckoutEvent,
    callback: CheckoutEventCallback,
  ): EmitterSubscription | undefined {
    return this.eventEmitter.addListener(eventName, callback);
  }

  public removeEventListeners(event: CheckoutEvent) {
    this.eventEmitter.removeAllListeners(event);
  }
}

// API
export {
  ShopifyCheckoutSheet,
  ShopifyCheckoutSheetProvider,
  useShopifyCheckoutSheet,
  ColorScheme,
};

// Types
export {CheckoutEvent, CheckoutEventCallback, Configuration};
