function createNativeModule(version: string) {
  return {
    version,
    getConstants: jest.fn(() => ({version})),
    preload: jest.fn(),
    present: jest.fn(),
    dismiss: jest.fn(),
    invalidateCache: jest.fn(),
    getConfig: jest.fn(() => ({
      preloading: true,
      colorScheme: 'automatic',
      logLevel: 'error',
    })),
    setConfig: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListeners: jest.fn(),
    initiateGeolocationRequest: jest.fn(),
    configureAcceleratedCheckouts: jest.fn(() => true),
    isAcceleratedCheckoutAvailable: jest.fn(() => true),
    isApplePayAvailable: jest.fn(() => true),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };
}

function createLegacyNativeModule(version: string) {
  const {getConstants: _getConstants, ...nativeModule} =
    createNativeModule(version);

  return nativeModule;
}

function mockReactNative({
  turboModule,
  legacyModule,
}: {
  turboModule?: ReturnType<typeof createNativeModule> | null;
  legacyModule?:
    | ReturnType<typeof createNativeModule>
    | ReturnType<typeof createLegacyNativeModule>
    | null;
}) {
  jest.doMock('react-native', () => ({
    NativeModules: legacyModule ? {ShopifyCheckoutSheetKit: legacyModule} : {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    PermissionsAndroid: {
      requestMultiple: jest.fn(async () => ({})),
    },
    Platform: {
      OS: 'ios',
      Version: '16.0',
    },
    TurboModuleRegistry: {
      get: jest.fn((name: string) =>
        name === 'ShopifyCheckoutSheetKit' ? turboModule : null,
      ),
      getEnforcing: jest.fn((name: string) => {
        if (name === 'ShopifyCheckoutSheetKit' && turboModule) {
          return turboModule;
        }
        throw new Error(
          `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found.`,
        );
      }),
    },
    codegenNativeComponent: jest.fn(() => 'RCTAcceleratedCheckoutButtons'),
    requireNativeComponent: jest.fn(() => 'RCTAcceleratedCheckoutButtons'),
    StyleSheet: {
      flatten: jest.fn(style => style),
    },
  }));
}

describe('Native Module Linking', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('react-native');
  });

  it('uses the TurboModule when it is available', () => {
    mockReactNative({turboModule: createNativeModule('turbo')});

    const {ShopifyCheckoutSheet} = require('../src');
    const checkoutSheet = new ShopifyCheckoutSheet();

    expect(checkoutSheet.version).toBe('turbo');
  });

  it('falls back to the legacy NativeModules bridge', () => {
    mockReactNative({
      turboModule: null,
      legacyModule: createLegacyNativeModule('legacy'),
    });

    const {ShopifyCheckoutSheet} = require('../src');
    const checkoutSheet = new ShopifyCheckoutSheet();

    expect(checkoutSheet.version).toBe('legacy');
  });

  it('throws error when native module is not linked', () => {
    mockReactNative({turboModule: null, legacyModule: null});

    expect(() => {
      require('../src');
    }).toThrow('ShopifyCheckoutSheetKit');
  });
});
