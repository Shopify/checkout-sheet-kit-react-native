const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const root = path.resolve(__dirname);
const sample = path.resolve(root, 'sample');

/**
 * Metro configuration
 *  https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = mergeConfig(getDefaultConfig(__dirname), {
  projectRoot: sample,

  watchFolders: [root],

  resolver: {
    extraNodeModules: {
      react: path.resolve(sample, 'node_modules', 'react'),
      'react-native': path.resolve(sample, 'node_modules', 'react-native'),
      'react-native-gesture-handler': path.resolve(
        root,
        'node_modules',
        'react-native-gesture-handler',
      ),
      '@shopify/checkout-sheet-kit': path.resolve(
        root,
        'modules',
        '@shopify/checkout-sheet-kit',
      ),
      '@react-navigation/native': path.resolve(
        sample,
        'node_modules',
        '@react-navigation/native',
      ),
      '@react-navigation/native-stack': path.resolve(
        sample,
        'node_modules',
        '@react-navigation/native-stack',
      ),
      'react-native-safe-area-context': path.resolve(
        sample,
        'node_modules',
        'react-native-safe-area-context',
      ),
      'react-native-screens': path.resolve(
        sample,
        'node_modules',
        'react-native-screens',
      ),
    },
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
});

module.exports = config;
