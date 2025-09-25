import React, {createContext, useContext, useState} from 'react';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  NavigationContainer,
  NavigationIndependentTree,
  type ParamListBase,
} from '@react-navigation/native';
import {CheckoutWebView} from './CheckoutWebView';
import {Button} from 'react-native';
import {CheckoutEventProvider} from '../CheckoutEventProvider';

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

type CheckoutContextData = {
  address: Record<string, any>;
  payments: Record<string, any>;
  setAddressData: (id: string, data: any) => void;
  setPaymentData: (id: string, data: any) => void;
};

const CheckoutContext = createContext<CheckoutContextData | undefined>(
  undefined,
);

export function useCheckoutContext() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error(
      'useCheckoutContext must be used within CheckoutContextProvider',
    );
  }
  return context;
}

export function createShopifyCheckoutNavigation(renderProps: RenderProps) {
  return function NavigationStack(props: {
    navigation: NativeStackNavigationProp<ParamListBase>;
    route: any;
  }) {
    const [address, setAddress] = useState<Record<string, any>>({});
    const [payments, setPayments] = useState<Record<string, any>>({});

    const setAddressData = (id: string, data: any) => {
      setAddress(prev => ({...prev, [id]: data}));
    };

    const setPaymentData = (id: string, data: any) => {
      setPayments(prev => ({...prev, [id]: data}));
    };

    return (
      <CheckoutEventProvider>
        <NavigationIndependentTree>
          <NavigationContainer>
            <CheckoutContext.Provider
              value={{address, payments, setAddressData, setPaymentData}}>
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
                  options={{
                    title: 'Shipping Address',
                    headerLeft: BackButton(props),
                  }}
                />

                <Stack.Screen
                  name="Payment"
                  component={renderProps.renderPaymentScreen}
                  options={{
                    title: 'Payment Details',
                    headerLeft: BackButton(props),
                  }}
                />
              </Stack.Navigator>
            </CheckoutContext.Provider>
          </NavigationContainer>
        </NavigationIndependentTree>
      </CheckoutEventProvider>
    );
  };
}

function CancelButton(props: {
  navigation: NativeStackNavigationProp<ParamListBase>;
  route: any;
}) {
  return () => <Button title="x" onPress={() => props.navigation.goBack()} />;
}

function BackButton(props: {
  navigation: NativeStackNavigationProp<ParamListBase>;
  route: any;
}) {
  return () => <Button title="<-" onPress={() => props.navigation.goBack()} />;
}
