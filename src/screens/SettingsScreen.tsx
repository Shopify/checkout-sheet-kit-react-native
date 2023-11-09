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

import React, {useReducer} from 'react';
import {
  SafeAreaView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

function SettingsScreen() {
  const [preloadEnabled, togglePreload] = useReducer(
    enabled => !enabled,
    false,
  );
  const [prefillEnabled, togglePrefill] = useReducer(
    enabled => !enabled,
    false,
  );

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
                value: preloadEnabled,
                handler: togglePreload,
              },
              {
                title: 'Prefill buyer information',
                type: 'switch',
                value: prefillEnabled,
                handler: togglePrefill,
              },
            ],
          },
          {
            type: 'multi-select',
            title: 'Theme',
            data: [
              {title: 'Automatic', type: 'multi-select', selected: false},
              {title: 'Light', type: 'multi-select', selected: false},
              {title: 'Dark', type: 'multi-select', selected: false},
              {title: 'Web', type: 'multi-select', selected: false},
            ],
          },
        ]}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemText}>{item.title}</Text>
            {item.type === 'switch' && (
              <Switch
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor="#fff"
                ios_backgroundColor="#eee"
                onValueChange={item.handler}
                value={item.value}
                style={styles.listItemSwitch}
              />
            )}
          </View>
        )}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.section}>
            <Text style={styles.sectionText}>{title}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    marginBottom: -1,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    alignSelf: 'center',
  },
  listItemSwitch: {},
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionText: {
    fontSize: 13,
    color: '#9f9f9f',
  },
});

export default SettingsScreen;
