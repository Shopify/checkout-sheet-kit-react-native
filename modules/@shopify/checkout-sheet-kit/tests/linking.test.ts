jest.mock('react-native', () => ({
  NativeModules: {},
  NativeEventEmitter: jest.fn(),
  Platform: {
    OS: 'ios',
  },
  TurboModuleRegistry: {
    getEnforcing: jest.fn((name: string) => {
      throw new Error(
        `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found.`,
      );
    }),
  },
}));

describe('Native Module Linking', () => {
  it('throws error when native module is not linked', () => {
    expect(() => {
      require('../src/index');
    }).toThrow('ShopifyCheckoutSheetKit');
  });
});
