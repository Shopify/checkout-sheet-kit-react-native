import type {PropsWithChildren} from 'react';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {ColorScheme} from '@shopify/checkout-sheet-kit';
import {useTheme} from './Theme';

export interface AppConfig {
  colorScheme: ColorScheme;
  prefillBuyerInformation: boolean;
  customerAuthenticated: boolean;
}

interface Context {
  appConfig: AppConfig;
  setAppConfig: (config: AppConfig) => void;
}

const defaultAppConfig: AppConfig = {
  colorScheme: ColorScheme.automatic,
  prefillBuyerInformation: false,
  customerAuthenticated: false,
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
    setColorScheme(config?.colorScheme ?? ColorScheme.automatic);
  }, [config, setColorScheme]);

  const setAppConfig = useCallback((config: AppConfig) => {
    console.groupCollapsed('APP CONFIG UPDATE');
    console.log(config);
    console.groupEnd();
    setInternalAppConfig(config);
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
