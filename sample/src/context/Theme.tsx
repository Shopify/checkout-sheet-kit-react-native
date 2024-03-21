import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {Appearance, ColorSchemeName, useColorScheme} from 'react-native';
import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import {ColorScheme} from '@shopify/checkout-sheet-kit';

interface Context {
  colors: Colors;
  colorScheme: ColorScheme;
  preference: ColorSchemeName;
  setColorScheme: (colorScheme: ColorScheme) => void;
}

export const darkColors: Colors = {
  background: '#1D1D1F',
  backgroundSubdued: '#222',
  border: '#333336',
  text: '#fff',
  textSubdued: '#eee',
  primary: '#0B96F1',
  primaryText: '#fff',
  secondary: '#0087ff',
  secondaryText: '#fff',

  webviewBackgroundColor: '#1D1D1F',
  webViewProgressIndicator: '#0B96F1',
  webviewHeaderBackgroundColor: '#1D1D1F',
  webviewHeaderTextColor: '#ffffff',
};

export const lightColors: Colors = {
  background: '#eee',
  backgroundSubdued: '#fff',
  border: '#eee',
  text: '#000',
  textSubdued: '#a3a3a3',
  primary: '#0087ff',
  primaryText: '#fff',
  secondary: '#000',
  secondaryText: '#fff',

  webviewBackgroundColor: '#ffffff',
  webViewProgressIndicator: '#0087ff',
  webviewHeaderBackgroundColor: '#ffffff',
  webviewHeaderTextColor: '#000000',
};

export const webColors: Colors = {
  background: '#f0f0e8',
  backgroundSubdued: '#e8e8e0',
  border: '#d0d0cd',
  text: '#2d2a38',
  textSubdued: '#a3a3a3',
  primary: '#2c2a38',
  primaryText: '#0087ff',
  secondary: '#2d2a38',
  secondaryText: '#fff',

  webviewBackgroundColor: '#f0f0e8',
  webViewProgressIndicator: '#2c2a38',
  webviewHeaderBackgroundColor: '#f0f0e8',
  webviewHeaderTextColor: '#2c2a38',
};

const ThemeContext = createContext<Context>({
  colorScheme: ColorScheme.automatic,
  colors: lightColors,
  preference: Appearance.getColorScheme(),
  setColorScheme() {},
});

export interface Colors {
  background: string;
  backgroundSubdued: string;
  border: string;
  text: string;
  textSubdued: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  webviewBackgroundColor: string;
  webViewProgressIndicator: string;
  webviewHeaderBackgroundColor: string;
  webviewHeaderTextColor: string;
}

export function getNavigationTheme(
  colorScheme: ColorScheme,
  preference: ColorSchemeName,
) {
  const colors = getColors(colorScheme, preference);
  const primary = '#0087ff';

  const light = {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary,
      background: colors.background,
      card: colors.backgroundSubdued,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  const dark = {
    ...DarkTheme,
    dark: true,
    colors: {
      ...DarkTheme.colors,
      primary,
      background: colors.background,
      card: colors.backgroundSubdued,
      text: colors.primaryText,
      border: colors.border,
      notification: colors.primary,
    },
  };

  const web = {
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary,
      background: colors.background,
      card: colors.backgroundSubdued,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  switch (colorScheme) {
    case ColorScheme.automatic:
      return preference === 'dark' ? dark : light;
    case ColorScheme.dark:
      return dark;
    case ColorScheme.web:
      return web;
    default:
      return light;
  }
}

export function getColors(
  colorScheme: ColorScheme,
  preference: ColorSchemeName,
): Colors {
  switch (colorScheme) {
    case ColorScheme.automatic:
      return preference === 'dark' ? darkColors : lightColors;
    case ColorScheme.dark:
      return darkColors;
    case ColorScheme.web:
      return webColors;
    default:
      return lightColors;
  }
}

export const ThemeProvider: React.FC<
  PropsWithChildren<{defaultValue: ColorScheme}>
> = ({children, defaultValue = ColorScheme.automatic}) => {
  const preference = useColorScheme();
  const [colorScheme, setColorSchemeInternal] =
    useState<ColorScheme>(defaultValue);

  const setColorScheme = useCallback((colorScheme: ColorScheme) => {
    if (colorScheme !== ColorScheme.automatic) {
      Appearance.setColorScheme(
        colorScheme === ColorScheme.dark ? 'dark' : 'light',
      );
    }
    setColorSchemeInternal(colorScheme);
  }, []);

  const value = useMemo(
    () => ({
      colors: getColors(colorScheme, preference),
      preference,
      colorScheme,
      setColorScheme,
    }),
    [preference, colorScheme, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);
