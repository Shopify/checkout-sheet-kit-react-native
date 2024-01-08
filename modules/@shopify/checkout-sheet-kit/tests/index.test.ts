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
    NativeEventEmitter,
    NativeModules: {
      ShopifyCheckoutSheetKit,
    },
  };
});

describe('ShopifyCheckoutSheetKit', () => {
  afterEach(() => {
    NativeModules.ShopifyCheckoutSheetKit.setConfig.mockReset();
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
      expect(
        // @ts-expect-error
        ShopifyCheckoutSheet.eventEmitter.addListener,
      ).toHaveBeenCalledWith(eventName, callback);
    });
  });

  describe('removeEventListeners', () => {
    it('Removes all listeners for a specific event', () => {
      const instance = new ShopifyCheckoutSheet();
      instance.addEventListener('close', () => {});
      instance.addEventListener('close', () => {});
      instance.removeEventListeners('close');
      expect(
        // @ts-expect-error
        ShopifyCheckoutSheet.eventEmitter.removeAllListeners,
      ).toHaveBeenCalledWith('close');
    });
  });
});
