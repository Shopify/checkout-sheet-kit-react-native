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

function WebviewComponent(props: any) {
  console.log(props);
  return (
    config: NativeStackScreenProps<CheckoutStackParamList, 'CheckoutWebView'>,
  ) => (
    <CheckoutWebView
      url={props.route.params.url}
      outerNavigation={props.navigation}
      {...config}
    />
  );
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
                component={WebviewComponent(props)}
                options={{
                  title: 'Shopify Checkout',
                  headerBackVisible: true,
                  // eslint-disable-next-line react/no-unstable-nested-components
                  headerLeft() {
                    return (
                      <Button
                        title="cancel"
                        onPress={() => props.navigation.goBack()}
                      />
                    );
                  },
                }}
              />

              <Stack.Screen
                name="Address"
                component={renderProps.renderAddressScreen}
                options={{title: 'Shipping Address'}}
              />

              <Stack.Screen
                name="Payment"
                component={renderProps.renderPaymentScreen}
                options={{title: 'Payment Details'}}
              />
            </Stack.Navigator>
          </CheckoutContext.Provider>
        </NavigationContainer>
      </NavigationIndependentTree>
    );
  };
}

type RespondableEvent = {id: string; respondWith: (body: unknown) => void};
export function useShopifyEvent(eventID: string): RespondableEvent {
  //const navigation = useNavigation();

  const {setAddressData, setPaymentData} = useCheckoutContext();

  return {
    id: eventID,
    respondWith: (body: unknown) => {
      if (eventID.includes('address')) {
        setAddressData(eventID, body);
      } else if (eventID.includes('payment')) {
        setPaymentData(eventID, body);
      }
      // navigation.goBack();
      // navigation.getParent().goBack(); ?
    },
  };
}
