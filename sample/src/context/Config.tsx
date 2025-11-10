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
  enablePreloading: boolean;
  prefillBuyerInformation: boolean;
  customerAuthenticated: boolean;
}

interface Context {
  appConfig: AppConfig;
  setAppConfig: (config: AppConfig) => void;
}

const defaultAppConfig: AppConfig = {
  colorScheme: ColorScheme.automatic,
  enablePreloading: true,
  prefillBuyerInformation: true,
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
    useState<AppConfig>(config ?? defaultAppConfig);
  const {setColorScheme} = useTheme();

  // Update theme when appConfig changes (not just initial config prop)
  useEffect(() => {
    setColorScheme(appConfig.colorScheme);
  }, [appConfig.colorScheme, setColorScheme]);

  // Handle initial config prop changes
  useEffect(() => {
    if (config) {
      setInternalAppConfig(config);
    }
  }, [config]);

  const setAppConfig = useCallback((config: AppConfig) => {
    setInternalAppConfig(config);
  }, []);

  const value = useMemo(
    () => ({
      appConfig,
      setAppConfig,
    }),
    [appConfig, setAppConfig],
  );

  useEffect(() => {
    console.groupCollapsed('APP CONFIG UPDATE');
    console.log(appConfig);
    console.groupEnd();
  }, [appConfig]);

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => React.useContext(ConfigContext);
