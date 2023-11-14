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

import React, {useCallback} from 'react';
import {
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
import ShopifyCheckout, {ColorScheme} from '../../../package/ShopifyCheckout';
import {Colors, useTheme} from '../context/Theme';

function SettingsScreen() {
  const {config, configure} = useConfig();
  const {colors} = useTheme();
  const styles = createStyles(colors);

  function isSelected(theme: string) {
    return config?.colorScheme === theme;
  }

  const handleColorSchemeChange = (colorScheme: ColorScheme) => () => {
    configure({
      colorScheme,
    });
  };

  const handleTogglePreloading = useCallback(() => {
    configure({
      preloading: !config?.preloading,
    });
  }, [config?.preloading, configure]);

  return (
    <SafeAreaView>
      <SectionList
        sections={[
          {
            type: 'switch',
            title: 'Configuration',
            data: [
              {
                title: 'Preload checkout',
                type: 'switch',
                value: config?.preloading ?? false,
                handler: handleTogglePreloading,
              },
            ],
          },
          {
            type: 'single-select',
            title: 'Theme',
            data: [
              {
                title: 'Automatic',
                type: 'single-select',
                value: ColorScheme.automatic,
                selected: isSelected(ColorScheme.automatic),
              },
              {
                title: 'Light',
                type: 'single-select',
                value: ColorScheme.light,
                selected: isSelected(ColorScheme.light),
              },
              {
                title: 'Dark',
                type: 'single-select',
                value: ColorScheme.dark,
                selected: isSelected(ColorScheme.dark),
              },
              {
                title: 'Web',
                type: 'single-select',
                value: ColorScheme.web,
                selected: isSelected(ColorScheme.web),
              },
            ],
          },
          {
            type: 'text',
            title: 'Information',
            data: [
              {
                title: 'SDK version',
                type: 'text',
                value: ShopifyCheckout.version,
              },
              {
                title: 'App version',
                type: 'text',
                value: pkg.version,
              },
            ],
          },
        ]}
        keyExtractor={item => item.title}
        renderItem={({item}) => {
          switch (item.type) {
            case 'switch':
              return (
                <SwitchItem
                  styles={styles}
                  item={item}
                  onChange={item.handler}
                />
              );
            case 'single-select':
              return (
                <SelectItem
                  item={item}
                  styles={styles}
                  onPress={handleColorSchemeChange(item.value as ColorScheme)}
                />
              );
            case 'text':
              return <TextItem item={item} styles={styles} />;
            default:
              return null;
          }
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
  item: {
    title: string;
    value: boolean;
  };
  styles: ReturnType<typeof createStyles>;
  onChange: () => void;
}

interface SelectItemProps {
  item: {
    title: string;
    value: string;
    selected: boolean;
  };
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}

interface TextItemProps {
  item: {
    title: string;
    value: string;
  };
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
      borderTopWidth: 1,
      marginBottom: -1,
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
      color: colors.primaryText,
      fontWeight: 'bold',
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    sectionText: {
      fontSize: 13,
      color: '#9f9f9f',
    },
  });
}

export default SettingsScreen;
