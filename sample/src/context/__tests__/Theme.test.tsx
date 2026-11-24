import React from 'react';
import type {PropsWithChildren} from 'react';
import {act, renderHook} from '@testing-library/react-native';
import {Appearance} from 'react-native';
import {ColorScheme} from '@shopify/checkout-sheet-kit';
import {ThemeProvider, useTheme} from '../Theme';

jest.mock('react-native', () => ({
  ...jest.requireActual('../../../../__mocks__/react-native'),
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
    setColorScheme: jest.fn(),
  },
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('@react-navigation/native', () => ({
  DarkTheme: {dark: true, colors: {}},
  DefaultTheme: {dark: false, colors: {}},
}));

it('restores the system appearance after selecting an explicit theme', () => {
  const wrapper = ({children}: PropsWithChildren) => (
    <ThemeProvider defaultValue={ColorScheme.light} cornerRadius={35}>
      {children}
    </ThemeProvider>
  );
  const {result} = renderHook(useTheme, {wrapper});

  act(() => result.current.setColorScheme(ColorScheme.dark));
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');

  act(() => result.current.setColorScheme(ColorScheme.automatic));
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('auto');
  expect(result.current.colorScheme).toBe(ColorScheme.automatic);
});
