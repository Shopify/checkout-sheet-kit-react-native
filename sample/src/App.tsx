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

import type {PropsWithChildren, ReactNode} from 'react';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Appearance, Linking, Pressable, StatusBar} from 'react-native';
import {
  NavigationContainer,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ApolloClient, InMemoryCache, ApolloProvider} from '@apollo/client';
import Icon from 'react-native-vector-icons/Entypo';

import CatalogScreen from './screens/CatalogScreen';
import SettingsScreen from './screens/SettingsScreen';
import AccountScreen from './screens/AccountScreen';
import LoginScreen from './screens/LoginScreen';

import type {Configuration, Features} from '@shopify/checkout-sheet-kit';
import {
  ApplePayContactField,
  ColorScheme,
  LogLevel,
  ShopifyCheckoutSheetProvider,
  useShopifyCheckoutSheet,
} from '@shopify/checkout-sheet-kit';
import type {
  CheckoutCompletedEvent,
  CheckoutException,
  PixelEvent,
} from '@shopify/checkout-sheet-kit';
import {ConfigProvider, useConfig} from './context/Config';
import {BuyerIdentityMode} from './auth/types';
import {
  ThemeProvider,
  darkColors,
  getColors,
  getNavigationTheme,
  lightColors,
  useTheme,
} from './context/Theme';
import {CartProvider, useCart} from './context/Cart';
import {AuthProvider, useAuth} from './context/Auth';
import CartScreen from './screens/CartScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import type {ProductVariant, ShopifyProduct} from '../@types';
import ErrorBoundary from './ErrorBoundary';
import env from 'react-native-config';
import {createDebugLogger} from './utils';
import {useShopifyEventHandlers} from './hooks/useCheckoutEventHandlers';

const log = createDebugLogger('ENV');

function quote(str: string | undefined) {
  return `"${str}"`;
}

console.groupCollapsed('ENV');
log('STOREFRONT_DOMAIN:', quote(env.STOREFRONT_DOMAIN));
log(
  'STOREFRONT_ACCESS_TOKEN:',
  '*'.repeat(8) + env.STOREFRONT_ACCESS_TOKEN?.slice(-4),
);
log('STOREFRONT_VERSION:', quote(env.STOREFRONT_VERSION));
log(
  'STOREFRONT_MERCHANT_IDENTIFIER:',
  quote(env.STOREFRONT_MERCHANT_IDENTIFIER),
);
log('EMAIL:', quote(env.EMAIL));
log('PHONE:', quote(env.PHONE));
console.groupEnd();

export type RootStackParamList = {
  Catalog: undefined;
  CatalogScreen: undefined;
  ProductDetails: {product: ShopifyProduct; variant?: ProductVariant};
  Cart: undefined;
  CartModal: undefined;
  Account: undefined;
  Settings: undefined;
};

export type AccountStackParamList = {
  AccountHome: undefined;
  Login: undefined;
};

const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();

export const cache = new InMemoryCache();

const client = new ApolloClient({
  uri: `https://${env.STOREFRONT_DOMAIN}/api/${env.STOREFRONT_VERSION}/graphql.json`,
  cache,
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': env.STOREFRONT_ACCESS_TOKEN ?? '',
  },
  connectToDevTools: __DEV__,
});

function AppWithTheme({children}: PropsWithChildren) {
  const {colorScheme} = useTheme();

  return (
    <ThemeProvider cornerRadius={30} defaultValue={colorScheme}>
      {children}
    </ThemeProvider>
  );
}

const createNavigationIcon =
  (name: string) =>
  ({
    color,
    size,
  }: {
    color: string;
    size: number;
    focused?: boolean;
  }): ReactNode => {
    return <Icon name={name} color={color} size={size} />;
  };

// See https://reactnative.dev/docs/linking#get-the-deep-link for more information
const useInitialURL = (): {url: string | null} => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUrlAsync = async () => {
      // Get the deep link used to open the app
      const initialUrl = await Linking.getInitialURL();

      if (initialUrl !== url) {
        setUrl(initialUrl);
      }
    };

    getUrlAsync();
  }, [url]);

  return {
    url,
  };
};

// This code is meant as example only.
class StorefrontURL {
  readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  isThankYouPage(): boolean {
    return /thank[-_]you/i.test(this.url);
  }

  isCheckout(): boolean {
    return this.url.includes('/checkout');
  }

  isCart() {
    return this.url.includes('/cart');
  }
}

const checkoutKitConfigDefaults: Configuration = {
  logLevel: LogLevel.debug,
  colorScheme: ColorScheme.dark,
  preloading: true,
  colors: {
    ios: {
      backgroundColor: '#f0f0e8',
      tintColor: '#2d2a38',
    },
    android: {
      backgroundColor: '#f0f0e8',
      progressIndicator: '#2d2a38',
      headerBackgroundColor: '#f0f0e8',
      headerTextColor: '#2d2a38',
    },
  },
};

function AppWithContext({children}: PropsWithChildren) {
  const shopify = useShopifyCheckoutSheet();
  const eventHandlers = useShopifyEventHandlers();

  useEffect(() => {
    const close = shopify.addEventListener('close', () => {
      eventHandlers.onCancel?.();
    });

    const pixel = shopify.addEventListener('pixel', (event: PixelEvent) => {
      eventHandlers.onWebPixelEvent?.(event);
    });

    const completed = shopify.addEventListener(
      'completed',
      (event: CheckoutCompletedEvent) => {
        eventHandlers.onComplete?.(event);
      },
    );

    const error = shopify.addEventListener(
      'error',
      (error: CheckoutException) => {
        eventHandlers.onFail?.(error);
      },
    );

    return () => {
      pixel?.remove();
      completed?.remove();
      close?.remove();
      error?.remove();
    };
  }, [shopify, eventHandlers]);

  return (
    <ApolloProvider client={client}>
      <CartProvider>
        <StatusBar barStyle="default" />
        {children}
      </CartProvider>
    </ApolloProvider>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator
      screenOptions={({navigation}) => ({
        headerBackTitle: 'Back',
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => (
          <CartIcon
            onPress={() =>
              navigation.getParent()?.navigate('Catalog', {screen: 'CartModal'})
            }
          />
        ),
      })}>
      <Stack.Screen
        name="CatalogScreen"
        component={CatalogScreen}
        options={{
          headerShown: true,
          headerTitle: __DEV__ ? 'Development' : 'Production',
        }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={({route}) => ({
          headerTitle: route.params.product.title,
          headerShown: true,
          headerBackVisible: true,
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="CartModal"
        component={CartScreen}
        options={{
          title: 'Cart',
          presentation: 'modal',
          headerRight: undefined,
        }}
      />
    </Stack.Navigator>
  );
}

function CartIcon({onPress}: {onPress: () => void}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} testID="header-cart-icon">
      <Icon name="shopping-basket" size={24} color={theme.colors.secondary} />
    </Pressable>
  );
}

function AccountStackScreen() {
  return (
    <AccountStack.Navigator>
      <AccountStack.Screen
        name="AccountHome"
        component={AccountScreen}
        options={{headerTitle: 'Account'}}
      />
      <AccountStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Sign In',
          presentation: 'modal',
        }}
      />
    </AccountStack.Navigator>
  );
}

function AppWithCheckoutKit({children}: PropsWithChildren) {
  const {appConfig} = useConfig();
  const {isAuthenticated, customerEmail, getValidAccessToken} = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchAccessToken = useCallback(async () => {
    if (
      appConfig.buyerIdentityMode === BuyerIdentityMode.CustomerAccount &&
      isAuthenticated
    ) {
      const token = await getValidAccessToken();
      setAccessToken(token);
    } else {
      setAccessToken(null);
    }
  }, [appConfig.buyerIdentityMode, isAuthenticated, getValidAccessToken]);

  useEffect(() => {
    fetchAccessToken();
  }, [fetchAccessToken]);

  const updatedColors = getColors(
    appConfig.colorScheme,
    Appearance.getColorScheme(),
  );

  const checkoutKitThemeConfig: Configuration = useMemo(() => {
    if (appConfig.colorScheme === ColorScheme.automatic) {
      return {
        colorScheme: ColorScheme.automatic,
        colors: {
          ios: {
            backgroundColor: updatedColors.webviewBackgroundColor,
            tintColor: updatedColors.webViewProgressIndicator,
          },
          android: {
            light: {
              backgroundColor: lightColors.webviewBackgroundColor,
              progressIndicator: lightColors.webViewProgressIndicator,
              headerBackgroundColor: lightColors.webviewBackgroundColor,
              headerTextColor: lightColors.webviewHeaderTextColor,
              closeButtonColor: lightColors.webviewCloseButtonColor,
            },
            dark: {
              backgroundColor: darkColors.webviewBackgroundColor,
              progressIndicator: darkColors.webViewProgressIndicator,
              headerBackgroundColor: darkColors.webviewBackgroundColor,
              headerTextColor: darkColors.webviewHeaderTextColor,
              closeButtonColor: darkColors.webviewCloseButtonColor,
            },
          },
        },
      };
    }

    return {
      colorScheme: appConfig.colorScheme,
      colors: {
        ios: {
          backgroundColor: updatedColors.webviewBackgroundColor,
          tintColor: updatedColors.webViewProgressIndicator,
          closeButtonColor: updatedColors.webviewCloseButtonColor,
        },
        android: {
          backgroundColor: updatedColors.webviewBackgroundColor,
          progressIndicator: updatedColors.webViewProgressIndicator,
          headerBackgroundColor: updatedColors.webviewBackgroundColor,
          headerTextColor: updatedColors.webviewHeaderTextColor,
          closeButtonColor: updatedColors.webviewCloseButtonColor,
        },
      },
    };
  }, [appConfig.colorScheme, updatedColors]);

  const checkoutKitConfig: Configuration = useMemo(() => {
    return {
      ...checkoutKitConfigDefaults,
      ...checkoutKitThemeConfig,
      acceleratedCheckouts: {
        storefrontDomain: env.STOREFRONT_DOMAIN!,
        storefrontAccessToken: env.STOREFRONT_ACCESS_TOKEN!,
        /**
         * We're reading the customer email and phone number from the environment variables here,
         * but in a real app you would derive these values from your backend.
         */
        customer:
          appConfig.buyerIdentityMode === BuyerIdentityMode.Hardcoded
            ? {
                email: env.EMAIL!,
                phoneNumber: env.PHONE!,
              }
            : appConfig.buyerIdentityMode ===
                  BuyerIdentityMode.CustomerAccount && isAuthenticated
              ? {
                  email: customerEmail ?? undefined,
                  accessToken: accessToken ?? undefined,
                }
              : undefined,
        wallets: {
          applePay: {
            contactFields: [
              ApplePayContactField.email,
              ApplePayContactField.phone,
            ],
            merchantIdentifier: env.STOREFRONT_MERCHANT_IDENTIFIER!,
          },
        },
      },
    } as Configuration;
  }, [appConfig, checkoutKitThemeConfig, isAuthenticated, customerEmail, accessToken]);

  return (
    <ShopifyCheckoutSheetProvider
      configuration={checkoutKitConfig}
      features={checkoutKitFeatures}>
      {children}
    </ShopifyCheckoutSheetProvider>
  );
}

function AppWithNavigation(props: {children: React.ReactNode}) {
  const {colorScheme, preference} = useTheme();
  return (
    <NavigationContainer theme={getNavigationTheme(colorScheme, preference)}>
      {props.children}
    </NavigationContainer>
  );
}

function Routes() {
  const {totalQuantity} = useCart();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {url: initialUrl} = useInitialURL();
  const shopify = useShopifyCheckoutSheet();

  useEffect(() => {
    async function handleUniversalLink(url: string) {
      const storefrontUrl = new StorefrontURL(url);

      switch (true) {
        // Checkout URLs
        case storefrontUrl.isCheckout() && !storefrontUrl.isThankYouPage():
          shopify.present(url);
          return;
        // Cart URLs
        case storefrontUrl.isCart():
          navigation.navigate('Cart');
          return;
      }

      // Open everything else in a mobile browser
      const canOpenUrl = await Linking.canOpenURL(url);

      if (canOpenUrl) {
        await Linking.openURL(url);
      }
    }

    if (initialUrl) {
      handleUniversalLink(initialUrl);
    }

    // Subscribe to universal links
    const subscription = Linking.addEventListener('url', ({url}) => {
      handleUniversalLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [initialUrl, shopify, navigation]);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Catalog"
        component={CatalogStack}
        options={{
          headerShown: false,
          tabBarButtonTestID: 'catalog-tab',
          tabBarIcon: createNavigationIcon('shop'),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarButtonTestID: 'cart-tab',
          tabBarIcon: createNavigationIcon('shopping-bag'),
          tabBarBadge: totalQuantity > 0 ? totalQuantity : undefined,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackScreen}
        options={{
          headerShown: false,
          tabBarButtonTestID: 'account-tab',
          tabBarIcon: createNavigationIcon('user'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarButtonTestID: 'settings-tab',
          tabBarIcon: createNavigationIcon('cog'),
        }}
      />
    </Tab.Navigator>
  );
}

const checkoutKitFeatures: Partial<Features> = {
  handleGeolocationRequests: true,
};

function App() {
  return (
    <ErrorBoundary>
      <AppWithTheme>
        <ConfigProvider
          config={{
            colorScheme:
              checkoutKitConfigDefaults.colorScheme ?? ColorScheme.automatic,
            buyerIdentityMode: BuyerIdentityMode.Guest,
          }}>
          <AuthProvider>
            <AppWithCheckoutKit>
              <AppWithContext>
                <AppWithNavigation>
                  <Routes />
                </AppWithNavigation>
              </AppWithContext>
            </AppWithCheckoutKit>
          </AuthProvider>
        </ConfigProvider>
      </AppWithTheme>
    </ErrorBoundary>
  );
}

export default App;
