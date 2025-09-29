import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {Button} from 'react-native';
import {CheckoutEventProvider} from '../CheckoutEventProvider';
import {CheckoutContextProvider} from './CheckoutContext';
import {CheckoutWebView} from './CheckoutWebView';
import type {CheckoutWebViewControllerProps} from './CheckoutWebViewController';
export {useCheckoutContext} from './CheckoutContext';

type RouteID = {id: string};
export type CheckoutStackParamList = {
  // Initial page navigated to by host app so no params
  CheckoutWebView: undefined;
  // The pages are navigated to internally by CheckoutWebView so we can provide params
  Address: RouteID;
  Payment: RouteID;
};

const Stack = createNativeStackNavigator<CheckoutStackParamList>();
type GoBack = () => void;

// TODO: if we dont need unique props per page, remove generic
interface RouteProps<T> {
  params: T;
  navigateBack: GoBack;
}

export type AddressScreenProps = RouteProps<RouteID>;
export type PaymentScreenProps = RouteProps<RouteID>;

type NavigationConfig = {
  renderAddressScreen: (props: AddressScreenProps) => React.ReactNode;
  renderPaymentScreen: (props: PaymentScreenProps) => React.ReactNode;
};
type CheckoutDelegateEvents = Pick<
  CheckoutWebViewControllerProps,
  | 'onPixelEvent'
  | 'onComplete'
  | 'onCancel'
  | 'onClickLink'
  | 'onError'
  | 'onAddressChangeIntent'
>;
type NavigationStackProps = {
  url: URL;
  auth: string;
  navigateBack: GoBack;
} & CheckoutDelegateEvents;

export function createShopifyCheckoutNavigation(config: NavigationConfig) {
  const {
    renderAddressScreen: AddressScreen,
    renderPaymentScreen: PaymentScreen,
  } = config;
  return function ShopifyNavigationStack(props: NavigationStackProps) {
    return (
      <CheckoutEventProvider>
        <NavigationIndependentTree>
          <NavigationContainer>
            <CheckoutContextProvider>
              <Stack.Navigator
                initialRouteName="CheckoutWebView"
                screenOptions={{
                  headerStyle: {backgroundColor: '#ffffff'},
                  headerTintColor: '#000',
                  headerTitleStyle: {fontWeight: 'bold'},
                }}>
                <Stack.Screen
                  name="CheckoutWebView"
                  options={{
                    title: 'Shopify Checkout',
                    headerRight: CancelButton(props),
                  }}>
                  {screenProps => (
                    <CheckoutWebView
                      // TODO; do we need full navigation/route here?
                      {...screenProps}
                      url={props.url}
                      auth={props.auth}
                      onComplete={props.onComplete}
                      onCancel={props.onCancel}
                      onClickLink={props.onClickLink}
                      onError={props.onError}
                      onPixelEvent={props.onPixelEvent}
                      // New Props
                      onAddressChangeIntent={props.onAddressChangeIntent}
                      goBack={props.navigateBack}
                    />
                  )}
                </Stack.Screen>

                <Stack.Group
                  screenOptions={({navigation}) => ({
                    headerLeft: BackButton({navigateBack: navigation.goBack}),
                    headerStyle: {backgroundColor: '#ffffff'},
                    headerTintColor: '#000',
                  })}>
                  <Stack.Screen
                    name="Address"
                    options={{title: 'Shipping Address'}}>
                    {({route, navigation}) => (
                      <AddressScreen
                        params={route.params}
                        navigateBack={navigation.goBack}
                      />
                    )}
                  </Stack.Screen>

                  <Stack.Screen
                    name="Payment"
                    options={{title: 'Payment Details'}}>
                    {/*
                      TODO: Ensure we memoize / use context to remove this callback for performance
                     @see: https://reactnavigation.org/docs/hello-react-navigation/?config=dynamic#passing-additional-props
                   */}
                    {({route, navigation}) => (
                      <PaymentScreen
                        params={route.params}
                        navigateBack={navigation.goBack}
                      />
                    )}
                  </Stack.Screen>
                </Stack.Group>
              </Stack.Navigator>
            </CheckoutContextProvider>
          </NavigationContainer>
        </NavigationIndependentTree>
      </CheckoutEventProvider>
    );
  };
}

function CancelButton(props: Pick<NavigationStackProps, 'navigateBack'>) {
  return () => <Button title="Cancel" onPress={props.navigateBack} />;
}

function BackButton(props: Pick<NavigationStackProps, 'navigateBack'>) {
  return () => <Button title="Back" onPress={props.navigateBack} />;
}
