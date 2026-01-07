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
import {
  type EmitterSubscription,
  UIManager,
  findNodeHandle,
} from 'react-native';
import {ShopifyCheckoutSheet} from './index';
import type {Features} from './index.d';
import type {
  AddEventListener,
  RemoveEventListeners,
  CheckoutEvent,
  Configuration,
  CheckoutOptions,
} from './index.d';

type Maybe<T> = T | undefined;

interface Context {
  acceleratedCheckoutsAvailable: boolean;
  addEventListener: AddEventListener;
  getConfig: () => Promise<Configuration | undefined>;
  setConfig: (config: Configuration) => Promise<void>;
  removeEventListeners: RemoveEventListeners;
  preload: (checkoutUrl: string, options?: CheckoutOptions) => void;
  present: (checkoutUrl: string, options?: CheckoutOptions) => void;
  dismiss: () => void;
  invalidate: () => void;
  version: Maybe<string>;
  respondToEvent: (eventId: string, response: any) => Promise<boolean>;
}

interface InternalContext extends Context {
  registerWebView: (ref: React.RefObject<any>) => void;
  unregisterWebView: () => void;
}

interface WebviewState {
  registerWebView: (ref: React.RefObject<any>) => void;
  unregisterWebView: () => void;
  respondToEvent: (eventId: string, response: any) => Promise<boolean>;
}

function useWebview(): WebviewState {
  const webViewRef = useRef<React.RefObject<any> | null>(null);

  const registerWebView = useCallback((ref: React.RefObject<any>) => {
    webViewRef.current = ref;
  }, []);

  const unregisterWebView = useCallback(() => {
    webViewRef.current = null;
  }, []);

  const respondToEvent = useCallback(
    async (eventId: string, response: any): Promise<boolean> => {
      if (!webViewRef.current?.current) {
        return false;
      }
      try {
        const handle = findNodeHandle(webViewRef.current.current);
        if (!handle) {
          return false;
        }
        const viewConfig = UIManager.getViewManagerConfig('RCTCheckoutWebView');
        const commandId =
          viewConfig?.Commands?.respondToEvent ?? 'respondToEvent';
        UIManager.dispatchViewManagerCommand(handle, commandId, [
          eventId,
          JSON.stringify(response),
        ]);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  return {registerWebView, unregisterWebView, respondToEvent};
}

const ShopifyCheckoutSheetContext = React.createContext<InternalContext>(
  null as unknown as InternalContext,
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
  const webview = useWebview();

  if (!instance.current) {
    instance.current = new ShopifyCheckoutSheet(configuration, features);
  }

  useEffect(() => {
    async function configureCheckoutKit() {
      if (!instance.current || !configuration) {
        return;
      }

      await instance.current?.setConfig(configuration);
      const isAvailable =
        await instance.current.isAcceleratedCheckoutAvailable();
      setAcceleratedCheckoutsAvailable(isAvailable);
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

  const present = useCallback(
    (checkoutUrl: string, options?: CheckoutOptions) => {
      if (checkoutUrl) {
        instance.current?.present(checkoutUrl, options);
      }
    },
    [],
  );

  const preload = useCallback(
    (checkoutUrl: string, options?: CheckoutOptions) => {
      if (checkoutUrl) {
        instance.current?.preload(checkoutUrl, options);
      }
    },
    [],
  );

  const invalidate = useCallback(() => {
    instance.current?.invalidate();
  }, []);

  const dismiss = useCallback(() => {
    instance.current?.dismiss();
  }, []);

  const setConfig = useCallback(async (config: Configuration) => {
    await instance.current?.setConfig(config);
  }, []);

  const getConfig = useCallback(async () => {
    return instance.current?.getConfig();
  }, []);

  const context = useMemo((): InternalContext => {
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
      registerWebView: webview.registerWebView,
      unregisterWebView: webview.unregisterWebView,
      respondToEvent: webview.respondToEvent,
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
    webview.registerWebView,
    webview.unregisterWebView,
    webview.respondToEvent,
  ]);

  return (
    <ShopifyCheckoutSheetContext.Provider value={context}>
      {children}
    </ShopifyCheckoutSheetContext.Provider>
  );
}

export function useShopifyCheckoutSheet(): Context {
  const context = React.useContext(ShopifyCheckoutSheetContext);
  if (!context) {
    throw new Error(
      'useShopifyCheckoutSheet must be used from within a ShopifyCheckoutSheetContext',
    );
  }
  return useMemo(() => {
    const {registerWebView, unregisterWebView, ...publicContext} = context;
    return publicContext;
  }, [context]);
}

export function useWebviewRegistration(webViewRef: React.RefObject<any>) {
  const context = React.useContext(ShopifyCheckoutSheetContext);
  if (!context) {
    throw new Error(
      'useWebviewRegistration must be used within ShopifyCheckoutSheetProvider',
    );
  }

  useEffect(() => {
    context.registerWebView(webViewRef);
    return () => context.unregisterWebView();
  }, [context, webViewRef]);
}

export function useShopifyEvent(eventId: string) {
  const context = React.useContext(ShopifyCheckoutSheetContext);

  const respondWith = useCallback(
    async (response: any) => {
      if (!context) {
        return false;
      }
      return await context.respondToEvent(eventId, response);
    },
    [eventId, context],
  );

  return {
    id: eventId,
    respondWith,
  };
}

export default ShopifyCheckoutSheetContext;
