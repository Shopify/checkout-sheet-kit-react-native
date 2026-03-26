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

import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

type IosColorsSpec = {
  tintColor?: string;
  backgroundColor?: string;
  closeButtonColor?: string;
};

type AndroidColorsBaseSpec = {
  progressIndicator?: string;
  backgroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  closeButtonColor?: string;
};

type AndroidColorsSpec = {
  progressIndicator?: string;
  backgroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  closeButtonColor?: string;
  light?: AndroidColorsBaseSpec;
  dark?: AndroidColorsBaseSpec;
};

type ColorsSpec = {
  ios?: IosColorsSpec;
  android?: AndroidColorsSpec;
};

type ConfigurationSpec = {
  preloading?: boolean;
  title?: string;
  colorScheme?: string;
  logLevel?: string;
  colors?: ColorsSpec;
};

type ConfigurationResultSpec = {
  preloading: boolean;
  colorScheme: string;
  logLevel: string;
  title?: string;
  tintColor?: string;
  backgroundColor?: string;
  closeButtonColor?: string;
};

export interface Spec extends TurboModule {
  present(checkoutUrl: string): void;
  preload(checkoutUrl: string): void;
  dismiss(): void;
  invalidateCache(): void;
  setConfig(configuration: ConfigurationSpec): void;
  getConfig(): Promise<ConfigurationResultSpec>;
  configureAcceleratedCheckouts(
    storefrontDomain: string,
    storefrontAccessToken: string,
    customerEmail: string | null,
    customerPhoneNumber: string | null,
    customerAccessToken: string | null,
    applePayMerchantIdentifier: string | null,
    applyPayContactFields: string[],
    supportedShippingCountries: string[],
  ): Promise<boolean>;
  isAcceleratedCheckoutAvailable(): Promise<boolean>;
  isApplePayAvailable(): Promise<boolean>;
  initiateGeolocationRequest(allow: boolean): void;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
  getConstants(): {version: string};
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ShopifyCheckoutSheetKit',
);
