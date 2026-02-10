import type {PropsWithChildren} from 'react';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {ColorScheme} from '@shopify/checkout-sheet-kit';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useTheme} from './Theme';
import {BuyerIdentityMode} from '../auth/types';

export interface AppConfig {
  colorScheme: ColorScheme;
  buyerIdentityMode: BuyerIdentityMode;
}

interface Context {
  appConfig: AppConfig;
  setAppConfig: (config: AppConfig) => void;
}

const CONFIG_STORAGE_KEY = 'app_config';

const defaultAppConfig: AppConfig = {
  colorScheme: ColorScheme.automatic,
  buyerIdentityMode: BuyerIdentityMode.Guest,
};

const ConfigContext = createContext<Context>({
  appConfig: defaultAppConfig,
  setAppConfig: () => undefined,
});

export const ConfigProvider: React.FC<
  PropsWithChildren<{config?: AppConfig}>
> = ({children, config}) => {
  const [appConfig, setInternalAppConfig] =
    useState<AppConfig>(defaultAppConfig);
  const {setColorScheme} = useTheme();

  useEffect(() => {
    async function restoreConfig() {
      try {
        const raw = await EncryptedStorage.getItem(CONFIG_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppConfig>;
          const restored: AppConfig = {
            ...defaultAppConfig,
            ...config,
            ...saved,
          };
          setInternalAppConfig(restored);
          setColorScheme(restored.colorScheme);
          return;
        }
      } catch {}
      setColorScheme(config?.colorScheme ?? ColorScheme.automatic);
    }
    restoreConfig();
  }, [config, setColorScheme]);

  const setAppConfig = useCallback((newConfig: AppConfig) => {
    console.groupCollapsed('APP CONFIG UPDATE');
    console.log(newConfig);
    console.groupEnd();
    setInternalAppConfig(newConfig);
    EncryptedStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify(newConfig),
    ).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      appConfig,
      setAppConfig,
    }),
    [appConfig, setAppConfig],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => React.useContext(ConfigContext);
