const path = require('path');
const pkg = require('../modules/react-native-shopify-checkout-kit/package.json');

const root = path.resolve(__dirname, '..');
const pod = path.resolve(root, 'modules', 'react-native-shopify-checkout-kit');

module.exports = {
  dependencies: {
    [pkg.name]: {
      root: pod,
    },
    ...(process.env.NO_FLIPPER
      ? {'react-native-flipper': {platforms: {ios: null}}}
      : {}),
  },
};
