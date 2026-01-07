type Listener = {eventName: string; callback: (data: any) => void};

function createMockEmitter() {
  let listeners: Listener[] = [];

  const addListener = jest.fn(
    (eventName: string, callback: (data: any) => void) => {
      listeners.push({eventName, callback});
      return {remove: jest.fn()};
    },
  );

  const removeAllListeners = jest.fn((eventName?: string) => {
    if (eventName) {
      listeners = listeners.filter(l => l.eventName !== eventName);
    } else {
      listeners = [];
    }
  });

  const emit = jest.fn((eventName: string, data: any) => {
    const callbacks = listeners
      .filter(l => l.eventName === eventName)
      .map(l => l.callback);
    callbacks.forEach(cb => cb(data));
    // Clear listeners after emit to avoid cross-test leakage
    listeners = [];
  });

  return {addListener, removeAllListeners, emit};
}

const requireNativeComponent = (..._args: any[]) => {
  const React = require('react');
  return (props: any) =>
    React.createElement('View', {
      ...props,
      testID: props?.testID ?? 'accelerated-checkout-buttons',
    });
};

const StyleSheet = {
  flatten: jest.fn(style => style),
};

const UIManager = {
  getViewManagerConfig: jest.fn(() => ({
    Commands: {
      respondToEvent: 'respondToEvent',
      reload: 'reload',
    },
  })),
  dispatchViewManagerCommand: jest.fn(),
};

const findNodeHandle = jest.fn(() => 1);

const exampleConfig = {preloading: true};

const ShopifyCheckoutSheetKit = {
  version: '0.7.0',
  preload: jest.fn(),
  present: jest.fn(),
  dismiss: jest.fn(),
  invalidateCache: jest.fn(),
  getConfig: jest.fn(async () => exampleConfig),
  setConfig: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListeners: jest.fn(),
  initiateGeolocationRequest: jest.fn(),
  configureAcceleratedCheckouts: jest.fn(),
  isAcceleratedCheckoutAvailable: jest.fn(),
};

// CommonJS export for Jest manual mock resolution
module.exports = {
  Platform: {OS: 'ios'},
  PermissionsAndroid: {
    requestMultiple: jest.fn(async () => ({})),
  },
  NativeEventEmitter: jest.fn(() => createMockEmitter()),
  requireNativeComponent,
  NativeModules: {
    ShopifyCheckoutSheetKit: {
      ...ShopifyCheckoutSheetKit,
      eventEmitter: createMockEmitter(),
    },
  },
  StyleSheet,
  UIManager,
  findNodeHandle,
};
