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

import React, {useCallback, useMemo, useRef, useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {type EmitterSubscription} from 'react-native';
import {ShopifyCheckoutSheet} from './index';
import type {Features} from './index.d';
import type {
  AddEventListener,
  RemoveEventListeners,
  CheckoutEvent,
  Configuration,
} from './index.d';

type Maybe<T> = T | undefined;

interface Context {
  acceleratedCheckoutsAvailable: boolean;
  addEventListener: AddEventListener;
  getConfig: () => Promise<Configuration | undefined>;
  setConfig: (config: Configuration) => void;
  removeEventListeners: RemoveEventListeners;
  preload: (checkoutUrl: string) => void;
  present: (checkoutUrl: string) => void;
  dismiss: () => void;
  invalidate: () => void;
  version: Maybe<string>;
}

const ShopifyCheckoutSheetContext = React.createContext<Context>(
  null as unknown as Context,
);

interface Props {
  features?: Partial<Features>;
  configuration?: Configuration;
}

export function ShopifyCheckoutSheetProvider({
  features,
  configuration,
  children,
}: PropsWithChildren<Props>) {
  const [acceleratedCheckoutsAvailable, setAcceleratedCheckoutsAvailable] =
    useState(false);
  const instance = useRef<ShopifyCheckoutSheet | null>(null);

  if (!instance.current) {
    instance.current = new ShopifyCheckoutSheet(configuration, features);
  }

  useEffect(() => {
    async function configureCheckoutKit() {
      if (!instance.current || !configuration) {
        return;
      }

      if (configuration.acceleratedCheckouts) {
        const ready = await instance.current?.configureAcceleratedCheckouts(
          configuration.acceleratedCheckouts,
        );
        setAcceleratedCheckoutsAvailable(ready);
      }

      instance.current?.setConfig(configuration);
    }

    configureCheckoutKit();
  }, [configuration]);

  const addEventListener: AddEventListener = useCallback(
    (eventName, callback): EmitterSubscription | undefined => {
      return instance.current?.addEventListener(eventName, callback);
    },
    [],
  );

  const removeEventListeners = useCallback((eventName: CheckoutEvent) => {
    instance.current?.removeEventListeners(eventName);
  }, []);

  const present = useCallback((checkoutUrl: string) => {
    if (checkoutUrl) {
      instance.current?.present(checkoutUrl);
    }
  }, []);

  const preload = useCallback((checkoutUrl: string) => {
    if (checkoutUrl) {
      instance.current?.preload(checkoutUrl);
    }
  }, []);

  const invalidate = useCallback(() => {
    instance.current?.invalidate();
  }, []);

  const dismiss = useCallback(() => {
    instance.current?.dismiss();
  }, []);

  const setConfig = useCallback((config: Configuration) => {
    instance.current?.setConfig(config);
  }, []);

  const getConfig = useCallback(async () => {
    return instance.current?.getConfig();
  }, []);

  const context = useMemo((): Context => {
    return {
      acceleratedCheckoutsAvailable,
      addEventListener,
      dismiss,
      setConfig,
      getConfig,
      preload,
      present,
      invalidate,
      removeEventListeners,
      version: instance.current?.version,
    };
  }, [
    acceleratedCheckoutsAvailable,
    addEventListener,
    dismiss,
    removeEventListeners,
    getConfig,
    setConfig,
    preload,
    present,
    invalidate,
  ]);

  return (
    <ShopifyCheckoutSheetContext.Provider value={context}>
      {children}
    </ShopifyCheckoutSheetContext.Provider>
  );
}

export function useShopifyCheckoutSheet() {
  const context = React.useContext(ShopifyCheckoutSheetContext);
  if (!context) {
    throw new Error(
      'useShopifyCheckoutSheet must be used from within a ShopifyCheckoutSheetContext',
    );
  }
  return context;
}

export default ShopifyCheckoutSheetContext;
