/* eslint-disable no-new */

import {ShopifyCheckoutSheet} from '../src';
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

  const ShopifyCheckoutSheet = {
    version: '0.7.0',
    configure: jest.fn(),
    preload: jest.fn(),
    present: jest.fn(),
    getConfig: jest.fn(async () => exampleConfig),
    addEventListener: jest.fn(),
    removeEventListeners: jest.fn(),
  };

  return {
    NativeEventEmitter,
    NativeModules: {
      ShopifyCheckoutSheet,
    },
  };
});

describe('ShopifyCheckoutSheet', () => {
  afterEach(() => {
    NativeModules.ShopifyCheckoutSheet.configure.mockReset();
  });

  describe('instantiation', () => {
    it('calls `configure` with the specified config on instantiation', () => {
      new ShopifyCheckoutSheet(config);
      expect(NativeModules.ShopifyCheckoutSheet.configure).toHaveBeenCalledWith(
        config,
      );
    });

    it('does not call `configure` if no config was specified on instantiation', () => {
      new ShopifyCheckoutSheet();
      expect(
        NativeModules.ShopifyCheckoutSheet.configure,
      ).not.toHaveBeenCalled();
    });
  });

  describe('configure', () => {
    it('calls the `configure` on the Native Module', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.configure(config);
      expect(
        NativeModules.ShopifyCheckoutSheet.configure,
      ).toHaveBeenCalledTimes(1);
      expect(NativeModules.ShopifyCheckoutSheet.configure).toHaveBeenCalledWith(
        config,
      );
    });
  });

  describe('preload', () => {
    it('calls `preload` with a checkout URL', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.preload(checkoutUrl);
      expect(NativeModules.ShopifyCheckoutSheet.preload).toHaveBeenCalledTimes(
        1,
      );
      expect(NativeModules.ShopifyCheckoutSheet.preload).toHaveBeenCalledWith(
        checkoutUrl,
      );
    });
  });

  describe('present', () => {
    it('calls `present` with a checkout URL', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.present(checkoutUrl);
      expect(NativeModules.ShopifyCheckoutSheet.present).toHaveBeenCalledTimes(
        1,
      );
      expect(NativeModules.ShopifyCheckoutSheet.present).toHaveBeenCalledWith(
        checkoutUrl,
      );
    });
  });

  describe('getConfig', () => {
    it('returns the config from the Native Module', async () => {
      const instance = new ShopifyCheckoutSheet();
      await expect(instance.getConfig()).resolves.toStrictEqual({
        preloading: true,
      });
      expect(
        NativeModules.ShopifyCheckoutSheet.getConfig,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('addEventListener', () => {
    it('creates a new event listener for a specific event', () => {
      const instance = new ShopifyCheckoutSheet();
      const eventName = 'close';
      const callback = jest.fn();
      instance.addEventListener(eventName, callback);
      // @ts-expect-error
      expect(instance.eventEmitter.addListener).toHaveBeenCalledWith(
        eventName,
        callback,
      );
    });
  });

  describe('removeEventListeners', () => {
    it('Removes all listeners for a specific event', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.addEventListener('close', () => {});
      instance.addEventListener('close', () => {});
      instance.removeEventListeners('close');
      // @ts-expect-error
      expect(instance.eventEmitter.removeAllListeners).toHaveBeenCalledWith(
        'close',
      );
    });
  });
});
