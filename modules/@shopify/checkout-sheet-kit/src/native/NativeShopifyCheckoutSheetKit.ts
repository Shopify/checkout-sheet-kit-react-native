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

export type AndroidColorOverrides = {
  backgroundColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  progressIndicator?: string;
  closeButtonColor?: string | null;
};

export type AndroidAutomaticOverrides = {
  light?: AndroidColorOverrides | null;
  dark?: AndroidColorOverrides | null;
};

export type IosColorOverrides = {
  tintColor?: string;
  backgroundColor?: string;
  closeButtonColor?: string;
};

export type ConfigurationInput = {
  preloading?: boolean;
  title?: string;
  colorScheme?: 'automatic' | 'light' | 'dark' | 'web_default';
  colors?: {
    ios?: IosColorOverrides;
    // Superset shape that covers both direct overrides and automatic(light/dark)
    android?: AndroidColorOverrides & AndroidAutomaticOverrides;
  };
};

export type ConfigurationOutput = {
  title?: string | null;
  preloading: boolean;
  colorScheme: 'automatic' | 'light' | 'dark' | 'web_default';
  tintColor?: string | null;
  backgroundColor?: string | null;
  closeButtonColor?: string | null;
};

export interface Spec extends TurboModule {
  getVersion(): string;
  dismiss(): void;
  invalidateCache(): void;
  preload(checkoutUrl: string): void;
  present(checkoutUrl: string): void;
  getConfig(): Promise<ConfigurationOutput>;
  setConfig(configuration: ConfigurationInput): void;
  configureAcceleratedCheckouts(
    storefrontDomain: string,
    storefrontAccessToken: string,
    customerEmail: string | null,
    customerPhoneNumber: string | null,
    customerAccessToken: string | null,
    applePayMerchantIdentifier: string | null,
    applePayContactFields: ReadonlyArray<'email' | 'phone'>,
  ): Promise<boolean>;
  isAcceleratedCheckoutAvailable(): Promise<boolean>;
  isApplePayAvailable(): Promise<boolean>;
  initiateGeolocationRequest(allow: boolean): void;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ShopifyCheckoutSheetKit',
);
