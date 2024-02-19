const path = require('path');

const root = path.resolve(__dirname, '..');

module.exports = {
  dependencies: {
    react: {
      root: path.resolve(root, 'node_modules', 'react'),
    },
    'react-native': {
      root: path.resolve(root, 'node_modules', 'react-native'),
    },
    'react-native-gesture-handler': {
      root: path.resolve(root, 'node_modules', 'react-native-gesture-handler'),
    },
    '@shopify/checkout-sheet-kit': {
      root: path.resolve(root, 'modules', '@shopify/checkout-sheet-kit'),
    },
    ...(process.env.NO_FLIPPER
      ? {'react-native-flipper': {platforms: {ios: null}}}
      : {}),
  },
};
