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
  Appearance,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import pkg from '../../../package.json';
import {useConfig} from '../context/Config';
import {
  ColorScheme,
  useShopifyCheckoutSheet,
} from '@shopify/checkout-sheet-kit';
import type {PrivacyConsent} from '@shopify/checkout-sheet-kit';
import type {Colors} from '../context/Theme';
import {darkColors, getColors, lightColors, useTheme} from '../context/Theme';
import {useCart} from '../context/Cart';

enum SectionType {
  Switch = 'switch',
  SingleSelect = 'single-select',
  Text = 'text',
}

interface SwitchItem {
  type: SectionType.Switch;
  title: string;
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
  const {config, appConfig, setConfig, setAppConfig} = useConfig();
  const {colors} = useTheme();
  const styles = createStyles(colors);

  const handleColorSchemeChange = (item: SingleSelectItem) => {
    const updatedColors = getColors(item.value, Appearance.getColorScheme());

    if (item.value === ColorScheme.automatic) {
      setConfig({
        colorScheme: ColorScheme.automatic,
        colors: {
          ios: {
            backgroundColor: updatedColors.webviewBackgroundColor,
            tintColor: updatedColors.webViewProgressIndicator,
          },
          android: {
            light: {
              backgroundColor: lightColors.webviewBackgroundColor,
              progressIndicator: lightColors.webViewProgressIndicator,
              headerBackgroundColor: lightColors.webviewBackgroundColor,
              headerTextColor: lightColors.webviewHeaderTextColor,
            },
            dark: {
              backgroundColor: darkColors.webviewBackgroundColor,
              progressIndicator: darkColors.webViewProgressIndicator,
              headerBackgroundColor: darkColors.webviewBackgroundColor,
              headerTextColor: darkColors.webviewHeaderTextColor,
            },
          },
        },
      });
    } else {
      setConfig({
        colorScheme: item.value,
        colors: {
          ios: {
            backgroundColor: updatedColors.webviewBackgroundColor,
            tintColor: updatedColors.webViewProgressIndicator,
          },
          android: {
            backgroundColor: updatedColors.webviewBackgroundColor,
            progressIndicator: updatedColors.webViewProgressIndicator,
            headerBackgroundColor: updatedColors.webviewBackgroundColor,
            headerTextColor: updatedColors.webviewHeaderTextColor,
          },
        },
      });
    }
  };

  const handleTogglePreloading = useCallback(() => {
    setConfig({
      preloading: !config?.preloading,
    });
  }, [config?.preloading, setConfig]);

  const handleTogglePrefill = useCallback(() => {
    clearCart();
    setAppConfig({
      prefillBuyerInformation: !appConfig.prefillBuyerInformation,
    });
  }, [appConfig.prefillBuyerInformation, clearCart, setAppConfig]);

  const handlePrivacyConsentChange = useCallback(
    (consentType: keyof PrivacyConsent) => {
      const currentConsent = config?.privacyConsent || {};
      const newConsent = {
        ...currentConsent,
        [consentType]: !currentConsent[consentType],
      };

      setConfig({
        privacyConsent: newConsent,
      });
    },
    [config?.privacyConsent, setConfig],
  );

  const configurationOptions: readonly SwitchItem[] = useMemo(
    () => [
      {
        title: 'Preload checkout',
        type: SectionType.Switch,
        value: config?.preloading ?? false,
        handler: handleTogglePreloading,
      },
      {
        title: 'Prefill buyer information',
        type: SectionType.Switch,
        value: appConfig.prefillBuyerInformation ?? false,
        handler: handleTogglePrefill,
      },
    ],
    [
      appConfig.prefillBuyerInformation,
      config?.preloading,
      handleTogglePrefill,
      handleTogglePreloading,
    ],
  );

  const themeOptions: readonly SingleSelectItem[] = useMemo(
    () => [
      {
        title: 'Automatic',
        type: SectionType.SingleSelect,
        value: ColorScheme.automatic,
        selected: config?.colorScheme === ColorScheme.automatic,
      },
      {
        title: 'Light',
        type: SectionType.SingleSelect,
        value: ColorScheme.light,
        selected: config?.colorScheme === ColorScheme.light,
      },
      {
        title: 'Dark',
        type: SectionType.SingleSelect,
        value: ColorScheme.dark,
        selected: config?.colorScheme === ColorScheme.dark,
      },
      {
        title: 'Web',
        type: SectionType.SingleSelect,
        value: ColorScheme.web,
        selected: config?.colorScheme === ColorScheme.web,
      },
    ],
    [config?.colorScheme],
  );

  const privacyConsentOptions: readonly SwitchItem[] = useMemo(
    () => [
      {
        title: 'Marketing',
        type: SectionType.Switch,
        value: config?.privacyConsent?.marketing ?? false,
        handler: () => handlePrivacyConsentChange('marketing'),
      },
      {
        title: 'Analytics',
        type: SectionType.Switch,
        value: config?.privacyConsent?.analytics ?? false,
        handler: () => handlePrivacyConsentChange('analytics'),
      },
      {
        title: 'Preferences',
        type: SectionType.Switch,
        value: config?.privacyConsent?.preferences ?? false,
        handler: () => handlePrivacyConsentChange('preferences'),
      },
      {
        title: 'Sale of Data',
        type: SectionType.Switch,
        value: config?.privacyConsent?.saleOfData ?? false,
        handler: () => handlePrivacyConsentChange('saleOfData'),
      },
    ],
    [config?.privacyConsent, handlePrivacyConsentChange],
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
        title: 'Privacy Consent Signals',
        data: privacyConsentOptions,
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
    [
      themeOptions,
      configurationOptions,
      privacyConsentOptions,
      informationalItems,
    ],
  );

  return (
    <SafeAreaView>
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
    </SafeAreaView>
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
      alignSelf: 'center',
      color: colors.text,
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
