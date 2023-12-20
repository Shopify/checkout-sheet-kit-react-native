/* eslint-disable no-new */

import {ShopifyCheckoutKit} from '../src';
import {ColorScheme, type Configuration} from '../src';
import {NativeModules} from 'react-native';

const checkoutUrl = 'https://shopify.com/checkout';
const config: Configuration = {
  colorScheme: ColorScheme.automatic,
};

jest.mock('react-native', () => {
  const NativeEventEmitter = jest.fn(() => ({
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  }));

  const exampleConfig = {
    preloading: true,
  };

  const ShopifyCheckoutKit = {
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
    NativeEventEmitter,
    NativeModules: {
      ShopifyCheckoutKit,
    },
  };
});

describe('ShopifyCheckoutKit', () => {
  afterEach(() => {
    NativeModules.ShopifyCheckoutKit.setConfig.mockReset();
  });

  describe('instantiation', () => {
    it('calls `setConfig` with the specified config on instantiation', () => {
      new ShopifyCheckoutKit(config);
      expect(NativeModules.ShopifyCheckoutKit.setConfig).toHaveBeenCalledWith(
        config,
      );
    });

    it('does not call `setConfig` if no config was specified on instantiation', () => {
      new ShopifyCheckoutKit();
      expect(NativeModules.ShopifyCheckoutKit.setConfig).not.toHaveBeenCalled();
    });
  });

  describe('setConfig', () => {
    it('calls the `setConfig` on the Native Module', () => {
      const instance = new ShopifyCheckoutKit();
      instance.setConfig(config);
      expect(NativeModules.ShopifyCheckoutKit.setConfig).toHaveBeenCalledTimes(
        1,
      );
      expect(NativeModules.ShopifyCheckoutKit.setConfig).toHaveBeenCalledWith(
        config,
      );
    });
  });

  describe('preload', () => {
    it('calls `preload` with a checkout URL', () => {
      const instance = new ShopifyCheckoutKit();
      instance.preload(checkoutUrl);
      expect(NativeModules.ShopifyCheckoutKit.preload).toHaveBeenCalledTimes(1);
      expect(NativeModules.ShopifyCheckoutKit.preload).toHaveBeenCalledWith(
        checkoutUrl,
      );
    });
  });

  describe('present', () => {
    it('calls `present` with a checkout URL', () => {
      const instance = new ShopifyCheckoutKit();
      instance.present(checkoutUrl);
      expect(NativeModules.ShopifyCheckoutKit.present).toHaveBeenCalledTimes(1);
      expect(NativeModules.ShopifyCheckoutKit.present).toHaveBeenCalledWith(
        checkoutUrl,
      );
    });
  });

  describe('getConfig', () => {
    it('returns the config from the Native Module', async () => {
      const instance = new ShopifyCheckoutKit();
      await expect(instance.getConfig()).resolves.toStrictEqual({
        preloading: true,
      });
      expect(NativeModules.ShopifyCheckoutKit.getConfig).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('addEventListener', () => {
    it('creates a new event listener for a specific event', () => {
      const instance = new ShopifyCheckoutKit();
      const eventName = 'close';
      const callback = jest.fn();
      instance.addEventListener(eventName, callback);
      // @ts-expect-error
      expect(ShopifyCheckoutKit.eventEmitter.addListener).toHaveBeenCalledWith(
        eventName,
        callback,
      );
    });
  });

  describe('removeEventListeners', () => {
    it('Removes all listeners for a specific event', () => {
      const instance = new ShopifyCheckoutKit();
      instance.addEventListener('close', () => {});
      instance.addEventListener('close', () => {});
      instance.removeEventListeners('close');
      expect(
        // @ts-expect-error
        ShopifyCheckoutKit.eventEmitter.removeAllListeners,
      ).toHaveBeenCalledWith('close');
    });
  });
});
