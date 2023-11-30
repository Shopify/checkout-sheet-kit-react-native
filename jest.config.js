module.exports = {
  preset: 'react-native',
  modulePathIgnorePatterns: ['modules/react-native-checkout-kit/lib'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      tsConfig: {
        importHelpers: true,
      },
    },
  },
};
