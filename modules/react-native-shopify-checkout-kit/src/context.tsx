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

import React, {PropsWithChildren, useCallback, useMemo, useRef} from 'react';
import {EmitterSubscription} from 'react-native';
import {ShopifyCheckoutKit} from './index';
import type {
  AddEventListener,
  RemoveEventListeners,
  CheckoutEvent,
  Configuration,
} from './index.d';

type Maybe<T> = T | undefined;

interface Context {
  addEventListener: AddEventListener;
  getConfig: () => Promise<Configuration | undefined>;
  removeEventListeners: RemoveEventListeners;
  preload: (checkoutUrl: string) => void;
  present: (checkoutUrl: string) => void;
  configure: (config: Configuration) => void;
  version: Maybe<string>;
}

const noop = () => undefined;

const ShopifyCheckoutKitContext = React.createContext<Context>({
  addEventListener: noop,
  removeEventListeners: noop,
  configure: noop,
  getConfig: async () => undefined,
  preload: noop,
  present: noop,
  version: undefined,
});

interface Props {
  configuration?: Configuration;
}

export function ShopifyCheckoutKitProvider({
  configuration,
  children,
}: PropsWithChildren<Props>) {
  const instance = useRef<ShopifyCheckoutKit | null>(null);

  if (!instance.current) {
    instance.current = new ShopifyCheckoutKit(configuration);
  }

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

  const configure = useCallback((config: Configuration) => {
    instance.current?.configure(config);
  }, []);

  const getConfig = useCallback(async () => {
    return instance.current?.getConfig();
  }, []);

  const context = useMemo((): Context => {
    return {
      addEventListener,
      configure,
      getConfig,
      preload,
      present,
      removeEventListeners,
      version: instance.current?.version,
    };
  }, [
    addEventListener,
    removeEventListeners,
    configure,
    getConfig,
    preload,
    present,
  ]);

  return (
    <ShopifyCheckoutKitContext.Provider value={context}>
      {children}
    </ShopifyCheckoutKitContext.Provider>
  );
}

export function useShopifyCheckoutKit() {
  return React.useContext(ShopifyCheckoutKitContext);
}

export default ShopifyCheckoutKitContext;
