module.exports = {
  preset: 'react-native',
  modulePathIgnorePatterns: ['modules/@shopify/checkout-sheet-kit/lib'],
  modulePaths: ['<rootDir>/sample/node_modules'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
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
