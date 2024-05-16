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
import {ColorScheme} from './index.d';
import type {
  CheckoutEvent,
  CheckoutEventCallback,
  Configuration,
  ShopifyCheckoutSheetKit,
} from './index.d';
import {
  CheckoutException,
  CheckoutExpiredError,
  CheckoutClientError,
  CheckoutHTTPError,
  ConfigurationError,
  InternalError,
  CheckoutNativeError,
  CheckoutNativeErrorType,
  GenericError,
} from './errors.d';
import {CheckoutErrorCode} from './errors.d';
import type {CustomEvent, PixelEvent} from './pixels';

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

  public dismiss(): void {
    RNShopifyCheckoutSheetKit.dismiss();
  }

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
    let eventCallback;

    switch (event) {
      case 'pixel':
        eventCallback = this.interceptEventEmission(
          callback,
          this.parseCustomPixelData,
        );
        break;
      case 'completed':
        eventCallback = this.interceptEventEmission(callback);
        break;
      case 'error':
        eventCallback = this.interceptEventEmission(
          callback,
          this.parseCheckoutError,
        );
        break;
      default:
        eventCallback = callback;
    }

    // Default handler for all non-pixel events
    return ShopifyCheckoutSheet.eventEmitter.addListener(event, eventCallback);
  }

  public removeEventListeners(event: CheckoutEvent) {
    ShopifyCheckoutSheet.eventEmitter.removeAllListeners(event);
  }

  // ---

  private parseCustomPixelData(eventData: PixelEvent): PixelEvent {
    if (
      isCustomPixelEvent(eventData) &&
      eventData.hasOwnProperty('customData') &&
      typeof eventData.customData === 'string'
    ) {
      try {
        return {
          ...eventData,
          customData: JSON.parse(eventData.customData),
        };
      } catch {
        return eventData;
      }
    }

    return eventData;
  }

  private parseCheckoutError(
    exception: CheckoutNativeError,
  ): CheckoutException {
    switch (exception?.__typename) {
      case CheckoutNativeErrorType.InternalError:
        return new InternalError(exception);
      case CheckoutNativeErrorType.ConfigurationError:
        return new ConfigurationError(exception);
      case CheckoutNativeErrorType.CheckoutClientError:
        return new CheckoutClientError(exception);
      case CheckoutNativeErrorType.CheckoutHTTPError:
        return new CheckoutHTTPError(exception);
      case CheckoutNativeErrorType.CheckoutExpiredError:
        return new CheckoutExpiredError(exception);
      default:
        return new GenericError(exception);
    }
  }

  /**
   * Event data can be sent back as either a parsed Event object or a JSON string.
   */
  private interceptEventEmission(
    callback: CheckoutEventCallback,
    transformData?: (data: any) => any,
  ): (eventData: string | typeof callback) => void {
    return (eventData: string | typeof callback): void => {
      try {
        if (typeof eventData === 'string') {
          try {
            let parsed = JSON.parse(eventData);
            parsed = transformData?.(parsed) ?? parsed;
            callback(parsed);
          } catch (error) {
            const parseError = new LifecycleEventParseError(
              'Failed to parse event data: Invalid JSON',
              {
                cause: 'Invalid JSON',
              },
            );
            // eslint-disable-next-line no-console
            console.error(parseError);
          }
        } else if (eventData && typeof eventData === 'object') {
          callback(transformData?.(eventData) ?? eventData);
        }
      } catch (error) {
        const parseError = new LifecycleEventParseError(
          'Failed to parse event data',
          {
            cause: 'Unknown',
          },
        );
        // eslint-disable-next-line no-console
        console.error(parseError);
      }
    };
  }
}

function isCustomPixelEvent(event: PixelEvent): event is CustomEvent {
  return event.type === 'CUSTOM';
}

export class LifecycleEventParseError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LifecycleEventParseError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LifecycleEventParseError);
    }
  }
}

// API
export {
  ColorScheme,
  ShopifyCheckoutSheet,
  ShopifyCheckoutSheetProvider,
  useShopifyCheckoutSheet,
};

// Error classes
export {
  CheckoutClientError,
  CheckoutErrorCode,
  CheckoutExpiredError,
  CheckoutHTTPError,
  CheckoutNativeErrorType,
  ConfigurationError,
  GenericError,
  InternalError,
};

// Types
export type {
  CheckoutEvent,
  CheckoutEventCallback,
  CheckoutException,
  Configuration,
  CustomEvent,
  PixelEvent,
};
