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

export interface AppConfig {
  prefillBuyerInformation: boolean;
}

interface Context {
  appConfig: AppConfig;
  config: Configuration | undefined;
  setConfig: (config: Configuration) => void;
  setAppConfig: (config: AppConfig) => void;
}

const defaultAppConfig: AppConfig = {
  prefillBuyerInformation: false,
};

const ConfigContext = createContext<Context>({
  appConfig: defaultAppConfig,
  config: {
    colorScheme: ColorScheme.automatic,
    preloading: false,
  },
  setConfig: () => undefined,
  setAppConfig: () => undefined,
});

export const ConfigProvider: React.FC<PropsWithChildren> = ({children}) => {
  const ShopifyCheckoutKit = useShopifyCheckoutKit();
  const [config, setInternalConfig] = useState<Context['config']>(undefined);
  const [appConfig, setInternalAppConfig] =
    useState<AppConfig>(defaultAppConfig);
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

  const setAppConfig = useCallback((config: AppConfig) => {
    setInternalAppConfig(config);
  }, []);

  const value = useMemo(
    () => ({
      config,
      appConfig,
      setConfig,
      setAppConfig,
    }),
    [appConfig, config, setAppConfig, setConfig],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => React.useContext(ConfigContext);
