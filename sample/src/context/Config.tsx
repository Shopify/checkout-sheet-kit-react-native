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
  useShopifyCheckoutKit,
} from 'react-native-shopify-checkout-kit';
import {useTheme} from './Theme';

interface Context {
  config: Configuration | undefined;
  setConfig: (config: Configuration) => void;
}

const ConfigContext = createContext<Context>({
  config: {
    colorScheme: ColorScheme.automatic,
    preloading: false,
  },
  setConfig: () => undefined,
});

export const ConfigProvider: React.FC<PropsWithChildren> = ({children}) => {
  const ShopifyCheckoutKit = useShopifyCheckoutKit();
  const [config, setInternalConfig] = useState<Context['config']>(undefined);
  const {setColorScheme} = useTheme();

  useEffect(() => {
    async function init() {
      try {
        // Fetch the checkout configuration object
        const config = await ShopifyCheckoutKit.getConfig();
        // Store it in local state
        setInternalConfig(config);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch Shopify checkout configuration', error);
      }
    }

    init();
  }, [ShopifyCheckoutKit]);

  const setConfig = useCallback(
    async (config: Configuration) => {
      try {
        // Update the SDK configuration
        ShopifyCheckoutKit.setConfig(config);

        // Fetch the latest configuration object
        const updatedConfig = await ShopifyCheckoutKit.getConfig();

        // Update local config state
        setInternalConfig(updatedConfig);

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
    [setColorScheme, ShopifyCheckoutKit],
  );

  const value = useMemo(
    () => ({
      config,
      setConfig,
    }),
    [config, setConfig],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => React.useContext(ConfigContext);
