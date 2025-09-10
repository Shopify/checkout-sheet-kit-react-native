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
import type {Configuration} from '../index.d';

type NativeShopifyCheckoutSheetKit = {
  readonly version: string;
  dismiss(): void;
  invalidateCache(): void;
  preload(checkoutUrl: string): void;
  present(checkoutUrl: string): void;
  getConfig(): Promise<Configuration>;
  setConfig(configuration: Configuration): void;
  // iOS-specific accelerated checkouts
  configureAcceleratedCheckouts?: (
    storefrontDomain: string,
    storefrontAccessToken: string,
    customerEmail: string | null,
    customerPhoneNumber: string | null,
    customerAccessToken: string | null,
    applePayMerchantIdentifier: string | null,
    applePayContactFields: string[],
  ) => Promise<boolean>;
  isAcceleratedCheckoutAvailable?: () => Promise<boolean>;
  isApplePayAvailable?: () => Promise<boolean>;
  // Android-specific geolocation
  initiateGeolocationRequest?: (allow: boolean) => void;
  // RN event emitter contract for TurboModules
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

export function getShopifyCheckoutNativeModule():
  | NativeShopifyCheckoutSheetKit
  | undefined {
  // Prefer TurboModule if available; fall back to classic bridge.
  try {
    // Dynamically require to avoid throwing when codegen isn't wired yet.
    // If the generated spec is present, default export should be the TurboModule proxy.
    const turbo: NativeShopifyCheckoutSheetKit =
      require('./NativeShopifyCheckoutSheetKit').default;

    if (turbo != null) {
      return turbo;
    }
  } catch {
    // no-op; fall back to classic bridge
  }

  const legacy = (NativeModules as any).ShopifyCheckoutSheetKit as
    | NativeShopifyCheckoutSheetKit
    | undefined;

  return legacy;
}

export type {NativeShopifyCheckoutSheetKit};
