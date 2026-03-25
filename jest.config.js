module.exports = {
  preset: 'react-native',
  modulePathIgnorePatterns: ['modules/@shopify/checkout-sheet-kit/lib'],
  modulePaths: ['<rootDir>/sample/node_modules'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    'react-native/Libraries/Utilities/codegenNativeComponent':
      '<rootDir>/__mocks__/codegenNativeComponent.ts',
  },
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
