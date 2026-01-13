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
  PermissionsAndroid,
  Platform,
} from 'react-native';
import type {
  EmitterSubscription,
  EventSubscription,
  PermissionStatus,
} from 'react-native';
import {ShopifyCheckoutSheetProvider, useShopifyCheckoutSheet} from './context';
import {ApplePayContactField, ColorScheme} from './index.d';
import type {
  AcceleratedCheckoutConfiguration,
  CheckoutAuthentication,
  CheckoutEvent,
  CheckoutEventCallback,
  CheckoutOptions,
  Configuration,
  Features,
  GeolocationRequestEvent,
  Maybe,
  ShopifyCheckoutSheetKit,
} from './index.d';
import {AcceleratedCheckoutWallet} from './index.d';
import type {CheckoutException} from './errors.d';
import {
  CheckoutClientError,
  CheckoutErrorCode,
  CheckoutExpiredError,
  CheckoutHTTPError,
  CheckoutNativeErrorType,
  ConfigurationError,
  GenericError,
  InternalError,
  parseCheckoutError,
} from './errors.d';
import {ApplePayLabel} from './components/AcceleratedCheckoutButtons';

const RNShopifyCheckoutSheetKit = NativeModules.ShopifyCheckoutSheetKit;

if (!('ShopifyCheckoutSheetKit' in NativeModules)) {
  throw new Error(`
  "@shopify/checkout-sheet-kit" is not correctly linked.

  If you are building for iOS, make sure to run "pod install" first and restart the metro server.`);
}

const defaultFeatures: Features = {
  handleGeolocationRequests: true,
};

class ShopifyCheckoutSheet implements ShopifyCheckoutSheetKit {
  private static eventEmitter: NativeEventEmitter = new NativeEventEmitter(
    RNShopifyCheckoutSheetKit,
  );

  private features: Features;
  private geolocationCallback: Maybe<EventSubscription>;

  private _acceleratedCheckoutsReady = false;

  get acceleratedCheckoutsReady(): boolean {
    return this._acceleratedCheckoutsReady;
  }

  /**
   * Initializes a new ShopifyCheckoutSheet instance
   * @param configuration Optional configuration settings for the checkout
   * @param features Optional feature flags to customize behavior, defaults to defaultFeatures
   */
  constructor(
    configuration?: Configuration,
    features: Partial<Features> = defaultFeatures,
  ) {
    this.features = {...defaultFeatures, ...features};

    if (configuration != null) {
      this.setConfig(configuration);
    }

    if (
      Platform.OS === 'android' &&
      this.featureEnabled('handleGeolocationRequests')
    ) {
      this.subscribeToGeolocationRequestPrompts();
    }
  }

  public readonly version: string = RNShopifyCheckoutSheetKit.version;

  /**
   * Dismisses the currently displayed checkout sheet
   */
  public dismiss(): void {
    RNShopifyCheckoutSheetKit.dismiss();
  }

  /**
   * Invalidates the checkout that was cached using preload
   */
  public invalidate(): void {
    RNShopifyCheckoutSheetKit.invalidateCache();
  }

  /**
   * Preloads checkout for a given URL to improve performance
   * @param checkoutUrl The URL of the checkout to preload
   * @param options Optional checkout session configuration (e.g. authentication)
   */
  public preload(checkoutUrl: string, options?: CheckoutOptions): void {
    RNShopifyCheckoutSheetKit.preload(checkoutUrl, options);
  }

  /**
   * Presents the checkout sheet for a given checkout URL
   * @param checkoutUrl The URL of the checkout to display
   * @param options Optional checkout session configuration (e.g. authentication)
   */
  public present(checkoutUrl: string, options?: CheckoutOptions): void {
    RNShopifyCheckoutSheetKit.present(checkoutUrl, options);
  }

  /**
   * Retrieves the current checkout configuration
   * @returns Promise containing the current Configuration
   */
  public async getConfig(): Promise<Configuration> {
    return RNShopifyCheckoutSheetKit.getConfig();
  }

  /**
   * Updates the checkout configuration
   * @param configuration New configuration settings to apply
   */
  public async setConfig(configuration: Configuration): Promise<void> {
    if (configuration.acceleratedCheckouts) {
      this._acceleratedCheckoutsReady =
        await this.configureAcceleratedCheckouts(
          configuration.acceleratedCheckouts,
        );
    }
    RNShopifyCheckoutSheetKit.setConfig(configuration);
  }

  /**
   * Adds an event listener for checkout events
   * @param event The type of event to listen for
   * @param callback Function to be called when the event occurs
   * @returns An EmitterSubscription that can be used to remove the listener
   */
  public addEventListener(
    event: CheckoutEvent,
    callback: CheckoutEventCallback,
  ): EmitterSubscription | undefined {
    let eventCallback;

    switch (event) {
      case 'complete':
        eventCallback = this.parseEventData('complete', callback);
        break;
      case 'start':
        eventCallback = this.parseEventData('start', callback);
        break;
      case 'addressChangeStart':
        eventCallback = this.parseEventData('addressChangeStart', callback);
        break;
      case 'submitStart':
        eventCallback = this.parseEventData('submitStart', callback);
        break;
      case 'paymentMethodChangeStart':
        eventCallback = this.parseEventData(
          'paymentMethodChangeStart',
          callback,
        );
        break;
      case 'error':
        eventCallback = this.parseEventData(
          event,
          callback,
          parseCheckoutError,
        );
        break;
      case 'addressChangeStart':
      case 'complete':
      case 'geolocationRequest':
      case 'start':
      case 'submitStart':
        eventCallback = this.parseEventData(event, callback);
        break;
      case 'close':
        eventCallback = callback;
        break;
      default:
        assertNever(`Unhandled event "${event}" received`);
    }

    return ShopifyCheckoutSheet.eventEmitter.addListener(event, eventCallback);
  }

  /**
   * Removes all event listeners for a specific event type
   * @param event The type of event to remove listeners for
   */
  public removeEventListeners(event: CheckoutEvent) {
    ShopifyCheckoutSheet.eventEmitter.removeAllListeners(event);
  }

  /**
   * Cleans up resources and event listeners used by the checkout sheet
   */
  public teardown() {
    this.geolocationCallback?.remove();
  }

  /**
   * Configure AcceleratedCheckouts for Shop Pay and Apple Pay buttons
   * @param config Configuration for AcceleratedCheckouts
   */
  public async configureAcceleratedCheckouts(
    config: AcceleratedCheckoutConfiguration,
  ): Promise<boolean> {
    if (!this.acceleratedCheckoutsSupported) {
      return false;
    }

    try {
      this.validateAcceleratedCheckoutsConfiguration(config);

      const configured =
        await RNShopifyCheckoutSheetKit.configureAcceleratedCheckouts(
          config.storefrontDomain,
          config.storefrontAccessToken,
          config.customer?.email || null,
          config.customer?.phoneNumber || null,
          config.customer?.accessToken || null,
          config.wallets?.applePay?.merchantIdentifier || null,
          config.wallets?.applePay?.contactFields || [],
        );
      return configured;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        '[ShopifyCheckoutSheetKit] Failed to configure accelerated checkouts with',
        error,
      );
      return false;
    }
  }

  /**
   * Check if accelerated checkout is available for the given cart or product
   * @param options Options containing either cartId or variantId/quantity
   * @returns Promise<boolean> indicating availability
   */
  public async isAcceleratedCheckoutAvailable(): Promise<boolean> {
    if (!this.acceleratedCheckoutsSupported) {
      return false;
    }

    return RNShopifyCheckoutSheetKit.isAcceleratedCheckoutAvailable();
  }

  /**
   * Initiates a geolocation request for Android devices
   * Only needed if features.handleGeolocationRequests is false
   */
  public async initiateGeolocationRequest(allow: boolean) {
    if (Platform.OS === 'android') {
      RNShopifyCheckoutSheetKit.initiateGeolocationRequest?.(allow);
    }
  }

  // --- private

  /**
   * Accelerated Checkouts is only supported from iOS 16.0 onwards
   */
  private get acceleratedCheckoutsSupported(): boolean {
    return Platform.OS === 'ios' && this.majorVersion >= 16;
  }

  private get majorVersion(): number {
    return parseInt(String(Platform.Version), 10);
  }

  private validateAcceleratedCheckoutsConfiguration(
    acceleratedCheckouts: Configuration['acceleratedCheckouts'],
  ) {
    /**
     * Required Accelerated Checkouts configuration properties
     */
    if (!acceleratedCheckouts?.storefrontDomain) {
      throw new Error('`storefrontDomain` is required');
    }
    if (!acceleratedCheckouts.storefrontAccessToken) {
      throw new Error('`storefrontAccessToken` is required');
    }

    /**
     * Validate Apple Pay config if available
     */
    if (acceleratedCheckouts.wallets?.applePay) {
      if (!acceleratedCheckouts.wallets.applePay.merchantIdentifier) {
        throw new Error('`wallets.applePay.merchantIdentifier` is required');
      }

      const expectedContactFields = Object.values(ApplePayContactField);
      const hasInvalidContactFields =
        Array.isArray(acceleratedCheckouts.wallets.applePay.contactFields) &&
        acceleratedCheckouts.wallets.applePay.contactFields.some(
          value =>
            !expectedContactFields.includes(
              value.toLowerCase() as ApplePayContactField,
            ),
        );

      if (hasInvalidContactFields) {
        throw new Error(
          `'wallets.applePay.contactFields' contains unexpected values. Expected "${expectedContactFields.join(', ')}", received "${acceleratedCheckouts.wallets.applePay.contactFields}"`,
        );
      }
    }
  }

  /**
   * Checks if a specific feature is enabled in the configuration
   * @param feature The feature to check
   * @returns boolean indicating if the feature is enabled
   */
  private featureEnabled(feature: keyof Features) {
    return this.features[feature] ?? true;
  }

  /**
   * Sets up geolocation request handling for Android devices
   */
  private subscribeToGeolocationRequestPrompts() {
    this.geolocationCallback = this.addEventListener(
      'geolocationRequest',
      async () => {
        const coarseOrFineGrainAccessGranted = await this.requestGeolocation();

        this.initiateGeolocationRequest(coarseOrFineGrainAccessGranted);
      },
    );
  }

  /**
   * Requests geolocation permissions on Android
   * @returns Promise<boolean> indicating if permission was granted
   */
  private async requestGeolocation(): Promise<boolean> {
    const coarse = 'android.permission.ACCESS_COARSE_LOCATION';
    const fine = 'android.permission.ACCESS_FINE_LOCATION';
    const results = await PermissionsAndroid.requestMultiple([coarse, fine]);

    return [results[coarse], results[fine]].some(this.permissionGranted);
  }

  /**
   * Checks if the given permission status indicates that permission was granted
   * @param status The permission status to check
   * @returns boolean indicating if the permission was granted
   */
  private permissionGranted(status: PermissionStatus): boolean {
    return status === 'granted';
  }

  /**
   * Handles event emission parsing and transformation
   * @param event The type of event being intercepted
   * @param callback The callback to execute with the parsed data
   * @param transformData Optional function to transform the event data
   * @returns Function that handles the event emission
   */
  private parseEventData(
    event: CheckoutEvent,
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
              `Failed to parse "${event}" event data: Invalid JSON`,
              {
                cause: 'Invalid JSON',
              },
            );
            // eslint-disable-next-line no-console
            console.error(parseError, eventData);
          }
        } else if (eventData && typeof eventData === 'object') {
          callback(transformData?.(eventData) ?? eventData);
        }
      } catch (error) {
        const parseError = new LifecycleEventParseError(
          `Failed to parse "${event}" event data`,
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

function assertNever(message: string): never {
  throw new Error(message);
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
  AcceleratedCheckoutWallet,
  ApplePayContactField,
  ApplePayLabel,
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
  AcceleratedCheckoutConfiguration,
  CheckoutAuthentication,
  CheckoutEvent,
  CheckoutEventCallback,
  CheckoutException,
  CheckoutOptions,
  Configuration,
  Features,
  GeolocationRequestEvent,
};

// Event types
export type {
  Cart,
  CartAddress,
  PaymentCredential,
  CartPayment,
  CartPaymentInstrument,
  CartPaymentMethod,
  CartSelectableAddress,
  CardBrand,
  CheckoutAddressChangeStartEvent,
  CheckoutAddressChangeStartResponsePayload,
  CheckoutCompleteEvent,
  CheckoutEventResponsePayload,
  CheckoutPaymentMethodChangeStartEvent,
  CheckoutPaymentMethodChangeStartResponsePayload,
  CheckoutResponseError,
  CheckoutStartEvent,
  CheckoutSubmitStartEvent,
  CheckoutSubmitStartResponsePayload,
  RemoteTokenPaymentCredential,
} from './events.d';

// Component types
export type {
  AcceleratedCheckoutButtonsProps,
  RenderStateChangeEvent,
} from './components/AcceleratedCheckoutButtons';
export type {
  ShopifyCheckoutProps,
  ShopifyCheckoutRef,
} from './components/ShopifyCheckout';
export type {ShopifyCheckoutEventProviderProps} from './ShopifyCheckoutEventProvider';

// Components
export {
  AcceleratedCheckoutButtons,
  RenderState,
} from './components/AcceleratedCheckoutButtons';
export {ShopifyCheckout} from './components/ShopifyCheckout';
export {
  ShopifyCheckoutEventProvider,
  useCheckoutEvents,
  useShopifyEvent,
} from './ShopifyCheckoutEventProvider';
