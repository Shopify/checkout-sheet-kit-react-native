import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ColorScheme,
  Configuration,
  useShopifyCheckoutSheet,
} from '@shopify/checkout-sheet-kit';
import {useTheme} from './Theme';

interface Context {
  config: Configuration | undefined;
  configure: (config: Configuration) => void;
}

const ConfigContext = createContext<Context>({
  config: {
    colorScheme: ColorScheme.automatic,
    preloading: false,
  },
  configure: () => undefined,
});

export const ConfigProvider: React.FC<PropsWithChildren> = ({children}) => {
  const shopifyCheckout = useShopifyCheckoutSheet();
  const [config, setConfig] = useState<Context['config']>(undefined);
  const {setColorScheme} = useTheme();

  useEffect(() => {
    async function init() {
      try {
        // Fetch the checkout configuration object
        const config = await shopifyCheckout.getConfig();
        // Store it in local state
        setConfig(config);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch Shopify checkout configuration', error);
      }
    }

    init();
  }, [shopifyCheckout]);

  const configure = useCallback(
    async (config: Configuration) => {
      try {
        // Update the SDK configuration
        shopifyCheckout.configure(config);

        // Fetch the latest configuration object
        const updatedConfig = await shopifyCheckout.getConfig();

        // Update local config state
        setConfig(updatedConfig);

        // Update the color scheme theme setting if it changed
        if (updatedConfig?.colorScheme) {
          setColorScheme(updatedConfig.colorScheme);
        }

        return updatedConfig;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to configure Shopify checkout', error);
        return undefined;
      }
    },
    [setColorScheme, shopifyCheckout],
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
