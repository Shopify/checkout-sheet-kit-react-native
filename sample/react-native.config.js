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
    'react-native-shopify-checkout-kit': {
      root: path.resolve(root, 'modules', 'react-native-shopify-checkout-kit'),
    },
    ...(process.env.NO_FLIPPER
      ? {'react-native-flipper': {platforms: {ios: null}}}
      : {}),
  },
};
