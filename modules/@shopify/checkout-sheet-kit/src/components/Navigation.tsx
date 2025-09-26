import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {Button} from 'react-native';
import {CheckoutEventProvider} from '../CheckoutEventProvider';
import {CheckoutContextProvider} from './CheckoutContext';
import {CheckoutWebView} from './CheckoutWebView';
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

export type AddressScreenProps = NativeStackScreenProps<
  CheckoutStackParamList,
  'Address'
>;
export type PaymentScreenProps = NativeStackScreenProps<
  CheckoutStackParamList,
  'Payment'
>;

type NavigationConfig = {
  renderAddressScreen: (props: AddressScreenProps) => React.ReactNode;
  renderPaymentScreen: (props: PaymentScreenProps) => React.ReactNode;
};

type NavigationStackProps = {
  url: URL
  auth: string
  goBack: () => void;
}
export function createShopifyCheckoutNavigation(config: NavigationConfig) {
  return function ShopifyNavigationStack(props: NavigationStackProps) {
    return (
      <CheckoutEventProvider>
        <NavigationIndependentTree>
          <NavigationContainer>
            <CheckoutContextProvider>
              <Stack.Navigator
                initialRouteName="CheckoutWebView"
                screenOptions={{
                  headerStyle: {backgroundColor: '#95bf47'},
                  headerTintColor: '#fff',
                  headerTitleStyle: {fontWeight: 'bold'},
                }}>
                <Stack.Screen
                  name="CheckoutWebView"
                  options={{
                    title: 'Shopify Checkout',
                    headerBackVisible: true,
                    headerRight: CancelButton(props),
                  }}>
                  {screenProps => (
                    <CheckoutWebView
                      {...screenProps}
                      // TODO: we shouldnt be dependent on their navigation objects being react-navigation
                      url={props.url}
                      auth={props.auth}
                      goBack={props.goBack}
                    />
                  )}
                </Stack.Screen>

                <Stack.Screen
                  name="Address"
                  component={config.renderAddressScreen}
                  options={screenProps => ({
                    title: 'Shipping Address',
                    headerLeft: BackButton({goBack: screenProps.navigation.goBack}),
                    headerStyle: {backgroundColor: '#F69400'},
                  })}
                />

                <Stack.Screen
                  name="Payment"
                  component={config.renderPaymentScreen}
                  options={screenProps=> ({
                    title: 'Payment Details',
                    headerLeft: BackButton({goBack: screenProps.navigation.goBack}),
                    headerStyle: {backgroundColor: '#F69400'},
                  })}
                />
              </Stack.Navigator>
            </CheckoutContextProvider>
          </NavigationContainer>
        </NavigationIndependentTree>
      </CheckoutEventProvider>
    );
  };
}

function CancelButton(props: Pick<NavigationStackProps, 'goBack'>) {
  return () => <Button title="Cancel" onPress={props.goBack} />;
}

function BackButton(props: Pick<NavigationStackProps, 'goBack'>) {
  return () => <Button title="Back" onPress={props.goBack} />;
}
