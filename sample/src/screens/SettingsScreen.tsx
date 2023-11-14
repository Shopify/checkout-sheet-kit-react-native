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
  value: string;
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
  const {config, configure} = useConfig();
  const {colors} = useTheme();
  const styles = createStyles(colors);

  const handleColorSchemeChange = (item: SingleSelectItem) => {
    configure({
      colorScheme: item.value,
    });
  };

  const handleTogglePreloading = useCallback(() => {
    configure({
      preloading: !config?.preloading,
    });
  }, [config?.preloading, configure]);

  const configurationOptions: readonly SwitchItem[] = useMemo(
    () => [
      {
        title: 'Preload checkout',
        type: SectionType.Switch,
        value: config?.preloading ?? false,
        handler: handleTogglePreloading,
      },
    ],
    [config?.preloading, handleTogglePreloading],
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
    [],
  );

  const sections: SectionData[] = useMemo(
    () => [
      {
        title: 'Configuration',
        data: configurationOptions,
      },
      {
        title: 'Theme',
        data: themeOptions,
      },
      {
        title: 'Information',
        data: informationalItems,
      },
    ],
    [themeOptions, configurationOptions, informationalItems],
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
