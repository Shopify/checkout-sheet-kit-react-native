import React, {useRef} from 'react';
import {render, act, renderHook, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {NativeModules, Platform, UIManager, findNodeHandle} from 'react-native';
import {
  ShopifyCheckoutSheetProvider,
  useShopifyCheckoutSheet,
  useShopifyEvent,
  useWebviewRegistration,
} from '../src/context';
import {ApplePayContactField, ColorScheme, type Configuration} from '../src';

const checkoutUrl = 'https://shopify.com/checkout';
const config: Configuration = {
  colorScheme: ColorScheme.automatic,
};

jest.mock('react-native');

const ContextConsumer = () => {
  const context = useShopifyCheckoutSheet();
  return <Text testID="context-ready">{String(context.version)}</Text>;
};

describe('ShopifyCheckoutSheetProvider', () => {
  const TestComponent = ({children}: {children: React.ReactNode}) => (
    <ShopifyCheckoutSheetProvider configuration={config}>
      {children}
    </ShopifyCheckoutSheetProvider>
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    const component = render(
      <TestComponent>
        <ContextConsumer />
      </TestComponent>,
    );

    await screen.findByTestId('context-ready');

    expect(component).toBeTruthy();
  });

  it('creates ShopifyCheckoutSheet instance with configuration', async () => {
    render(
      <TestComponent>
        <ContextConsumer />
      </TestComponent>,
    );

    await screen.findByTestId('context-ready');

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig,
    ).toHaveBeenCalledWith(config);
  });

  it('skips configuration when no configuration is provided', async () => {
    render(
      <ShopifyCheckoutSheetProvider>
        <ContextConsumer />
      </ShopifyCheckoutSheetProvider>,
    );

    await screen.findByTestId('context-ready');

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig,
    ).not.toHaveBeenCalled();
    expect(
      NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts,
    ).not.toHaveBeenCalled();
  });

  it('configures accelerated checkouts when provided', async () => {
    (Platform as any).Version = '17.0';
    (
      NativeModules.ShopifyCheckoutSheetKit
        .configureAcceleratedCheckouts as unknown as {mockResolvedValue: any}
    ).mockResolvedValue(true);

    const configWithAccelerated: Configuration = {
      ...config,
      acceleratedCheckouts: {
        storefrontDomain: 'test-shop.myshopify.com',
        storefrontAccessToken: 'shpat_test_token',
        customer: {
          email: 'test@example.com',
          phoneNumber: '+123',
          accessToken: 'customer-access-token',
        },
        wallets: {
          applePay: {
            merchantIdentifier: 'merchant.test',
            contactFields: [ApplePayContactField.email],
          },
        },
      },
    };

    render(
      <ShopifyCheckoutSheetProvider configuration={configWithAccelerated}>
        <ContextConsumer />
      </ShopifyCheckoutSheetProvider>,
    );

    await screen.findByTestId('context-ready');

    expect(
      NativeModules.ShopifyCheckoutSheetKit.configureAcceleratedCheckouts,
    ).toHaveBeenCalledWith(
      'test-shop.myshopify.com',
      'shpat_test_token',
      'test@example.com',
      '+123',
      'customer-access-token',
      'merchant.test',
      ['email'],
    );
  });

  it('reuses the same instance across re-renders', async () => {
    const {rerender} = render(
      <TestComponent>
        <ContextConsumer />
      </TestComponent>,
    );

    await screen.findByTestId('context-ready');

    rerender(
      <TestComponent>
        <ContextConsumer />
      </TestComponent>,
    );

    await screen.findByTestId('context-ready');

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig.mock.calls,
    ).toHaveLength(2);
  });
});

describe('useShopifyCheckoutSheet', () => {
  const Wrapper = ({children}: {children: React.ReactNode}) => (
    <ShopifyCheckoutSheetProvider configuration={config}>
      {children}
    </ShopifyCheckoutSheetProvider>
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('provides addEventListener function', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    expect(result.current.addEventListener).toBeDefined();
    expect(typeof result.current.addEventListener).toBe('function');
  });

  it('provides removeEventListeners function', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    act(() => {
      result.current.removeEventListeners('close');
    });

    expect(result.current.removeEventListeners).toBeDefined();
  });

  it('provides present function and calls it with checkoutUrl', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    act(() => {
      result.current.present(checkoutUrl);
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.present).toHaveBeenCalledWith(
      checkoutUrl,
      undefined,
    );
  });

  it('does not call present with empty checkoutUrl', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    act(() => {
      result.current.present('');
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.present,
    ).not.toHaveBeenCalled();
  });

  it('provides preload function and calls it with checkoutUrl', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    act(() => {
      result.current.preload(checkoutUrl);
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.preload).toHaveBeenCalledWith(
      checkoutUrl,
      undefined,
    );
  });

  it('does not call preload with empty checkoutUrl', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    act(() => {
      result.current.preload('');
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.preload,
    ).not.toHaveBeenCalled();
  });

  it('provides invalidate function', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    act(() => {
      result.current.invalidate();
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.invalidateCache,
    ).toHaveBeenCalled();
  });

  it('provides dismiss function', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    act(() => {
      result.current.dismiss();
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.dismiss).toHaveBeenCalled();
  });

  it('provides setConfig function', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    const newConfig = {colorScheme: ColorScheme.light};

    act(() => {
      result.current.setConfig(newConfig);
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig,
    ).toHaveBeenCalledWith(newConfig);
  });

  it('provides getConfig function', async () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    await act(async () => {
      const config = await result.current.getConfig();
      expect(config).toEqual({preloading: true});
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.getConfig).toHaveBeenCalled();
  });

  it('provides version from the instance', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    expect(result.current.version).toBe('0.7.0');
  });

  it('addEventListener returns subscription object', () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    const subscription = result.current.addEventListener('close', jest.fn());
    expect(subscription).toBeDefined();
    expect(subscription?.remove).toBeDefined();
  });
});

describe('ShopifyCheckoutSheetContext without provider', () => {
  it('throws error when hook is used without provider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useShopifyCheckoutSheet());
    }).toThrow(
      'useShopifyCheckoutSheet must be used from within a ShopifyCheckoutSheetContext',
    );

    errorSpy.mockRestore();
  });
});

describe('useWebview behavior (via useShopifyCheckoutSheet)', () => {
  const Wrapper = ({children}: {children: React.ReactNode}) => (
    <ShopifyCheckoutSheetProvider configuration={config}>
      {children}
    </ShopifyCheckoutSheetProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('respondToEvent returns false when no webview is registered', async () => {
    const {result} = renderHook(() => useShopifyCheckoutSheet(), {wrapper: Wrapper});

    let returnValue: boolean = true;
    await act(async () => {
      returnValue = await result.current.respondToEvent('event-123', {foo: 'bar'});
    });

    expect(returnValue).toBe(false);
    expect(UIManager.dispatchViewManagerCommand).not.toHaveBeenCalled();
  });

  it('respondToEvent dispatches native command when webview is registered', async () => {
    const {result} = renderHook(() => {
      const hookValue = useShopifyCheckoutSheet();
      const webViewRef = useRef({current: {}});
      useWebviewRegistration(webViewRef);
      return hookValue;
    }, {wrapper: Wrapper});

    let returnValue: boolean = false;
    await act(async () => {
      returnValue = await result.current.respondToEvent('event-123', {foo: 'bar'});
    });

    expect(returnValue).toBe(true);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledWith(
      1,
      'respondToEvent',
      ['event-123', JSON.stringify({foo: 'bar'})],
    );
  });

  it('respondToEvent returns false when findNodeHandle returns null', async () => {
    (findNodeHandle as jest.Mock).mockReturnValueOnce(null);

    const {result} = renderHook(() => {
      const hookValue = useShopifyCheckoutSheet();
      const webViewRef = useRef({current: {}});
      useWebviewRegistration(webViewRef);
      return hookValue;
    }, {wrapper: Wrapper});

    let returnValue: boolean = true;
    await act(async () => {
      returnValue = await result.current.respondToEvent('event-123', {foo: 'bar'});
    });

    expect(returnValue).toBe(false);
    expect(UIManager.dispatchViewManagerCommand).not.toHaveBeenCalled();
  });
});

describe('useShopifyEvent', () => {
  const Wrapper = ({children}: {children: React.ReactNode}) => (
    <ShopifyCheckoutSheetProvider configuration={config}>
      {children}
    </ShopifyCheckoutSheetProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('respondWith delegates to context.respondToEvent with correct eventId', async () => {
    const {result} = renderHook(() => {
      const webViewRef = useRef({current: {}});
      useWebviewRegistration(webViewRef);
      return useShopifyEvent('test-event-456');
    }, {wrapper: Wrapper});

    expect(result.current.id).toBe('test-event-456');

    let returnValue: boolean = false;
    await act(async () => {
      returnValue = await result.current.respondWith({payment: 'data'});
    });

    expect(returnValue).toBe(true);
    expect(UIManager.dispatchViewManagerCommand).toHaveBeenCalledWith(
      1,
      'respondToEvent',
      ['test-event-456', JSON.stringify({payment: 'data'})],
    );
  });

  it('throws error when used outside provider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useShopifyEvent('test-event-789'));
    }).toThrow('useShopifyEvent must be used within ShopifyCheckoutSheetProvider');

    errorSpy.mockRestore();
  });
});
