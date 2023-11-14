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
} from '../../../package/ShopifyCheckout';
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
        const config = await ShopifyCheckout.getConfig();
        setConfig(config);
      } catch (error) {
        console.error('Failed to fetch Shopify checkout configuration', error);
      }
    }

    init();
  }, []);

  const configure = useCallback(
    async (config: ShopifyCheckoutConfiguration) => {
      try {
        ShopifyCheckout.configure(config);

        const updatedConfig = await ShopifyCheckout.getConfig();

        setConfig(updatedConfig);

        if (updatedConfig.colorScheme) {
          setColorScheme(updatedConfig.colorScheme);
        }

        return updatedConfig;
      } catch (error) {
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
