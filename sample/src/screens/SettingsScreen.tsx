/*
MIT License

Copyright 2023 - Present, Shopify Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import React, {useCallback, useMemo} from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import pkg from '../../../package.json';
import Config from 'react-native-config';
import {useConfig} from '../context/Config';
import {
  ColorScheme,
  useShopifyCheckoutSheet,
} from '@shopify/checkout-sheet-kit';
import type {Colors} from '../context/Theme';
import {useTheme} from '../context/Theme';
import {useCart} from '../context/Cart';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

enum SectionType {
  Switch = 'switch',
  SingleSelect = 'single-select',
  Text = 'text',
}

interface SwitchItem {
  type: SectionType.Switch;
  title: string;
  description?: string;
  value: boolean;
  handler: () => void;
}

interface SingleSelectItem {
  type: SectionType.SingleSelect;
  title: string;
  value: ColorScheme;
  selected: boolean;
}

interface TextItem {
  type: SectionType.Text;
  title: string;
  value?: string;
}

function isSwitchItem(item: any): item is SwitchItem {
  return item.type === SectionType.Switch;
}

function isSingleSelectItem(item: any): item is SingleSelectItem {
  return item.type === SectionType.SingleSelect;
}

function isTextItem(item: any): item is TextItem {
  return item.type === SectionType.Text;
}

interface SectionData {
  title: string;
  data: readonly (SwitchItem | SingleSelectItem | TextItem)[];
}

function SettingsScreen() {
  const ShopifyCheckout = useShopifyCheckoutSheet();
  const {clearCart} = useCart();
  const {appConfig, setAppConfig} = useConfig();
  const {colors, setColorScheme} = useTheme();
  const styles = createStyles(colors);
  const safeAreaInsets = useSafeAreaInsets();

  const handleColorSchemeChange = useCallback(
    (item: SingleSelectItem) => {
      setAppConfig({
        ...appConfig,
        colorScheme: item.value,
      });
      setColorScheme(item.value);
    },
    [appConfig, setAppConfig, setColorScheme],
  );

  const handleTogglePreloading = useCallback(() => {
    setAppConfig({
      ...appConfig,
      enablePreloading: !appConfig.enablePreloading,
    });
  }, [appConfig, setAppConfig]);

  const handleTogglePrefill = useCallback(() => {
    clearCart();
    setAppConfig({
      ...appConfig,
      prefillBuyerInformation: !appConfig.prefillBuyerInformation,
      customerAuthenticated: !appConfig.customerAuthenticated,
    });
  }, [appConfig, clearCart, setAppConfig]);

  const handleToggleCustomerAuthenticated = useCallback(() => {
    setAppConfig({
      ...appConfig,
      customerAuthenticated: !appConfig.customerAuthenticated,
    });
  }, [appConfig, setAppConfig]);

  const configurationOptions: readonly SwitchItem[] = useMemo(
    () => [
      {
        title: 'Preload checkout',
        type: SectionType.Switch,
        value: appConfig.enablePreloading,
        handler: handleTogglePreloading,
      },
      {
        title: 'Prefill buyer information',
        type: SectionType.Switch,
        value: appConfig.prefillBuyerInformation,
        handler: handleTogglePrefill,
      },
      {
        title: 'Use authenticated customer',
        description:
          'When toggled on, customer information will be attached to cart from your app settings. When toggled off, customer information will be collected from the Apple Pay sheet.',
        type: SectionType.Switch,
        value: appConfig.customerAuthenticated,
        handler: handleToggleCustomerAuthenticated,
      },
    ],
    [
      appConfig,
      handleTogglePrefill,
      handleTogglePreloading,
      handleToggleCustomerAuthenticated,
    ],
  );

  const themeOptions: readonly SingleSelectItem[] = useMemo(
    () => [
      {
        title: 'Automatic',
        type: SectionType.SingleSelect,
        value: ColorScheme.automatic,
        selected: appConfig.colorScheme === ColorScheme.automatic,
      },
      {
        title: 'Light',
        type: SectionType.SingleSelect,
        value: ColorScheme.light,
        selected: appConfig.colorScheme === ColorScheme.light,
      },
      {
        title: 'Dark',
        type: SectionType.SingleSelect,
        value: ColorScheme.dark,
        selected: appConfig.colorScheme === ColorScheme.dark,
      },
      {
        title: 'Web',
        type: SectionType.SingleSelect,
        value: ColorScheme.web,
        selected: appConfig.colorScheme === ColorScheme.web,
      },
    ],
    [appConfig.colorScheme],
  );

  const informationalItems: readonly TextItem[] = useMemo(
    () => [
      {
        title: 'SDK version',
        type: SectionType.Text,
        value: ShopifyCheckout.version,
      },
      {
        title: 'App version',
        type: SectionType.Text,
        value: pkg.version,
      },
      {
        title: 'Storefront Domain',
        type: SectionType.Text,
        value: Config.STOREFRONT_DOMAIN || 'undefined',
      },
    ],
    [ShopifyCheckout.version],
  );

  const sections: SectionData[] = useMemo(
    () => [
      {
        title: 'Features',
        data: configurationOptions,
      },
      {
        title: 'Theme',
        data: themeOptions,
      },
      {
        title: 'Versions',
        data: informationalItems,
      },
    ],
    [themeOptions, configurationOptions, informationalItems],
  );

  return (
    <View style={safeAreaInsets}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.title}
        renderItem={({item}) => {
          if (isSwitchItem(item)) {
            return (
              <SwitchItem styles={styles} item={item} onChange={item.handler} />
            );
          }

          if (isSingleSelectItem(item)) {
            return (
              <SelectItem
                item={item}
                styles={styles}
                onPress={() => handleColorSchemeChange(item)}
              />
            );
          }

          if (isTextItem(item)) {
            return <TextItem item={item} styles={styles} />;
          }

          return null;
        }}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.section}>
            <Text style={styles.sectionText}>{title}</Text>
          </View>
        )}
      />
    </View>
  );
}

interface SwitchItemProps {
  item: SwitchItem;
  styles: ReturnType<typeof createStyles>;
  onChange: () => void;
}

interface SelectItemProps {
  item: SingleSelectItem;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}

interface TextItemProps {
  item: TextItem;
  styles: ReturnType<typeof createStyles>;
}

function SwitchItem({item, styles, onChange}: SwitchItemProps) {
  return (
    <View>
      <View style={styles.listItem}>
        <Text style={styles.listItemText}>{item.title}</Text>
        <Switch
          trackColor={{false: '#767577', true: '#81b0ff'}}
          thumbColor="#fff"
          ios_backgroundColor="#eee"
          onValueChange={onChange}
          value={item.value}
          style={styles.listItemSwitch}
        />
      </View>
      {item.description && (
        <Text style={styles.listItemDescription}>{item.description}</Text>
      )}
    </View>
  );
}

function SelectItem({item, styles, onPress}: SelectItemProps) {
  return (
    <Pressable style={styles.listItem} onPress={onPress}>
      <Text style={styles.listItemText}>{item.title}</Text>

      {item.selected && <Text style={styles.listItemCheck}>✓</Text>}
    </Pressable>
  );
}

function TextItem({item, styles}: TextItemProps) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>{item.title}</Text>
      <Text style={styles.listItemSecondaryText}>{item.value}</Text>
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    list: {
      borderColor: colors.border,
      borderTopWidth: 1,
    },
    listItem: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      padding: 10,
      backgroundColor: colors.backgroundSubdued,
      borderColor: colors.border,
      borderBottomWidth: 1,
    },
    listItemText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    listItemDescription: {
      color: colors.textSubdued,
      fontSize: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    listItemSecondaryText: {
      color: colors.textSubdued,
    },
    listItemSwitch: {},
    listItemCheck: {
      color: colors.secondary,
      fontWeight: 'bold',
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    sectionText: {
      fontSize: 13,
      color: '#9f9f9f',
      marginTop: 10,
      marginBottom: -10,
    },
  });
}

export default SettingsScreen;
