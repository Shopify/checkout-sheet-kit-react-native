/* eslint-disable no-new */
/* eslint-disable no-console */

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
  AcceleratedCheckoutWallet,
  RenderState,
} from '../src';
import {
  ColorScheme,
  CheckoutNativeErrorType,
  type Configuration,
  type AcceleratedCheckoutConfiguration,
} from '../src';
import type {ApplePayContactField} from '../src/index.d';
import {NativeModules, PermissionsAndroid, Platform} from 'react-native';

const checkoutUrl = 'https://shopify.com/checkout';
const config: Configuration = {
  colorScheme: ColorScheme.automatic,
};

jest.mock('react-native');

global.console = {
  ...global.console,
  error: jest.fn(),
  warn: jest.fn(),
};

describe('Exports', () => {
  describe('AcceleratedCheckoutWallet enum', () => {
    it('exports correct wallet types', () => {
      expect(AcceleratedCheckoutWallet.shopPay).toBe('shopPay');
      expect(AcceleratedCheckoutWallet.applePay).toBe('applePay');
    });
  });

  describe('RenderState enum', () => {
    it('exports correct render states', () => {
      expect(RenderState.Loading).toBe('loading');
      expect(RenderState.Rendered).toBe('rendered');
      expect(RenderState.Error).toBe('error');
    });
  });
});

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
      ).toHaveBeenCalledWith(checkoutUrl, undefined);
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
      ).toHaveBeenCalledWith(checkoutUrl, undefined);
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

    it('throws an error when an unhandled event is received', () => {
      const instance = new ShopifyCheckoutSheet();
      const eventName = 'unknownEvent';
      const callback = jest.fn();

      expect(() => {
        // @ts-expect-error Testing runtime check for invalid event
        instance.addEventListener(eventName, callback);
      }).toThrow('Unhandled event "unknownEvent" received');
    });

    describe('Completed Event', () => {
      it('parses complete event string data as JSON', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'complete';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'complete',
          expect.any(Function),
        );
        eventEmitter.emit(
          'complete',
          JSON.stringify({orderConfirmation: {order: {id: 'test-id'}}, cart: {}}),
        );
        expect(callback).toHaveBeenCalledWith({orderConfirmation: {order: {id: 'test-id'}}, cart: {}});
      });

      it('parses complete event JSON data', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'complete';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'complete',
          expect.any(Function),
        );
        eventEmitter.emit('complete', {orderConfirmation: {order: {id: 'test-id'}}, cart: {}});
        expect(callback).toHaveBeenCalledWith({orderConfirmation: {order: {id: 'test-id'}}, cart: {}});
      });

      it('parses complete event with realistic data structure', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'complete';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);

        const realisticEvent = {
          orderConfirmation: {
            isFirstOrder: false,
            number: 'EVKEJE589',
            order: {
              id: 'gid://shopify/OrderIdentity/55'
            }
          },
          cart: {
            id: 'hWN4rcG3B0eUb77ctZBcUovR',
            lines: [{
              id: '85067e24248ffaba6253819534197aa2',
              quantity: 1,
              merchandise: {
                id: 'gid://shopify/ProductVariant/2',
                title: 'Heavy Duty Bronze Computer',
                product: {
                  id: 'gid://shopify/Product/1',
                  title: 'Heavy Duty Bronze Computer'
                },
                selectedOptions: [
                  { name: 'Size', value: 'Long' },
                  { name: 'Color', value: 'Violet' }
                ]
              },
              cost: {
                amountPerQuantity: { amount: '157.00', currencyCode: 'CAD' },
                subtotalAmount: { amount: '157.00', currencyCode: 'CAD' },
                totalAmount: { amount: '157.00', currencyCode: 'CAD' }
              },
              discountAllocations: []
            }],
            cost: {
              subtotalAmount: { amount: '157.00', currencyCode: 'CAD' },
              totalAmount: { amount: '170.54', currencyCode: 'CAD' }
            },
            buyerIdentity: {
              countryCode: 'US'
            },
            deliveryGroups: [{
              groupType: 'ONE_TIME_PURCHASE',
              deliveryAddress: {
                country: 'US',
                countryCodeV2: 'US'
              },
              deliveryOptions: [{
                handle: 'e81115f7e41eaaa6fa84a1595d3ea1ee-8de1713aa96dd5b5d153a92a7d88724d',
                title: 'Standard International',
                deliveryMethodType: 'SHIPPING',
                estimatedCost: { amount: '0.00', currencyCode: 'CAD' }
              }],
              selectedDeliveryOption: {
                handle: 'e81115f7e41eaaa6fa84a1595d3ea1ee-8de1713aa96dd5b5d153a92a7d88724d',
                title: 'Standard International',
                deliveryMethodType: 'SHIPPING',
                estimatedCost: { amount: '0.00', currencyCode: 'CAD' }
              }
            }],
            discountCodes: [],
            appliedGiftCards: [],
            discountAllocations: [],
            delivery: {
              addresses: [{
                address: {
                  countryCode: 'US'
                }
              }]
            }
          }
        };

        eventEmitter.emit('complete', realisticEvent);
        expect(callback).toHaveBeenCalledWith(realisticEvent);
      });

      it('prints an error if the complete event data cannot be parsed', () => {
        const mock = jest.spyOn(global.console, 'error');
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'complete';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'complete',
          expect.any(Function),
        );
        const invalidData = 'INVALID JSON';
        eventEmitter.emit('complete', invalidData);
        expect(mock).toHaveBeenCalledWith(
          expect.any(LifecycleEventParseError),
          invalidData,
        );
      });
    });

    describe('Started Event', () => {
      it('parses start event string data as JSON', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'start';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'start',
          expect.any(Function),
        );
        eventEmitter.emit(
          'start',
          JSON.stringify({cart: {id: 'test-cart-id'}}),
        );
        expect(callback).toHaveBeenCalledWith({cart: {id: 'test-cart-id'}});
      });

      it('parses start event JSON data', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'start';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'start',
          expect.any(Function),
        );
        eventEmitter.emit('start', {cart: {id: 'test-cart-id'}});
        expect(callback).toHaveBeenCalledWith({cart: {id: 'test-cart-id'}});
      });

      it('parses start event with realistic cart data structure', () => {
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'start';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);

        const realisticEvent = {
          cart: {
            id: 'hWN4rcG3B0eUb77ctZBcUovR',
            lines: [{
              id: '85067e24248ffaba6253819534197aa2',
              quantity: 1,
              merchandise: {
                id: 'gid://shopify/ProductVariant/2',
                title: 'Heavy Duty Bronze Computer',
                product: {
                  id: 'gid://shopify/Product/1',
                  title: 'Heavy Duty Bronze Computer'
                },
                selectedOptions: [
                  { name: 'Size', value: 'Long' },
                  { name: 'Color', value: 'Violet' }
                ]
              },
              cost: {
                amountPerQuantity: { amount: '157.00', currencyCode: 'CAD' },
                subtotalAmount: { amount: '157.00', currencyCode: 'CAD' },
                totalAmount: { amount: '157.00', currencyCode: 'CAD' }
              },
              discountAllocations: []
            }],
            cost: {
              subtotalAmount: { amount: '157.00', currencyCode: 'CAD' },
              totalAmount: { amount: '170.54', currencyCode: 'CAD' }
            },
            buyerIdentity: {
              countryCode: 'US'
            },
            deliveryGroups: [],
            discountCodes: [],
            appliedGiftCards: [],
            discountAllocations: [],
            delivery: {
              addresses: []
            }
          }
        };

        eventEmitter.emit('start', JSON.stringify(realisticEvent));
        expect(callback).toHaveBeenCalledWith(realisticEvent);
      });

      it('prints an error if the start event data cannot be parsed', () => {
        const mock = jest.spyOn(global.console, 'error');
        const instance = new ShopifyCheckoutSheet();
        const eventName = 'start';
        const callback = jest.fn();
        instance.addEventListener(eventName, callback);
        NativeModules.ShopifyCheckoutSheetKit.addEventListener(
          eventName,
          callback,
        );
        expect(eventEmitter.addListener).toHaveBeenCalledWith(
          'start',
          expect.any(Function),
        );
        const invalidData = 'INVALID JSON';
        eventEmitter.emit('start', invalidData);
        expect(mock).toHaveBeenCalledWith(
          expect.any(LifecycleEventParseError),
          invalidData,
        );
      });
    });

    describe('Submit Start Event', () => {
      it('parses submitStart event data', () => {
        const instance = new ShopifyCheckoutSheet();
        const callback = jest.fn();
        instance.addEventListener('submitStart', callback);

        eventEmitter.emit('submitStart', {
          id: 'test-event-id',
          method: 'checkout.submitStart',
          cart: {id: 'test-cart-id'},
          checkout: {id: 'checkout-session-123'},
        });

        expect(callback).toHaveBeenCalledWith({
          id: 'test-event-id',
          method: 'checkout.submitStart',
          cart: {id: 'test-cart-id'},
          checkout: {id: 'checkout-session-123'},
        });
      });

      it('prints an error if the submitStart event data cannot be parsed', () => {
        const mock = jest.spyOn(global.console, 'error');
        const instance = new ShopifyCheckoutSheet();
        const callback = jest.fn();
        instance.addEventListener('submitStart', callback);

        eventEmitter.emit('submitStart', 'INVALID JSON');

        expect(mock).toHaveBeenCalledWith(
          expect.any(LifecycleEventParseError),
          'INVALID JSON',
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
        message: 'Cart Completed',
        code: CheckoutErrorCode.cartCompleted,
        recoverable: false,
      };

      it.each([
        {error: internalError, constructor: InternalError},
        {error: configError, constructor: ConfigurationError},
        {error: clientError, constructor: CheckoutClientError},
        {error: networkError, constructor: CheckoutHTTPError},
        {error: expiredError, constructor: CheckoutExpiredError},
      ])(
        `correctly parses error $error`,
        ({
          error,
          constructor,
        }: {
          error: any;
          constructor: new (...args: any[]) => any;
        }) => {
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
        },
      );

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

      describe('error code mapping from native UPPER_SNAKE_CASE codes', () => {
        it.each([
          // New checkout.error event codes from native (UPPER_SNAKE_CASE)
          {
            nativeCode: 'STOREFRONT_PASSWORD_REQUIRED',
            expectedCode: CheckoutErrorCode.storefrontPasswordRequired,
          },
          {
            nativeCode: 'CART_COMPLETED',
            expectedCode: CheckoutErrorCode.cartCompleted,
          },
          {
            nativeCode: 'INVALID_CART',
            expectedCode: CheckoutErrorCode.invalidCart,
          },
          // Existing codes in lower_snake_case should still work
          {
            nativeCode: 'storefront_password_required',
            expectedCode: CheckoutErrorCode.storefrontPasswordRequired,
          },
          {
            nativeCode: 'cart_completed',
            expectedCode: CheckoutErrorCode.cartCompleted,
          },
        ])(
          'maps native code "$nativeCode" to CheckoutErrorCode.$expectedCode',
          ({nativeCode, expectedCode}) => {
            const instance = new ShopifyCheckoutSheet();
            const callback = jest.fn();
            instance.addEventListener('error', callback);

            const error = {
              __typename: CheckoutNativeErrorType.ConfigurationError,
              message: 'Test error',
              code: nativeCode, // Raw string from native, not enum
              recoverable: false,
            };

            eventEmitter.emit('error', error);

            const calledWith = callback.mock.calls[0][0];
            expect(calledWith.code).toBe(expectedCode);
          },
        );
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

        (
          PermissionsAndroid.requestMultiple as unknown as {
            mockResolvedValue: (v: any) => void;
          }
        ).mockResolvedValue(mockPermissions);

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

        (
          PermissionsAndroid.requestMultiple as unknown as {
            mockResolvedValue: (v: any) => void;
          }
        ).mockResolvedValue(mockPermissions);

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

  describe('Feature Management', () => {
    it('returns true for undefined features (feature fallback)', () => {
      // Create instance without any features to test fallback
      const instance = new ShopifyCheckoutSheet(undefined, {});

      // Access private method via type assertion to test featureEnabled
      const featureEnabled = (instance as any).featureEnabled(
        'handleGeolocationRequests',
      );
      expect(featureEnabled).toBe(true);
    });

    it('returns false when feature is explicitly disabled', () => {
      // Create instance with feature explicitly disabled
      const instance = new ShopifyCheckoutSheet(undefined, {
        handleGeolocationRequests: false,
      });

      // Access private method via type assertion to test featureEnabled
      const featureEnabled = (instance as any).featureEnabled(
        'handleGeolocationRequests',
      );
      expect(featureEnabled).toBe(false);
    });

    it('returns true when feature is explicitly enabled', () => {
      // Create instance with feature explicitly enabled
      const instance = new ShopifyCheckoutSheet(undefined, {
        handleGeolocationRequests: true,
      });

      // Access private method via type assertion to test featureEnabled
      const featureEnabled = (instance as any).featureEnabled(
        'handleGeolocationRequests',
      );
      expect(featureEnabled).toBe(true);
    });
  });

  describe('LifecycleEventParseError', () => {
    it('creates error without Error.captureStackTrace', () => {
      const originalCaptureStackTrace = Error.captureStackTrace;
      delete (Error as any).captureStackTrace;

      const error = new LifecycleEventParseError('test message');
      expect(error.name).toBe('LifecycleEventParseError');
      expect(error.message).toBe('test message');

      // Restore
      if (originalCaptureStackTrace) {
        Error.captureStackTrace = originalCaptureStackTrace;
      }
    });

    it('creates error with Error.captureStackTrace', () => {
      const mockCaptureStackTrace = jest.fn();
      Error.captureStackTrace = mockCaptureStackTrace;

      const error = new LifecycleEventParseError('test message');
      expect(error.name).toBe('LifecycleEventParseError');
      expect(mockCaptureStackTrace).toHaveBeenCalledWith(
        error,
        LifecycleEventParseError,
      );
    });
  });

  describe('Accelerated Checkout', () => {
    const acceleratedConfig: AcceleratedCheckoutConfiguration = {
      storefrontDomain: 'test-shop.myshopify.com',
      storefrontAccessToken: 'shpat_test_token',
      customer: {
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        accessToken: 'customer-access-token',
      },
      wallets: {
        applePay: {
          contactFields: ['email', 'phone'] as ApplePayContactField[],
          merchantIdentifier: 'merchant.com.test',
        },
      },
    };

    beforeEach(() => {
      Platform.OS = 'ios';
      Platform.Version = '17.0';
      NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts.mockReset();
      NativeModules.ShopifyCheckoutSheetKit.isAcceleratedCheckoutAvailable.mockReset();
    });

    describe('configureAcceleratedCheckouts', () => {
      it('calls native configureAcceleratedCheckouts with correct parameters on iOS', async () => {
        const instance = new ShopifyCheckoutSheet();
        NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts.mockResolvedValue(
          true,
        );

        const result =
          await instance.configureAcceleratedCheckouts(acceleratedConfig);

        expect(result).toBe(true);
        expect(
          NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts,
        ).toHaveBeenCalledWith(
          'test-shop.myshopify.com',
          'shpat_test_token',
          'test@example.com',
          '+1234567890',
          'customer-access-token',
          'merchant.com.test',
          ['email', 'phone'],
        );
      });

      it('calls native configureAcceleratedCheckouts with null customer data when not provided', async () => {
        const instance = new ShopifyCheckoutSheet();
        const minimalConfig = {
          storefrontDomain: 'test-shop.myshopify.com',
          storefrontAccessToken: 'shpat_test_token',
        };
        NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts.mockResolvedValue(
          true,
        );

        await instance.configureAcceleratedCheckouts(minimalConfig);

        expect(
          NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts,
        ).toHaveBeenCalledWith(
          'test-shop.myshopify.com',
          'shpat_test_token',
          null,
          null,
          null,
          null,
          [],
        );
      });

      it('returns false on Android', async () => {
        Platform.OS = 'android';
        const instance = new ShopifyCheckoutSheet();

        const result =
          await instance.configureAcceleratedCheckouts(acceleratedConfig);

        expect(result).toBe(false);
        expect(
          NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts,
        ).not.toHaveBeenCalled();
      });

      it('validates required storefrontDomain', async () => {
        const instance = new ShopifyCheckoutSheet();
        const invalidConfig = {
          ...acceleratedConfig,
          storefrontDomain: '',
        };
        const expectedError = new Error('`storefrontDomain` is required');

        await expect(
          instance.configureAcceleratedCheckouts(invalidConfig),
        ).resolves.toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          '[ShopifyCheckoutSheetKit] Failed to configure accelerated checkouts with',
          expectedError,
        );
      });

      it('validates required storefrontAccessToken', async () => {
        const instance = new ShopifyCheckoutSheet();
        const invalidConfig = {
          ...acceleratedConfig,
          storefrontAccessToken: '',
        };

        const expectedError = new Error('`storefrontAccessToken` is required');

        await expect(
          instance.configureAcceleratedCheckouts(invalidConfig),
        ).resolves.toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          '[ShopifyCheckoutSheetKit] Failed to configure accelerated checkouts with',
          expectedError,
        );
      });

      it('validates required merchantIdentifier when Apple Pay is configured', async () => {
        const instance = new ShopifyCheckoutSheet();
        const invalidConfig = {
          ...acceleratedConfig,
          wallets: {
            applePay: {
              contactFields: ['email'] as ApplePayContactField[],
              merchantIdentifier: '',
            },
          },
        };

        const expectedError = new Error(
          '`wallets.applePay.merchantIdentifier` is required',
        );

        await expect(
          instance.configureAcceleratedCheckouts(invalidConfig),
        ).resolves.toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          '[ShopifyCheckoutSheetKit] Failed to configure accelerated checkouts with',
          expectedError,
        );
      });

      it('validates required contactFields when Apple Pay is configured', async () => {
        const instance = new ShopifyCheckoutSheet();
        const invalidConfig = {
          ...acceleratedConfig,
          wallets: {
            applePay: {
              contactFields: ['invalid'],
              merchantIdentifier: 'merchant.test.com',
            },
          },
        };

        const expectedError = new Error(
          `'wallets.applePay.contactFields' contains unexpected values. Expected "email, phone", received "invalid"`,
        );

        await expect(
          instance.configureAcceleratedCheckouts(invalidConfig as any),
        ).resolves.toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          '[ShopifyCheckoutSheetKit] Failed to configure accelerated checkouts with',
          expectedError,
        );
      });

      it('does not throw when Apple Pay wallet is not configured', async () => {
        const instance = new ShopifyCheckoutSheet();
        const configWithoutApplePay = {
          storefrontDomain: 'test-shop.myshopify.com',
          storefrontAccessToken: 'shpat_test_token',
        };
        NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts.mockResolvedValue(
          true,
        );

        await expect(
          instance.configureAcceleratedCheckouts(configWithoutApplePay),
        ).resolves.toBe(true);
      });
    });

    describe('isAcceleratedCheckoutAvailable', () => {
      it('calls native isAcceleratedCheckoutAvailable on iOS', async () => {
        const instance = new ShopifyCheckoutSheet();
        NativeModules.ShopifyCheckoutSheetKit.isAcceleratedCheckoutAvailable.mockResolvedValue(
          true,
        );

        const result = await instance.isAcceleratedCheckoutAvailable();

        expect(result).toBe(true);
        expect(
          NativeModules.ShopifyCheckoutSheetKit.isAcceleratedCheckoutAvailable,
        ).toHaveBeenCalledTimes(1);
      });

      it('returns false on Android', async () => {
        Platform.OS = 'android';
        const instance = new ShopifyCheckoutSheet();

        const result = await instance.isAcceleratedCheckoutAvailable();

        expect(result).toBe(false);
        expect(
          NativeModules.ShopifyCheckoutSheetKit.isAcceleratedCheckoutAvailable,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
