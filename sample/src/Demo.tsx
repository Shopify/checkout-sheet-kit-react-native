import {useEffect} from 'react';
import {Button, Text} from 'react-native';
import {
  ColorScheme,
  ShopifyCheckoutKitProvider,
  useShopifyCheckoutKit,
} from 'react-native-shopify-checkout-kit';

function App() {
  const {present, addEventListener} = useShopifyCheckoutKit();

  function openCheckout() {
    present('https://checkout.shopify.com');
  }

  useEffect(() => {
    const subscription = addEventListener('dismiss', () => {
      console.log('checkout dismissed');
    });

    return () => {
      subscription?.remove();
    };
  });

  return (
    <Button onPress={openCheckout}>
      <Text>Checkout</Text>
    </Button>
  );
}

function AppWithContext() {
  return (
    <ShopifyCheckoutKitProvider
      configuration={{
        colorScheme: ColorScheme.Light,
      }}>
      <App />
    </ShopifyCheckoutKitProvider>
  );
}

export default App;
