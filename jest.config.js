module.exports = {
  preset: '@react-native/jest-preset',
  modulePathIgnorePatterns: [
    '<rootDir>/modules/@shopify/checkout-sheet-kit/lib',
    '<rootDir>/build/',
    '<rootDir>/sample/ios/build/',
    '<rootDir>/test/rct-integration-app/',
  ],
  modulePaths: ['<rootDir>/sample/node_modules'],
  moduleNameMapper: {
    '^@shopify/checkout-sheet-kit$':
      '<rootDir>/modules/@shopify/checkout-sheet-kit/src',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@noble/hashes)/)',
  ],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
};
