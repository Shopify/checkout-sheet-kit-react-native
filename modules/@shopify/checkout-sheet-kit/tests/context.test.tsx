import React from 'react';
import {render, act} from '@testing-library/react-native';
import {NativeModules, Platform} from 'react-native';
import {
  ShopifyCheckoutSheetProvider,
  useShopifyCheckoutSheet,
} from '../src/context';
import {ApplePayContactField, ColorScheme, type Configuration} from '../src';

const checkoutUrl = 'https://shopify.com/checkout';
const config: Configuration = {
  colorScheme: ColorScheme.automatic,
};

jest.mock('react-native');

const HookTestComponent = ({
  onHookValue,
}: {
  onHookValue: (value: any) => void;
}) => {
  const hookValue = useShopifyCheckoutSheet();
  onHookValue(hookValue);
  return null;
};

const MockChild = () => null;

describe('ShopifyCheckoutSheetProvider', () => {
  const TestComponent = ({children}: {children: React.ReactNode}) => (
    <ShopifyCheckoutSheetProvider configuration={config}>
      {children}
    </ShopifyCheckoutSheetProvider>
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const component = render(
      <TestComponent>
        <MockChild />
      </TestComponent>,
    );

    expect(component).toBeTruthy();
  });

  it('creates ShopifyCheckoutSheet instance with configuration', () => {
    render(
      <TestComponent>
        <MockChild />
      </TestComponent>,
    );

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig,
    ).toHaveBeenCalledWith(config);
  });

  it('skips configuration when no configuration is provided', () => {
    render(
      <ShopifyCheckoutSheetProvider>
        <MockChild />
      </ShopifyCheckoutSheetProvider>,
    );

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
        <MockChild />
      </ShopifyCheckoutSheetProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

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

  it('reuses the same instance across re-renders', () => {
    const {rerender} = render(
      <TestComponent>
        <MockChild />
      </TestComponent>,
    );

    rerender(
      <TestComponent>
        <MockChild />
      </TestComponent>,
    );

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
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    expect(hookValue.addEventListener).toBeDefined();
    expect(typeof hookValue.addEventListener).toBe('function');
  });

  it('provides removeEventListeners function', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.removeEventListeners('close');
    });

    expect(hookValue.removeEventListeners).toBeDefined();
  });

  it('provides present function and calls it with checkoutUrl', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.present(checkoutUrl);
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.present).toHaveBeenCalledWith(
      checkoutUrl,
    );
  });

  it('does not call present with empty checkoutUrl', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.present('');
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.present,
    ).not.toHaveBeenCalled();
  });

  it('provides preload function and calls it with checkoutUrl', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.preload(checkoutUrl);
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.preload).toHaveBeenCalledWith(
      checkoutUrl,
    );
  });

  it('does not call preload with empty checkoutUrl', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.preload('');
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.preload,
    ).not.toHaveBeenCalled();
  });

  it('provides invalidate function', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.invalidate();
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.invalidateCache,
    ).toHaveBeenCalled();
  });

  it('provides dismiss function', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.dismiss();
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.dismiss).toHaveBeenCalled();
  });

  it('provides setConfig function', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    const newConfig = {colorScheme: ColorScheme.light};

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    act(() => {
      hookValue.setConfig(newConfig);
    });

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig,
    ).toHaveBeenCalledWith(newConfig);
  });

  it('provides getConfig function', async () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    await act(async () => {
      const config = await hookValue.getConfig();
      expect(config).toEqual({preloading: true});
    });

    expect(NativeModules.ShopifyCheckoutSheetKit.getConfig).toHaveBeenCalled();
  });

  it('provides version from the instance', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    expect(hookValue.version).toBe('0.7.0');
  });

  it('addEventListener returns subscription object', () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(
      <Wrapper>
        <HookTestComponent onHookValue={onHookValue} />
      </Wrapper>,
    );

    const subscription = hookValue.addEventListener('close', jest.fn());
    expect(subscription).toBeDefined();
    expect(subscription.remove).toBeDefined();
  });
});

describe('ShopifyCheckoutSheetContext without provider', () => {
  it('uses default context values when no provider is present', async () => {
    let hookValue: any;
    const onHookValue = (value: any) => {
      hookValue = value;
    };

    render(<HookTestComponent onHookValue={onHookValue} />);

    const config = await hookValue.getConfig();
    expect(config).toBeUndefined();

    // Test all the noop functions to ensure they don't throw
    expect(() => hookValue.addEventListener('close', jest.fn())).not.toThrow();
    expect(() => hookValue.removeEventListeners('close')).not.toThrow();
    expect(() =>
      hookValue.setConfig({colorScheme: ColorScheme.automatic}),
    ).not.toThrow();
    expect(() => hookValue.preload('test-url')).not.toThrow();
    expect(() => hookValue.present('test-url')).not.toThrow();
    expect(() => hookValue.invalidate()).not.toThrow();
    expect(() => hookValue.dismiss()).not.toThrow();
    expect(hookValue.version).toBeUndefined();
  });
});
