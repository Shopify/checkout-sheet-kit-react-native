import React, {PropsWithChildren, useCallback, useMemo, useRef} from 'react';
import {EmitterSubscription} from 'react-native';
import {ShopifyCheckoutKit} from './index';
import type {CheckoutEvent, Configuration} from './index.d';

type Maybe<T> = T | undefined;

interface Context {
  addEventListener: (
    event: CheckoutEvent,
    callback: () => void,
  ) => Maybe<EmitterSubscription>;
  getConfig: () => Promise<Configuration | undefined>;
  removeEventListeners: (event: CheckoutEvent) => void;
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

  const addEventListener = useCallback(
    (
      eventName: CheckoutEvent,
      callback: () => void,
    ): EmitterSubscription | undefined => {
      return instance.current?.eventEmitter.addListener(eventName, callback);
    },
    [],
  );

  const removeEventListeners = useCallback((eventName: CheckoutEvent) => {
    instance.current?.eventEmitter.removeAllListeners(eventName);
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
