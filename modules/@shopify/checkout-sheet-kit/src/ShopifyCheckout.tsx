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

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useRef,
} from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useShopifyCheckoutSheet} from './context';
import type {EmitterSubscription} from 'react-native';

export interface ShopifyCheckoutProps {
  /** The checkout URL to load */
  url?: string;
  /** Authentication token for inline mode (optional - for demo purposes) */
  auth?: string;
  /** Display mode: 'popup' (default) | 'inline' */
  mode?: 'popup' | 'inline';
  /** Auto-resize height when in inline mode (default: true) */
  autoResizeHeight?: boolean;
  /** Custom styling for the container */
  style?: any;
  /** Called when checkout completes */
  onCompleted?: (event: any) => void;
  /** Called when checkout encounters an error */
  onError?: (error: any) => void;
  /** Called when checkout is closed/dismissed */
  onClose?: () => void;
  /** Called when checkout size changes (inline mode only) */
  onResize?: (height: number) => void;
}

export interface ShopifyCheckoutRef {
  /** Open the checkout (popup mode only) */
  open: () => void;
  /** Close/dismiss the checkout */
  close: () => void;
  /** Preload the checkout for better performance */
  preload: () => void;
}

// WebView Plugin Interface
export interface WebViewPlugin {
  WebView: any;
  createWebViewProps: (props: WebViewProps) => any;
}

interface WebViewProps {
  source: {uri: string};
  style?: any;
  onMessage?: (event: any) => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  injectedJavaScript?: string;
  onContentSizeChange?: (event: any) => void;
}

// Global plugin registry
let webViewPlugin: WebViewPlugin | null = null;

export function registerWebViewPlugin(plugin: WebViewPlugin) {
  webViewPlugin = plugin;
}

export function isWebViewAvailable(): boolean {
  return webViewPlugin !== null;
}

const ShopifyCheckout = forwardRef<ShopifyCheckoutRef, ShopifyCheckoutProps>(
  (
    {
      url,
      auth,
      mode = 'popup',
      autoResizeHeight = true,
      style,
      onCompleted,
      onError,
      onClose,
      onResize,
    },
    ref,
  ) => {
    const shopify = useShopifyCheckoutSheet();
    const [isVisible, setIsVisible] = useState(mode === 'inline');
    const [webViewHeight, setWebViewHeight] = useState(400);
    const eventSubscriptions = useRef<EmitterSubscription[]>([]);

    // Event listeners setup
    useEffect(() => {
      const subscriptions: EmitterSubscription[] = [];

      if (onCompleted) {
        const completedSub = shopify.addEventListener('completed', onCompleted);
        if (completedSub) {
          subscriptions.push(completedSub);
        }
      }

      if (onError) {
        const errorSub = shopify.addEventListener('error', onError);
        if (errorSub) {
          subscriptions.push(errorSub);
        }
      }

      if (onClose) {
        const closeSub = shopify.addEventListener('close', () => {
          setIsVisible(false);
          onClose();
        });
        if (closeSub) {
          subscriptions.push(closeSub);
        }
      }

      eventSubscriptions.current = subscriptions;

      return () => {
        subscriptions.forEach(sub => sub.remove());
      };
    }, [shopify, onCompleted, onError, onClose]);

    // Imperative API for ref
    useImperativeHandle(ref, () => ({
      open: () => {
        if (mode === 'popup' && url) {
          shopify.present(url);
        } else if (mode === 'inline') {
          setIsVisible(true);
        }
      },
      close: () => {
        if (mode === 'popup') {
          shopify.dismiss();
        } else if (mode === 'inline') {
          setIsVisible(false);
          onClose?.();
        }
      },
      preload: () => {
        if (url) {
          shopify.preload(url);
        }
      },
    }));

    // Build checkout URL with embed parameters for inline mode
    const buildEmbedUrl = (checkoutUrl: string, authToken?: string): string => {
      if (!authToken) {
        // No authentication - use basic embed parameters
        const embedParams = [
          'branding=app',
          'platform=ReactNative',
          'entry=Inline',
          'protocol=2025-04',
        ].join(',');

        const separator = checkoutUrl.includes('?') ? '&' : '?';
        return `${checkoutUrl}${separator}embed="${embedParams}"`;
      }

      // With authentication
      const embedParams = [
        `authentication=${authToken}`,
        'branding=app',
        'platform=ReactNative',
        'entry=Inline',
        'protocol=2025-04',
      ].join(',');

      const separator = checkoutUrl.includes('?') ? '&' : '?';
      return `${checkoutUrl}${separator}embed="${embedParams}"`;
    };

    // Handle WebView messages for protocol communication
    const handleWebViewMessage = (event: any) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);

        switch (message.type) {
          case 'checkout_completed':
            onCompleted?.(message.payload);
            setIsVisible(false);
            break;
          case 'checkout_error':
            onError?.(message.payload);
            break;
          case 'checkout_resize':
            if (autoResizeHeight && message.payload.height) {
              setWebViewHeight(message.payload.height);
              onResize?.(message.payload.height);
            }
            break;
          case 'checkout_close':
            setIsVisible(false);
            onClose?.();
            break;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse WebView message:', error);
      }
    };

    // JavaScript to inject into WebView for protocol communication
    const injectedJavaScript = `
      (function() {
        // Protocol message handler
        function sendMessage(type, payload) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: type,
              payload: payload,
            }));
          }
        }

        // Listen for checkout events
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type) {
            switch (event.data.type) {
              case 'checkout_completed':
              case 'checkout_error':
              case 'checkout_close':
                sendMessage(event.data.type, event.data.payload);
                break;
            }
          }
        });

        // Auto-resize observer
        if (${autoResizeHeight}) {
          const resizeObserver = new ResizeObserver(function(entries) {
            for (let entry of entries) {
              const height = entry.contentRect.height;
              if (height > 0) {
                sendMessage('checkout_resize', { height: height });
              }
            }
          });

          if (document.body) {
            resizeObserver.observe(document.body);
          }
        }

        // Initial height check
        setTimeout(() => {
          const height = document.body?.scrollHeight || document.body?.offsetHeight;
          if (height > 0 && ${autoResizeHeight}) {
            sendMessage('checkout_resize', { height: height });
          }
        }, 1000);
      })();
      true; // Required for iOS
    `;

    // Mock checkout completion for demo when WebView is not available
    const handleMockComplete = () => {
      if (onCompleted) {
        onCompleted({
          orderDetails: {
            id: 'mock-order-123',
            total: '$99.99',
          },
        });
      }
      setIsVisible(false);
    };

    // Inline mode rendering
    if (mode === 'inline') {
      if (!isVisible || !url) {
        return null;
      }

      // Use WebView if plugin is available (auth is optional)
      if (webViewPlugin) {
        const {WebView, createWebViewProps} = webViewPlugin;
        const embedUrl = buildEmbedUrl(url, auth);

        const webViewProps = createWebViewProps({
          source: {uri: embedUrl},
          style: [
            styles.webView,
            autoResizeHeight ? {height: webViewHeight} : {flex: 1},
          ],
          onMessage: handleWebViewMessage,
          onError: (error: any) => {
            // eslint-disable-next-line no-console
            console.error('WebView error:', error);
            onError?.(error);
          },
          injectedJavaScript,
          onContentSizeChange: autoResizeHeight
            ? (event: any) => {
                const {height} = event.nativeEvent.contentSize;
                if (height > 0) {
                  setWebViewHeight(height);
                  onResize?.(height);
                }
              }
            : undefined,
        });

        return (
          <View style={[styles.inlineContainer, style]}>
            <WebView {...webViewProps} />
          </View>
        );
      }

      // Fallback to mock implementation when WebView is not available
      return (
        <View style={[styles.inlineContainer, style]}>
          <View style={styles.mockCheckout}>
            <Text style={styles.title}>🛒 Shopify Checkout</Text>
            <Text style={styles.subtitle}>
              {webViewPlugin ? 'WebView Enhanced' : 'Mock Implementation'}
            </Text>
            <Text style={styles.info}>URL: {url}</Text>
            <Text style={styles.info}>Mode: {mode}</Text>
            <Text style={styles.info}>
              Auth: {auth ? '✅ Provided' : '⚪ Optional'}
            </Text>

            {!webViewPlugin && (
              <Text style={styles.warning}>
                {`⚠️ WebView not available. To enable real checkout, register WebView plugin:

import {WebView} from 'react-native-webview';
import {registerWebViewPlugin} from '@shopify/checkout-sheet-kit';

registerWebViewPlugin({
  WebView,
  createWebViewProps: (props) => props
});`}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleMockComplete}>
                <Text style={styles.buttonText}>Complete Mock Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setIsVisible(false);
                  onClose?.();
                }}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // Popup mode - render nothing (checkout presented natively)
    return null;
  },
);

const styles = StyleSheet.create({
  inlineContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 400,
  },
  webView: {
    backgroundColor: 'transparent',
  },
  mockCheckout: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  warning: {
    fontSize: 12,
    color: '#FF9500',
    backgroundColor: '#FFF5E6',
    padding: 12,
    borderRadius: 6,
    marginVertical: 10,
    textAlign: 'center',
    fontFamily: 'Menlo, Monaco, monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  completeButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

ShopifyCheckout.displayName = 'ShopifyCheckout';

export default ShopifyCheckout;
