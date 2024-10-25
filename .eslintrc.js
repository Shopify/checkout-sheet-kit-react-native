const path = require('path');

const modulePath = 'modules/@shopify/checkout-sheet-kit';
const moduleAbsolutePath = path.join(__dirname, modulePath);

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: '@react-native',
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    'no-console': 'error',
  },
  overrides: [
    // Sample app files
    {
      files: ['sample/**/*.ts', 'sample/**/*.tsx'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-shadow': 'off',
      },
    },
    // Module files
    {
      files: [
        path.join(modulePath, 'src/**/*.ts'),
        path.join(modulePath, 'src/**/*.tsx'),
      ],
      parserOptions: {
        project: path.join(moduleAbsolutePath, 'tsconfig.build.json'),
      },
    },
  ],
};
