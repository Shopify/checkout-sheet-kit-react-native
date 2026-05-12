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

import {NativeEventEmitter, PermissionsAndroid, Platform} from 'react-native';
import type {
  EmitterSubscription,
  EventSubscription,
  PermissionStatus,
} from 'react-native';
import RNShopifyCheckoutSheetKit from './specs/NativeShopifyCheckoutSheetKit';
import {ShopifyCheckoutSheetProvider, useShopifyCheckoutSheet} from './context';
import {ApplePayContactField, ColorScheme, LogLevel} from './index.d';
import type {
  AcceleratedCheckoutConfiguration,
  CheckoutEvent,
  CheckoutEventCallback,
  Configuration,
  Features,
  GeolocationRequestEvent,
  Maybe,
  ShopifyCheckoutSheetKit,
} from './index.d';
import {AcceleratedCheckoutWallet} from './index.d';
import type {CheckoutException, CheckoutNativeError} from './errors.d';
import {
  CheckoutExpiredError,
  CheckoutClientError,
  CheckoutHTTPError,
  ConfigurationError,
  InternalError,
  CheckoutNativeErrorType,
  GenericError,
} from './errors.d';
import {CheckoutErrorCode} from './errors.d';
import type {CheckoutCompletedEvent} from './events.d';
import type {CustomEvent, PixelEvent, StandardEvent} from './pixels.d';
import {ApplePayLabel, ApplePayStyle} from './components/AcceleratedCheckoutButtons';
import type {
  AcceleratedCheckoutButtonsProps,
  RenderStateChangeEvent,
} from './components/AcceleratedCheckoutButtons';

const defaultFeatures: Features = {
  handleGeolocationRequests: true,
};

// TurboModule codegen doesn't support TypeScript string literal unions or
// enums — spec types collapse to plain `string`. These sets are used by the
// coercion helpers below to narrow the string back to the consumer-facing
// enum, falling back to a safe default if native returns an unknown value.
const colorSchemeValues: ReadonlySet<string> = new Set(
  Object.values(ColorScheme),
);
const logLevelValues: ReadonlySet<string> = new Set(Object.values(LogLevel));

class ShopifyCheckoutSheet implements ShopifyCheckoutSheetKit {
  private static eventEmitter: NativeEventEmitter = new NativeEventEmitter(
    RNShopifyCheckoutSheetKit,
  );

  private features: Features;
  private geolocationCallback: Maybe<EventSubscription>;

  private _acceleratedCheckoutsReady = false;

  // TurboModule constants are immutable for the lifetime of the process —
  // capture once so `version` (and any future constants) can be read without
  // re-crossing the JSI boundary on every access.
  private readonly constants = RNShopifyCheckoutSheetKit.getConstants();

  public get acceleratedCheckoutsReady(): boolean {
    return this._acceleratedCheckoutsReady;
  }

  public get version(): string {
    return this.constants.version;
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
   */
  public preload(checkoutUrl: string): void {
    RNShopifyCheckoutSheetKit.preload(checkoutUrl);
  }

  /**
   * Presents the checkout sheet for a given checkout URL
   * @param checkoutUrl The URL of the checkout to display
   */
  public present(checkoutUrl: string): void {
    RNShopifyCheckoutSheetKit.present(checkoutUrl);
  }

  /**
   * Retrieves the current checkout configuration
   * @returns Promise containing the current Configuration
   */
  public async getConfig(): Promise<Configuration> {
    return this.coerceConfigurationResult(RNShopifyCheckoutSheetKit.getConfig());
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
      case 'pixel':
        eventCallback = this.interceptEventEmission(
          'pixel',
          callback,
          this.parseCustomPixelData,
        );
        break;
      case 'completed':
        eventCallback = this.interceptEventEmission('completed', callback);
        break;
      case 'error':
        eventCallback = this.interceptEventEmission(
          'error',
          callback,
          this.parseCheckoutError,
        );
        break;
      case 'geolocationRequest':
        eventCallback = this.interceptEventEmission(
          'geolocationRequest',
          callback,
        );
        break;
      default:
        eventCallback = callback;
    }

    // Default handler for all non-pixel events
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

      return RNShopifyCheckoutSheetKit.configureAcceleratedCheckouts(
        config.storefrontDomain,
        config.storefrontAccessToken,
        config.customer?.email || null,
        config.customer?.phoneNumber || null,
        config.customer?.accessToken || null,
        config.wallets?.applePay?.merchantIdentifier || null,
        config.wallets?.applePay?.contactFields || [],
        config.wallets?.applePay?.supportedShippingCountries || [],
      );
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
    if (!acceleratedCheckouts) {
      return;
    }

    const {storefrontDomain, storefrontAccessToken, wallets} =
      acceleratedCheckouts;

    /**
     * Required Accelerated Checkouts configuration properties
     */
    if (!storefrontDomain) {
      throw new Error('`storefrontDomain` is required');
    }
    if (!storefrontAccessToken) {
      throw new Error('`storefrontAccessToken` is required');
    }

    /**
     * Validate Apple Pay config if available
     */
    if (wallets?.applePay) {
      const {merchantIdentifier, contactFields, supportedShippingCountries} =
        wallets.applePay;

      if (!merchantIdentifier) {
        throw new Error('`wallets.applePay.merchantIdentifier` is required');
      }

      const expectedContactFields = Object.values(ApplePayContactField);
      const hasInvalidContactFields =
        Array.isArray(contactFields) &&
        contactFields.some(
          value =>
            !expectedContactFields.includes(
              value.toLowerCase() as ApplePayContactField,
            ),
        );

      if (hasInvalidContactFields) {
        throw new Error(
          `'wallets.applePay.contactFields' contains unexpected values. Expected "${expectedContactFields.join(', ')}", received "${contactFields}"`,
        );
      }

      if (
        Array.isArray(supportedShippingCountries) &&
        supportedShippingCountries?.some(country => typeof country !== 'string')
      ) {
        throw new Error(
          `'wallets.applePay.supportedShippingCountries' contains unexpected values. Expects ISO 3166-1 alpha-2 country codes (e.g., "US", "CA", "GB").`,
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
   * Coerces a native Configuration result into the consumer-facing
   * Configuration type.
   *
   * The TurboModule codegen spec can only express primitive types — string
   * literal unions and TypeScript enums collapse to plain `string` at the
   * bridge boundary. On the JS side consumers expect the typed `ColorScheme`
   * and `LogLevel` enums, so we coerce those two fields here. The rest of
   * the payload (preloading, title, nested colors) passes through unchanged.
   */
  private coerceConfigurationResult(
    raw: ReturnType<typeof RNShopifyCheckoutSheetKit.getConfig>,
  ): Configuration {
    return {
      ...raw,
      logLevel: this.coerceLogLevel(raw.logLevel),
      colorScheme: this.coerceColorScheme(raw.colorScheme),
    } as Configuration;
  }

  /**
   * Narrows a raw string from the native bridge to the ColorScheme enum.
   * Falls back to `automatic` if the native side returns an unrecognised
   * value (e.g. future SDK version adds a new scheme).
   */
  private coerceColorScheme(value: string): ColorScheme {
    return colorSchemeValues.has(value)
      ? (value as ColorScheme)
      : ColorScheme.automatic;
  }

  /**
   * Narrows a raw string from the native bridge to the LogLevel enum.
   * Falls back to `error` (the safest default) on unrecognised values.
   */
  private coerceLogLevel(value: string): LogLevel {
    return logLevelValues.has(value) ? (value as LogLevel) : LogLevel.error;
  }

  /**
   * Parses custom pixel event data from string to object if needed
   * @param eventData The pixel event data to parse
   * @returns Parsed PixelEvent object
   */
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

  /**
   * Converts native checkout errors into appropriate error class instances
   * @param exception The native error to parse
   * @returns Appropriate CheckoutException instance
   */
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
   * Handles event emission parsing and transformation
   * @param event The type of event being intercepted
   * @param callback The callback to execute with the parsed data
   * @param transformData Optional function to transform the event data
   * @returns Function that handles the event emission
   */
  private interceptEventEmission(
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
  AcceleratedCheckoutWallet,
  ApplePayContactField,
  ApplePayLabel,
  ApplePayStyle,
  ColorScheme,
  LogLevel,
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
  AcceleratedCheckoutButtonsProps,
  AcceleratedCheckoutConfiguration,
  CheckoutCompletedEvent,
  CheckoutEvent,
  CheckoutEventCallback,
  CheckoutException,
  Configuration,
  CustomEvent,
  Features,
  GeolocationRequestEvent,
  PixelEvent,
  RenderStateChangeEvent,
  StandardEvent,
};

// Components
export {
  AcceleratedCheckoutButtons,
  RenderState,
} from './components/AcceleratedCheckoutButtons';
