const path = require('path');

const root = path.resolve(__dirname, '..');

const resolvePackageRoot = packageName =>
  path.dirname(
    require.resolve(`${packageName}/package.json`, {
      paths: [root, __dirname],
    }),
  );

module.exports = {
  dependencies: {
    '@react-native-masked-view/masked-view': {
      root: resolvePackageRoot('@react-native-masked-view/masked-view'),
    },
    react: {
      root: resolvePackageRoot('react'),
    },
    'react-native': {
      root: resolvePackageRoot('react-native'),
    },
    'react-native-config': {
      root: resolvePackageRoot('react-native-config'),
    },
    'react-native-encrypted-storage': {
      root: resolvePackageRoot('react-native-encrypted-storage'),
    },
    'react-native-gesture-handler': {
      root: resolvePackageRoot('react-native-gesture-handler'),
    },
    'react-native-nitro-modules': {
      root: resolvePackageRoot('react-native-nitro-modules'),
    },
    'react-native-quick-base64': {
      root: resolvePackageRoot('react-native-quick-base64'),
    },
    'react-native-quick-crypto': {
      root: resolvePackageRoot('react-native-quick-crypto'),
    },
    'react-native-reanimated': {
      root: resolvePackageRoot('react-native-reanimated'),
    },
    'react-native-safe-area-context': {
      root: resolvePackageRoot('react-native-safe-area-context'),
    },
    'react-native-screens': {
      root: resolvePackageRoot('react-native-screens'),
    },
    'react-native-vector-icons': {
      root: resolvePackageRoot('react-native-vector-icons'),
    },
    'react-native-webview': {
      root: resolvePackageRoot('react-native-webview'),
    },
    '@shopify/checkout-sheet-kit': {
      root: path.resolve(root, 'modules', '@shopify/checkout-sheet-kit'),
    },
  },
};
