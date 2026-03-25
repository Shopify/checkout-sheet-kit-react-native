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
