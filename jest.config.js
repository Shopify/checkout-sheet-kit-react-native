module.exports = {
  preset: 'react-native',
  modulePathIgnorePatterns: ['modules/checkout-sheet-kit/lib'],
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
