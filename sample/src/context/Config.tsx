import React, {
  PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ShopifyCheckout, {
  ColorScheme,
  ShopifyCheckoutConfiguration,
} from '../../../package/ShopifyCheckout';

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

  useEffect(() => {
    async function init() {
      try {
        const config = await ShopifyCheckout.getConfig();
        setConfig(config);
      } catch (error) {
        console.error(
          'Something went wrong fetching the ShopifyCheckout config',
          error,
        );
      }
    }

    init();
  }, []);

  const configure = async (config: ShopifyCheckoutConfiguration) => {
    try {
      ShopifyCheckout.configure(config);
      const updatedConfig = await ShopifyCheckout.getConfig();
      setConfig(updatedConfig);
      return updatedConfig;
    } catch (error) {
      console.error('Something went wrong configuring ShopifyCheckout', error);
    }
  };

  const value = useMemo(
    () => ({
      config,
      configure,
    }),
    [config],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => React.useContext(ConfigContext);
