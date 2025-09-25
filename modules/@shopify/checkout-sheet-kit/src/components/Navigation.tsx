import {
  NavigationContainer,
  NavigationIndependentTree,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {Button} from 'react-native';
import {CheckoutEventProvider} from '../CheckoutEventProvider';
import {CheckoutContextProvider} from './CheckoutContext';
import {CheckoutWebView} from './CheckoutWebView';

type RouteID = {id: string};
export type CheckoutStackParamList = {
  CheckoutWebView: {url: string};
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

type RenderProps = {
  renderAddressScreen: (props: AddressScreenProps) => React.ReactNode;
  renderPaymentScreen: (props: PaymentScreenProps) => React.ReactNode;
};

export {useCheckoutContext} from './CheckoutContext';

export function createShopifyCheckoutNavigation(renderProps: RenderProps) {
  return function NavigationStack(props: {
    navigation: NativeStackNavigationProp<ParamListBase>;
    route: any;
  }) {
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
                      url={new URL(props.route.params.url)}
                      auth={'ey49mock'}
                      goBack={props.navigation.goBack}
                    />
                  )}
                </Stack.Screen>

                <Stack.Screen
                  name="Address"
                  component={renderProps.renderAddressScreen}
                  options={props => ({
                    title: 'Shipping Address',
                    headerLeft: BackButton(props),
                  })}
                />

                <Stack.Screen
                  name="Payment"
                  component={renderProps.renderPaymentScreen}
                  options={props => ({
                    title: 'Payment Details',
                    headerLeft: BackButton(props),
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

function CancelButton(props: {
  navigation: NativeStackNavigationProp<ParamListBase>;
  route: RouteProp<ParamListBase>;
}) {
  return () => <Button title="x" onPress={() => props.navigation.goBack()} />;
}

function BackButton(props: {
  navigation: NativeStackNavigationProp<ParamListBase>;
  route: RouteProp<ParamListBase>;
}) {
  return () => <Button title="<-" onPress={() => props.navigation.goBack()} />;
}
