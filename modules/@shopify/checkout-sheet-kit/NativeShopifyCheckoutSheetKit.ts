import {TurboModule, TurboModuleRegistry} from 'react-native';
import {UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

type Configuration = Readonly<Record<string, string>>;

export interface Spec extends TurboModule {
  readonly getConstants: () => {};

  // your module methods go here, for example:
  getString(id: string): Promise<string>;

  /// Present checkout
  present(checkoutURL: string): UnsafeObject;

  /// Preload checkout
  preload(checkoutURL: string): void;

  /// Set configuration for checkout
  setConfig(configuration: Configuration): void;

  // Return configuration for checkout
  getConfig(): Promise<Configuration>;
}

export default TurboModuleRegistry.get<Spec>('ShopifyCheckoutSheetKit');
