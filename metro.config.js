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
    resolveRequest: (context, moduleName, platform) => {
      if (
        moduleName === '@shopify/checkout-kit' ||
        moduleName.startsWith('@shopify/checkout-kit/')
      ) {
        const sub = moduleName.replace('@shopify/checkout-kit', '');
        const target = path.resolve(
          root,
          'modules',
          '@shopify/checkout-kit',
          'src',
          sub ? sub.replace(/^\//, '') : 'index.ts',
        );
        return {type: 'sourceFile', filePath: target};
      }
      return context.resolveRequest(context, moduleName, platform);
    },
    extraNodeModules: {
      react: path.resolve(sample, 'node_modules', 'react'),
      'react-native': path.resolve(sample, 'node_modules', 'react-native'),
      'react-native-gesture-handler': path.resolve(
        root,
        'node_modules',
        'react-native-gesture-handler',
      ),
      '@shopify/checkout-kit': path.resolve(
        root,
        'modules',
        '@shopify/checkout-kit',
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
