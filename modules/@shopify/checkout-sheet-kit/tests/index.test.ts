/* eslint-disable no-new */

import {LifecycleEventParseError, ShopifyCheckoutSheet} from '../src';
import {ColorScheme, type Configuration} from '../src';
import {NativeModules} from 'react-native';

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
    getConfig: jest.fn(async () => exampleConfig),
    setConfig: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListeners: jest.fn(),
  };

  return {
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
        eventEmitter.emit('pixel', '{"someAttribute": 123');
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
        eventEmitter.emit('completed', 'INVALID JSON');
        expect(mock).toHaveBeenCalledWith(expect.any(LifecycleEventParseError));
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
});
