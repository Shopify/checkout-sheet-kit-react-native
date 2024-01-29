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
import {
  ColorScheme,
  type CheckoutEvent,
  type CheckoutEventCallback,
  type Configuration,
  type ShopifyCheckoutSheetKit,
} from './index.d';
import {type PixelEvent} from './pixels';

const RNShopifyCheckoutSheetKit = NativeModules.ShopifyCheckoutSheetKit;

if (!('ShopifyCheckoutSheetKit' in NativeModules)) {
  throw new Error(`
  "@shopify/checkout-sheet-kit" is not correctly linked.

  If you are building for iOS, make sure to run "pod install" first and restart the metro server.`);
}

class ShopifyCheckoutSheet implements ShopifyCheckoutSheetKit {
  private static eventEmitter: NativeEventEmitter = new NativeEventEmitter(
    RNShopifyCheckoutSheetKit,
  );

  constructor(configuration?: Configuration) {
    if (configuration != null) {
      this.setConfig(configuration);
    }
  }

  public readonly version: string = RNShopifyCheckoutSheetKit.version;

  public preload(checkoutUrl: string): void {
    RNShopifyCheckoutSheetKit.preload(checkoutUrl);
  }

  public present(checkoutUrl: string): void {
    RNShopifyCheckoutSheetKit.present(checkoutUrl);
  }

  public async getConfig(): Promise<Configuration> {
    return RNShopifyCheckoutSheetKit.getConfig();
  }

  public setConfig(configuration: Configuration): void {
    RNShopifyCheckoutSheetKit.setConfig(configuration);
  }

  public addEventListener(
    event: CheckoutEvent,
    callback: CheckoutEventCallback,
  ): EmitterSubscription | undefined {
    if (event === 'pixel' && typeof callback === 'function') {
      const eventHandler = callback as (data?: PixelEvent) => void;

      /**
       * Event data can be sent back as either a parsed Pixel Event object or a JSON string.
       */
      const cb = (eventData: string | PixelEvent) => {
        try {
          if (typeof eventData === 'string') {
            try {
              const parsed = JSON.parse(eventData);
              eventHandler(parsed as PixelEvent);
            } catch (error) {
              throw new WebPixelsParseError(
                'Failed to parse Web Pixel event data.',
                {
                  cause: 'Invalid JSON',
                },
              );
            }
          } else if (eventData && typeof eventData === 'object') {
            eventHandler(eventData);
          }
        } catch (error) {
          throw new WebPixelsParseError(
            'Failed to parse Web Pixel event data.',
            {
              cause: 'Unknown',
            },
          );
        }
      };
      return ShopifyCheckoutSheet.eventEmitter.addListener(event, cb);
    } else {
      return ShopifyCheckoutSheet.eventEmitter.addListener(event, callback);
    }
  }

  public removeEventListeners(event: CheckoutEvent) {
    ShopifyCheckoutSheet.eventEmitter.removeAllListeners(event);
  }
}

export class WebPixelsParseError extends Error {
  constructor(
    message?: string | undefined,
    options?: ErrorOptions | undefined,
  ) {
    super(message, options);
    this.name = 'WebPixelsParseError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WebPixelsParseError);
    }
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
