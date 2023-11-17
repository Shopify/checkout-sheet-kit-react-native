import React, {
  PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Appearance, ColorSchemeName} from 'react-native';
import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import {
  ColorScheme,
  ShopifyCheckoutConfiguration,
} from '../../../package/ShopifyCheckout';

interface Context {
  colors: Colors;
  colorScheme: ShopifyCheckoutConfiguration['colorScheme'];
  preference: ColorSchemeName;
  setColorScheme: (colorScheme: ColorScheme) => void;
}

const darkColors: Colors = {
  background: '#1D1D1F',
  backgroundSubdued: '#222',
  border: '#333336',
  text: '#fff',
  textSubdued: '#eee',
  primary: '#0B96F1',
  primaryText: '#fff',
  secondary: '#0087ff',
  secondaryText: '#fff',
};

const lightColors: Colors = {
  background: '#eee',
  backgroundSubdued: '#fff',
  border: '#eee',
  text: '#000',
  textSubdued: '#a3a3a3',
  primary: '#0087ff',
  primaryText: '#fff',
  secondary: '#000',
  secondaryText: '#fff',
};

const webColors = {
  background: '#f0f0e8',
  backgroundSubdued: '#e8e8e0',
  border: '#d0d0cd',
  text: '#000',
  textSubdued: '#a3a3a3',
  primary: '#2c2a38',
  primaryText: '#0087ff',
  secondary: '#000',
  secondaryText: '#fff',
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

function getColors(
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
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultValue);
  const [preference, setThemePreference] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    const {remove} = Appearance.addChangeListener(({colorScheme}) => {
      setThemePreference(colorScheme);
    });

    return remove;
  });

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
