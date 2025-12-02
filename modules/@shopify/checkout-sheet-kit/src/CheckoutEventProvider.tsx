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

import React, {createContext, useContext, useRef, useCallback} from 'react';
import {UIManager, findNodeHandle} from 'react-native';
import type {
  CheckoutAddressChangeStart,
  CheckoutAddressChangeStartResponse,
  CheckoutPaymentMethodChangeStart,
  CheckoutPaymentMethodChangeStartResponse,
} from './events';

interface CheckoutEventContextType {
  registerWebView: (webViewRef: React.RefObject<any>) => void;
  unregisterWebView: () => void;
  respondToEvent: (eventId: string, response: any) => Promise<boolean>;
}

const CheckoutEventContext = createContext<CheckoutEventContextType | null>(
  null,
);

export interface CheckoutEventProviderProps {
  children: React.ReactNode;
}

/**
 * CheckoutEventProvider manages active checkout events and provides methods to respond to them.
 * This provider maintains references to active events and the webview to enable native callbacks.
 */
export const CheckoutEventProvider = ({
  children,
}: CheckoutEventProviderProps) => {
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

        // Call the native method to respond to the event
        // Native side will handle event lookup and validation
        UIManager.dispatchViewManagerCommand(handle, commandId, [
          eventId,
          JSON.stringify(response),
        ]);

        return true;
      } catch (error) {
        return false;
      }
    },
    [],
  );

  const contextValue: CheckoutEventContextType = {
    registerWebView,
    unregisterWebView,
    respondToEvent,
  };

  return (
    <CheckoutEventContext.Provider value={contextValue}>
      {children}
    </CheckoutEventContext.Provider>
  );
};

/**
 * Hook to access checkout event functionality
 */
export function useCheckoutEvents(): CheckoutEventContextType | null {
  const context = useContext(CheckoutEventContext);
  return context;
}

/**
 * Register Event + Response schema pairs for respondWith typings
 */
type Pairs =
  | [CheckoutAddressChangeStart, CheckoutAddressChangeStartResponse]
  | [
      CheckoutPaymentMethodChangeStart,
      CheckoutPaymentMethodChangeStartResponse,
    ];

type MapEventToResponse<T extends Pairs = Pairs> = {[K in T[0]['type']]: T[1]};
type EventNames = keyof MapEventToResponse;

type Event<T extends EventNames> = MapEventToResponse[T];

type RespondableEvent<T extends EventNames = EventNames> = {
  id: string;
  type: T;
  respondWith: (response: Event<T>) => Promise<boolean>;
};
/**
 * Enhanced hook for working with specific Shopify checkout events
 * @param eventId The ID of the event to work with
 */
export function useShopifyEvent<T extends EventNames>(
  eventId: string,
  type: T,
): RespondableEvent<T> {
  const eventContext = useCheckoutEvents();

  return {
    id: eventId,
    type,
    respondWith: useCallback(
      async response => {
        if (!eventContext) {
          return false;
        }
        return await eventContext.respondToEvent(eventId, response);
      },
      [eventId, eventContext],
    ),
  };
}
