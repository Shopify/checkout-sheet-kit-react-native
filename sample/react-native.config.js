const path = require('path');
const pkg = require('../modules/checkout-sheet-kit/package.json');

const root = path.resolve(__dirname, '..');
const pod = path.resolve(root, 'modules', 'checkout-sheet-kit');

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
