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

import React, {PropsWithChildren, ReactNode, useEffect} from 'react';
import {Link, NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ApolloClient, InMemoryCache, ApolloProvider} from '@apollo/client';
import env from 'react-native-config';
import Icon from 'react-native-vector-icons/Entypo';

import CatalogScreen from './screens/CatalogScreen';
import SettingsScreen from './screens/SettingsScreen';

import {
  ColorScheme,
  Configuration,
  ShopifyCheckoutSheetProvider,
  useShopifyCheckoutSheet,
} from '@shopify/checkout-sheet-kit';
import {ConfigProvider} from './context/Config';
import {ThemeProvider, getNavigationTheme, useTheme} from './context/Theme';
import {Appearance, StatusBar} from 'react-native';
import {CartProvider, useCart} from './context/Cart';
import CartScreen from './screens/CartScreen';
import ProductDetailsScreen from './screens/ProductDetailsScreen';
import {ProductVariant, ShopifyProduct} from '../@types';
import ErrorBoundary from './ErrorBoundary';

const colorScheme = ColorScheme.web;

const config: Configuration = {
  colorScheme,
  preloading: true,
  title: 'Checkout with React Native',
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

Appearance.setColorScheme('light');

export type RootStackParamList = {
  Catalog: undefined;
  CatalogScreen: undefined;
  ProductDetails: {product: ShopifyProduct; variant?: ProductVariant};
  Cart: {userId: string};
  CartModal: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

export const cache = new InMemoryCache();

const client = new ApolloClient({
  uri: `https://${env.STOREFRONT_DOMAIN}/api/2023-10/graphql.json`,
  cache,
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': env.STOREFRONT_ACCESS_TOKEN ?? '',
  },
});

function AppWithTheme({children}: PropsWithChildren) {
  return <ThemeProvider defaultValue={colorScheme}>{children}</ThemeProvider>;
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

function AppWithContext({children}: PropsWithChildren) {
  const shopify = useShopifyCheckoutSheet();

  useEffect(() => {
    const pixelEventSubscription = shopify.addEventListener('pixel', event => {
      // eslint-disable-next-line no-console
      console.log('[PixelEvent]', event?.name, event);
    });

    const checkoutCompletedSubscription = shopify.addEventListener(
      'completed',
      event => {
        // eslint-disable-next-line no-console
        console.log(
          '[CheckoutCompletedEvent] Order ID:',
          event.orderDetails.id,
        );
        // eslint-disable-next-line no-console
        console.log('[CheckoutCompletedEvent]', event);
      },
    );

    return () => {
      pixelEventSubscription?.remove();
      checkoutCompletedSubscription?.remove();
    };
  }, [shopify]);

  return (
    <ConfigProvider>
      <ApolloProvider client={client}>
        <CartProvider>
          <StatusBar barStyle="default" />
          {children}
        </CartProvider>
      </ApolloProvider>
    </ConfigProvider>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: true,
        headerRight: CartIcon,
      }}>
      <Stack.Screen
        name="CatalogScreen"
        component={CatalogScreen}
        options={{headerShown: true, headerTitle: 'Catalog'}}
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

function CartIcon() {
  const theme = useTheme();

  return (
    <Link to="/CartModal">
      <Icon name="shopping-basket" size={24} color={theme.colors.secondary} />
    </Link>
  );
}

function AppWithNavigation() {
  const {colorScheme, preference} = useTheme();
  const {totalQuantity} = useCart();

  return (
    <NavigationContainer theme={getNavigationTheme(colorScheme, preference)}>
      <Tab.Navigator>
        <Tab.Screen
          name="Catalog"
          component={CatalogStack}
          options={{
            headerShown: false,
            tabBarIcon: createNavigationIcon('shop'),
          }}
        />
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarIcon: createNavigationIcon('shopping-bag'),
            tabBarBadge: totalQuantity > 0 ? totalQuantity : undefined,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: createNavigationIcon('cog'),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ShopifyCheckoutSheetProvider configuration={config}>
        <AppWithTheme>
          <AppWithContext>
            <AppWithNavigation />
          </AppWithContext>
        </AppWithTheme>
      </ShopifyCheckoutSheetProvider>
    </ErrorBoundary>
  );
}

export default App;
