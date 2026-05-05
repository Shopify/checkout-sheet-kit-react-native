import type {PropsWithChildren} from 'react';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {ColorScheme, ApplePayStyle} from '@shopify/checkout-sheet-kit';
import EncryptedStorage from 'react-native-encrypted-storage';
import {useTheme} from './Theme';
import {BuyerIdentityMode} from '../auth/types';

export interface AppConfig {
  colorScheme: ColorScheme;
  buyerIdentityMode: BuyerIdentityMode;
  applePayStyle?: ApplePayStyle;
}

interface Context {
  appConfig: AppConfig;
  setAppConfig: (config: AppConfig) => void;
}

const CONFIG_STORAGE_KEY = 'app_config';

const defaultAppConfig: AppConfig = {
  colorScheme: ColorScheme.automatic,
  buyerIdentityMode: BuyerIdentityMode.Guest,
  applePayStyle: ApplePayStyle.automatic,
};

function getInitialAppConfig(config?: AppConfig): AppConfig {
  return {
    ...defaultAppConfig,
    ...config,
  };
}

const ConfigContext = createContext<Context>({
  appConfig: defaultAppConfig,
  setAppConfig: () => undefined,
});

export const ConfigProvider: React.FC<
  PropsWithChildren<{config?: AppConfig}>
> = ({children, config}) => {
  const initialAppConfig = useMemo(
    () => getInitialAppConfig(config),
    [config?.applePayStyle, config?.buyerIdentityMode, config?.colorScheme],
  );
  const [appConfig, setInternalAppConfig] =
    useState<AppConfig>(initialAppConfig);
  const {setColorScheme} = useTheme();

  useEffect(() => {
    async function restoreConfig() {
      try {
        const raw = await EncryptedStorage.getItem(CONFIG_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppConfig>;
          const restored: AppConfig = {
            ...initialAppConfig,
            ...saved,
          };
          setInternalAppConfig(restored);
          setColorScheme(restored.colorScheme);
          return;
        }
      } catch {}
      setInternalAppConfig(initialAppConfig);
      setColorScheme(initialAppConfig.colorScheme);
    }
    restoreConfig();
  }, [initialAppConfig, setColorScheme]);

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
