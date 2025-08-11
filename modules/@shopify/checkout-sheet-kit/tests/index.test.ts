/* eslint-disable no-new */

import {
  LifecycleEventParseError,
  ShopifyCheckoutSheet,
  CheckoutErrorCode,
  InternalError,
  ConfigurationError,
  CheckoutHTTPError,
  CheckoutClientError,
  CheckoutExpiredError,
  GenericError,
} from '../src';
import {ColorScheme, CheckoutNativeErrorType, type Configuration} from '../src';
import {NativeModules, PermissionsAndroid, Platform} from 'react-native';

const checkoutUrl = 'https://shopify.com/checkout';
const config: Configuration = {
  colorScheme: ColorScheme.automatic,
};

jest.mock('react-native', () => {
  let listeners: (typeof jest.fn)[] = [];

  const NativeEventEmitter = jest.fn(() => ({
    addListener: jest.fn((_, callback) => {
      listeners.push(callback);
    }),
    removeAllListeners: jest.fn(() => {
      listeners = [];
    }),
    emit: jest.fn((_, data: any) => {
      for (const listener of listeners) {
        listener(data);
      }

      // clear listeners
      listeners = [];
    }),
  }));

  const exampleConfig = {
    preloading: true,
  };

  const ShopifyCheckoutSheetKit = {
    eventEmitter: NativeEventEmitter(),
    version: '0.7.0',
    preload: jest.fn(),
    present: jest.fn(),
    dismiss: jest.fn(),
    invalidateCache: jest.fn(),
    getConfig: jest.fn(async () => exampleConfig),
    setConfig: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListeners: jest.fn(),
    initiateGeolocationRequest: jest.fn(),
  };

  return {
    Platform: {
      OS: 'ios',
    },
    PermissionsAndroid: {
      requestMultiple: jest.fn(),
    },
    _listeners: listeners,
    NativeEventEmitter,
    NativeModules: {
      ShopifyCheckoutSheetKit,
    },
  };
});

global.console = {
  ...global.console,
  error: jest.fn(),
};

describe('ShopifyCheckoutSheetKit', () => {
  // @ts-expect-error "eventEmitter is private"
  const eventEmitter = ShopifyCheckoutSheet.eventEmitter;

  afterEach(() => {
    NativeModules.ShopifyCheckoutSheetKit.setConfig.mockReset();
    NativeModules.ShopifyCheckoutSheetKit.eventEmitter.addListener.mockClear();
    NativeModules.ShopifyCheckoutSheetKit.eventEmitter.removeAllListeners.mockClear();

    // Clear mock listeners
    NativeModules._listeners = [];

    jest.clearAllMocks();
  });

  describe('instantiation', () => {
    it('calls `setConfig` with the specified config on instantiation', () => {
      new ShopifyCheckoutSheet(config);
      expect(
        NativeModules.ShopifyCheckoutSheetKit.setConfig,
      ).toHaveBeenCalledWith(config);
    });

    it('does not call `setConfig` if no config was specified on instantiation', () => {
      new ShopifyCheckoutSheet();
      expect(
        NativeModules.ShopifyCheckoutSheetKit.setConfig,
      ).not.toHaveBeenCalled();
    });
  });

  describe('setConfig', () => {
    it('calls the `setConfig` on the Native Module', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.setConfig(config);
      expect(
        NativeModules.ShopifyCheckoutSheetKit.setConfig,
      ).toHaveBeenCalledTimes(1);
      expect(
        NativeModules.ShopifyCheckoutSheetKit.setConfig,
      ).toHaveBeenCalledWith(config);
    });
  });

  describe('preload', () => {
    it('calls `preload` with a checkout URL', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.preload(checkoutUrl);
      expect(
        NativeModules.ShopifyCheckoutSheetKit.preload,
      ).toHaveBeenCalledTimes(1);
      expect(
        NativeModules.ShopifyCheckoutSheetKit.preload,
      ).toHaveBeenCalledWith(checkoutUrl);
    });
  });

  describe('invalidate', () => {
    it('calls `invalidateCache`', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.invalidate();
      expect(
        NativeModules.ShopifyCheckoutSheetKit.invalidateCache,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('present', () => {
    it('calls `present` with a checkout URL', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.present(checkoutUrl);
      expect(
        NativeModules.ShopifyCheckoutSheetKit.present,
      ).toHaveBeenCalledTimes(1);
      expect(
        NativeModules.ShopifyCheckoutSheetKit.present,
      ).toHaveBeenCalledWith(checkoutUrl);
    });
  });

  describe('dismiss', () => {
    it('calls `dismiss`', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.dismiss();
      expect(
        NativeModules.ShopifyCheckoutSheetKit.dismiss,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfig', () => {
    it('returns the config from the Native Module', async () => {
      const instance = new ShopifyCheckoutSheet();
      await expect(instance.getConfig()).resolves.toStrictEqual({
        preloading: true,
      });
      expect(
        NativeModules.ShopifyCheckoutSheetKit.getConfig,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('addEventListener', () => {
    it('creates a new event listener for a specific event', () => {
      const instance = new ShopifyCheckoutSheet();
      const eventName = 'close';
      const callback = jest.fn();
      instance.addEventListener(eventName, callback);
      expect(eventEmitter.addListener).toHaveBeenCalledWith(
        eventName,
        callback,
      );
    });

    describe('Pixel Events', () => {
      it('parses web pixel event JSON string data', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'pixel';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'pixel',
          expect.any(Function),
        );
        eventEmitter.emit(
          'pixel',
          JSON.stringify({type: 'STANDARD', someAttribute: 123}),
        );
        expect(callback).toHaveBeenCalledWith({
          type: 'STANDARD',
          someAttribute: 123,
        });
      });

      it('parses custom web pixel event data', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'pixel';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'pixel',
          expect.any(Function),
        );
        eventEmitter.emit(
          'pixel',
          JSON.stringify({
            type: 'CUSTOM',
            someAttribute: 123,
            customData: JSON.stringify({valid: true}),
          }),
        );
        expect(callback).toHaveBeenCalledWith({
          type: 'CUSTOM',
          someAttribute: 123,
          customData: {valid: true},
        });
      });

      it('fails gracefully if custom event data cannot be parsed', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'pixel';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'pixel',
          expect.any(Function),
        );
        eventEmitter.emit(
          'pixel',
          JSON.stringify({
            type: 'CUSTOM',
            someAttribute: 123,
            customData: 'Invalid JSON',
          }),
        );
        expect(callback).toHaveBeenCalledWith({
          type: 'CUSTOM',
          someAttribute: 123,
          customData: 'Invalid JSON',
        });
      });

      it('prints an error if the web pixel event data cannot be parsed', () => {
        const mock = jest.spyOn(global.console, 'error');
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'pixel';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'pixel',
          expect.any(Function),
        );
        const invalidData = '{"someAttribute": 123';
        eventEmitter.emit('pixel', invalidData);
        expect(mock).toHaveBeenCalledWith(
          expect.any(LifecycleEventParseError),
          invalidData,
        );
      });

      it('handles unexpected errors during event processing', () => {
        const mock = jest.spyOn(global.console, 'error');
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'pixel';
        const callback = jest.fn(() => {
          throw new Error('Callback error');
        });
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'pixel',
          expect.any(Function),
        );
        eventEmitter.emit('pixel', {type: 'STANDARD', someAttribute: 123});
        expect(mock).toHaveBeenCalledWith(expect.any(LifecycleEventParseError));
      });
    });

    describe('Completed Event', () => {
      it('parses completed event string data as JSON', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'completed';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'completed',
          expect.any(Function),
        );
        eventEmitter.emit(
          'completed',
          JSON.stringify({orderDetails: {id: 'test-id'}}),
        );
        expect(callback).toHaveBeenCalledWith({orderDetails: {id: 'test-id'}});
      });

      it('parses completed event JSON data', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'completed';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'completed',
          expect.any(Function),
        );
        eventEmitter.emit('completed', {orderDetails: {id: 'test-id'}});
        expect(callback).toHaveBeenCalledWith({orderDetails: {id: 'test-id'}});
      });

      it('prints an error if the completed event data cannot be parsed', () => {
        const mock = jest.spyOn(global.console, 'error');
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'completed';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'completed',
          expect.any(Function),
        );
        const invalidData = 'INVALID JSON';
        eventEmitter.emit('completed', invalidData);
        expect(mock).toHaveBeenCalledWith(
          expect.any(LifecycleEventParseError),
          invalidData,
        );
      });
    });

    describe('Error Event', () => {
      const internalError = {
        __typename: CheckoutNativeErrorType.InternalError,
        message: 'Something went wrong',
        code: CheckoutErrorCode.unknown,
        recoverable: true,
      };

      const configError = {
        __typename: CheckoutNativeErrorType.ConfigurationError,
        message: 'Storefront Password Required',
        code: CheckoutErrorCode.storefrontPasswordRequired,
        recoverable: false,
      };

      const clientError = {
        __typename: CheckoutNativeErrorType.CheckoutClientError,
        message: 'Storefront Password Required',
        code: CheckoutErrorCode.storefrontPasswordRequired,
        recoverable: false,
      };

      const networkError = {
        __typename: CheckoutNativeErrorType.CheckoutHTTPError,
        message: 'Checkout not found',
        code: CheckoutErrorCode.httpError,
        statusCode: 400,
        recoverable: false,
      };

      const expiredError = {
        __typename: CheckoutNativeErrorType.CheckoutExpiredError,
        message: 'Customer Account Required',
        code: CheckoutErrorCode.cartExpired,
        recoverable: false,
      };

      it.each([
        {error: internalError, constructor: InternalError},
        {error: configError, constructor: ConfigurationError},
        {error: clientError, constructor: CheckoutClientError},
        {error: networkError, constructor: CheckoutHTTPError},
        {error: expiredError, constructor: CheckoutExpiredError},
      ])(`correctly parses error $error`, ({error, constructor}) => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'error';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'error',
          expect.any(Function),
        );
        eventEmitter.emit('error', error);
        const calledWith = callback.mock.calls[0][0];
        expect(calledWith).toBeInstanceOf(constructor);
        expect(calledWith).not.toHaveProperty('__typename');
        expect(calledWith).toHaveProperty('code');
        expect(calledWith).toHaveProperty('message');
        expect(calledWith).toHaveProperty('recoverable');
      });

      it('returns an unknown generic error if the error cannot be parsed', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'error';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        const error = {
          __typename: 'UnknownError',
          message: 'Something went wrong',
        };
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'error',
          expect.any(Function),
        );
        eventEmitter.emit('error', error);
        const calledWith = callback.mock.calls[0][0];
        expect(calledWith).toBeInstanceOf(GenericError);
        expect(callback).toHaveBeenCalledWith(new GenericError(error as any));
      });
    });
  });

  describe('removeEventListeners', () => {
    it('Removes all listeners for a specific event', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.addEventListener('close', () => {});
      instance.addEventListener('close', () => {});
      instance.removeEventListeners('close');
      expect(eventEmitter.removeAllListeners).toHaveBeenCalledWith('close');
    });
  });

  describe('Geolocation', () => {
    const defaultConfig = {};

    async function emitGeolocationRequest() {
      await new Promise<void>(resolve => {
        eventEmitter.emit('geolocationRequest', {
          origin: 'https://shopify.com',
        });
        setTimeout(resolve);
      });
    }

    describe('Android', () => {
      const originalPlatform = Platform.OS;

      beforeEach(() => {
        Platform.OS = 'android';
      });

      afterAll(() => {
        Platform.OS = originalPlatform;
      });

      it('subscribes to geolocation requests on Android when feature is enabled', () => {
        new ShopifyCheckoutSheet(defaultConfig);

        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'geolocationRequest',
          expect.any(Function),
        );
      });

      it('does not subscribe to geolocation requests when feature is disabled', () => {
        new ShopifyCheckoutSheet(defaultConfig, {
          handleGeolocationRequests: false,
        });

        expect(eventEmitter.addListener).not.toHaveBeenCalledWith(
          'geolocationRequest',
          expect.any(Function),
        );
      });

      it('handles geolocation permission grant correctly', async () => {
        const mockPermissions = {
          'android.permission.ACCESS_COARSE_LOCATION': 'granted',
          'android.permission.ACCESS_FINE_LOCATION': 'denied',
        };

        (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue(
          mockPermissions,
        );

        new ShopifyCheckoutSheet();

        await emitGeolocationRequest();

        expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith([
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.ACCESS_FINE_LOCATION',
        ]);
        expect(
          NativeModules.ShopifyCheckoutSheetKit.initiateGeolocationRequest,
        ).toHaveBeenCalledWith(true);
      });

      it('handles geolocation permission denial correctly', async () => {
        const mockPermissions = {
          'android.permission.ACCESS_COARSE_LOCATION': 'denied',
          'android.permission.ACCESS_FINE_LOCATION': 'denied',
        };

        (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue(
          mockPermissions,
        );

        new ShopifyCheckoutSheet();

        await emitGeolocationRequest();

        expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith([
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.ACCESS_FINE_LOCATION',
        ]);
        expect(
          NativeModules.ShopifyCheckoutSheetKit.initiateGeolocationRequest,
        ).toHaveBeenCalledWith(false);
      });

      it('cleans up geolocation callback on teardown', () => {
        const sheet = new ShopifyCheckoutSheet();
        const mockRemove = jest.fn();

        // @ts-expect-error
        sheet.geolocationCallback = {
          remove: mockRemove,
        };

        sheet.teardown();

        expect(mockRemove).toHaveBeenCalled();
      });
    });

    describe('iOS', () => {
      const originalPlatform = Platform.OS;

      beforeEach(() => {
        Platform.OS = 'ios';
      });

      afterAll(() => {
        Platform.OS = originalPlatform;
      });

      it('does not subscribe to geolocation requests', () => {
        new ShopifyCheckoutSheet();

        expect(eventEmitter.addListener).not.toHaveBeenCalledWith(
          'geolocationRequest',
          expect.any(Function),
        );
      });

      it('does not call the native function, even if an event is emitted', async () => {
        new ShopifyCheckoutSheet();

        await emitGeolocationRequest();

        expect(
          NativeModules.ShopifyCheckoutSheetKit.initiateGeolocationRequest,
        ).not.toHaveBeenCalled();
      });

      it('tears down gracefully', () => {
        const sheet = new ShopifyCheckoutSheet();

        expect(() => sheet.teardown()).not.toThrow();
      });
    });
  });
});
