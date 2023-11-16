import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ShopifyCheckout, {
  ColorScheme,
  ShopifyCheckoutConfiguration,
} from 'react-native-shopify-checkout-kit';
import {useTheme} from './Theme';

interface Context {
  config: ShopifyCheckoutConfiguration | undefined;
  configure: typeof ShopifyCheckout.configure;
}

const ConfigContext = createContext<Context>({
  config: {
    colorScheme: ColorScheme.automatic,
    preloading: false,
  },
  configure: () => undefined,
});

export const ConfigProvider: React.FC<PropsWithChildren> = ({children}) => {
  const [config, setConfig] = useState<Context['config']>(undefined);
  const {setColorScheme} = useTheme();

  useEffect(() => {
    async function init() {
      try {
        // Fetch the checkout configuration object
        const config = await ShopifyCheckout.getConfig();
        // Store it in local state
        setConfig(config);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch Shopify checkout configuration', error);
      }
    }

    init();
  }, []);

  const configure = useCallback(
    async (config: ShopifyCheckoutConfiguration) => {
      try {
        // Update the SDK configuration
        ShopifyCheckout.configure(config);

        // Fetch the latest configuration object
        const updatedConfig = await ShopifyCheckout.getConfig();

        // Update local config state
        setConfig(updatedConfig);

        // Update the color scheme theme setting if it changed
        if (updatedConfig.colorScheme) {
          setColorScheme(updatedConfig.colorScheme);
        }

        return updatedConfig;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to configure Shopify checkout', error);
      }
    },
    [setColorScheme],
  );

  const value = useMemo(
    () => ({
      config,
      configure,
    }),
    [config, configure],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => React.useContext(ConfigContext);
