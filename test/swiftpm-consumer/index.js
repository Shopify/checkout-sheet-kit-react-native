import React, {useEffect, useState} from 'react';
import {
  AppRegistry,
  Button,
  Text,
  TurboModuleRegistry,
  View,
} from 'react-native';
import {
  AcceleratedCheckoutButtons,
  ShopifyCheckoutSheet,
} from '@shopify/checkout-sheet-kit';

function Consumer() {
  const [moduleReady, setModuleReady] = useState(false);
  const [viewReady, setViewReady] = useState(false);
  const [configurationUpdated, setConfigurationUpdated] = useState(false);
  const [failure, setFailure] = useState('');
  const [checkout] = useState(() => new ShopifyCheckoutSheet());

  async function configureAcceleratedCheckouts(storefrontDomain) {
    const configured = await checkout.configureAcceleratedCheckouts({
      storefrontDomain,
      storefrontAccessToken: 'swiftpm-consumer-token',
    });
    if (!configured || !(await checkout.isAcceleratedCheckoutAvailable())) {
      throw new Error('Native accelerated configuration was not applied');
    }
  }

  useEffect(() => {
    async function configure() {
      try {
        const native = TurboModuleRegistry.getEnforcing(
          'ShopifyCheckoutSheetKit',
        );
        const result = native.getConfig();
        if (typeof result?.then !== 'function') {
          throw new Error('The v3 getConfig Promise contract changed');
        }
        await result;
        await checkout.setConfig({
          title: 'SwiftPM configuration applied',
          preloading: false,
        });
        const config = await checkout.getConfig();
        if (
          config.title !== 'SwiftPM configuration applied' ||
          config.preloading !== false ||
          !checkout.version.startsWith('3.')
        ) {
          throw new Error('Native configuration did not round-trip');
        }
        await configureAcceleratedCheckouts('example.invalid');
        const applePay = await native.isApplePayAvailable();
        if (typeof applePay !== 'boolean') {
          throw new Error('Native availability did not resolve to a boolean');
        }
        setModuleReady(true);
      } catch (error) {
        setFailure(String(error));
      }
    }
    configure();
  }, []);

  return (
    <View style={{flex: 1, padding: 32}}>
      {moduleReady && (
        <Text testID="native-module-ready">SwiftPM configuration applied</Text>
      )}
      {viewReady && (
        <Text testID="native-view-ready">Native view event received</Text>
      )}
      {configurationUpdated && (
        <Text testID="configuration-updated">Configuration updated</Text>
      )}
      <Text testID="failure">{failure}</Text>
      <Button
        testID="update-configuration"
        title="Update configuration"
        onPress={async () => {
          try {
            await configureAcceleratedCheckouts('updated.example.invalid');
            await checkout.setConfig({title: 'Updated after mounting'});
            if (
              (await checkout.getConfig()).title !== 'Updated after mounting'
            ) {
              throw new Error('Mounted configuration did not round-trip');
            }
            setConfigurationUpdated(true);
          } catch (error) {
            setFailure(String(error));
          }
        }}
      />
      {moduleReady && (
        <AcceleratedCheckoutButtons
          variantId="gid://shopify/ProductVariant/1"
          quantity={1}
          onRenderStateChange={() => setViewReady(true)}
        />
      )}
    </View>
  );
}

AppRegistry.registerComponent(
  'CheckoutSheetKitSwiftPMConsumer',
  () => Consumer,
);
