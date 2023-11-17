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

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {ApolloClient, InMemoryCache, ApolloProvider} from '@apollo/client';
import {STOREFRONT_DOMAIN, STOREFRONT_ACCESS_TOKEN} from '@env';
import Icon from 'react-native-vector-icons/Entypo';

import CatalogScreen from './src/screens/CatalogScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import ShopifyCheckout, {ColorScheme} from '../package/ShopifyCheckout';
import {ConfigProvider} from './src/context/Config';
import {ThemeProvider, getNavigationTheme, useTheme} from './src/context/Theme';
import {StatusBar} from 'react-native';
import {CartProvider} from './src/context/Cart';

const defaultColorScheme = ColorScheme.web;

ShopifyCheckout.configure({
  colorScheme: defaultColorScheme,
  preloading: true,
});

const Tab = createBottomTabNavigator();

const client = new ApolloClient({
  uri: `https://${STOREFRONT_DOMAIN}/api/2023-10/graphql.json`,
  cache: new InMemoryCache(),
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
  },
});

function AppWithTheme({children}) {
  return (
    <ThemeProvider defaultValue={defaultColorScheme}>{children}</ThemeProvider>
  );
}

const createNavigationIcon =
  name =>
  ({color, size}) => {
    return <Icon name={name} color={color} size={size} />;
  };

function AppWithNavigation() {
  const {colorScheme, preference} = useTheme();
  return (
    <ConfigProvider>
      <ApolloProvider client={client}>
        <CartProvider>
          <StatusBar barStyle="default" />
          <NavigationContainer
            theme={getNavigationTheme(colorScheme, preference)}>
            <Tab.Navigator>
              <Tab.Screen
                name="Catalog"
                component={CatalogScreen}
                options={{
                  tabBarIcon: createNavigationIcon('shop'),
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
        </CartProvider>
      </ApolloProvider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <AppWithTheme>
      <AppWithNavigation />
    </AppWithTheme>
  );
}

export default App;
