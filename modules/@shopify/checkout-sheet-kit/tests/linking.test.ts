/**
 * Test for native module linking error
 */

// Mock NativeModules without ShopifyCheckoutSheetKit
jest.mock('react-native', () => ({
  NativeModules: {
    // Intentionally empty to trigger linking error
  },
  NativeEventEmitter: jest.fn(),
  Platform: {
    OS: 'ios',
  },
  requireNativeComponent: jest.fn().mockImplementation(() => {
    const mockComponent = (props: any) => {
      // Use React.createElement with plain object instead
      const mockReact = jest.requireActual('react');
      return mockReact.createElement('View', props);
    };
    return mockComponent;
  }),
}));

describe('Native Module Linking', () => {
  it('throws error when native module is not linked', () => {
    expect(() => {
      // This will trigger the linking check
      require('../src/index');
    }).toThrow('@shopify/checkout-sheet-kit" is not correctly linked.');
  });
});
