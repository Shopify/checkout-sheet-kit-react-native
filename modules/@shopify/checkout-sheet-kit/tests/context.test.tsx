import React from 'react';
import {act, create} from 'react-test-renderer';
import {NativeModules} from 'react-native';
import {
  ShopifyCheckoutSheetProvider,
  useShopifyCheckoutSheet,
} from '../src/context';
import {ColorScheme, type Configuration} from '../src';

const checkoutUrl = 'https://shopify.com/checkout';
const config: Configuration = {
  colorScheme: ColorScheme.automatic,
};

// Use the shared manual mock. Individual tests can override if needed.
jest.mock('react-native');

// Helper component to test the hook
const HookTestComponent = ({
  onHookValue,
}: {
  onHookValue: (value: any) => void;
}) => {
  const hookValue = useShopifyCheckoutSheet();
  onHookValue(hookValue);
  return null;
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

  it('renders children correctly', () => {
    const component = create(
      <TestComponent>
        <div>Test Child</div>
      </TestComponent>,
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('creates ShopifyCheckoutSheet instance with configuration', () => {
    create(<TestComponent>test</TestComponent>);

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig,
    ).toHaveBeenCalledWith(config);
  });

  it('creates ShopifyCheckoutSheet instance with features', () => {
    const features = {handleGeolocationRequests: false};

    create(
      <ShopifyCheckoutSheetProvider features={features}>
        test
      </ShopifyCheckoutSheetProvider>,
    );

    expect(
      NativeModules.ShopifyCheckoutSheetKit.setConfig,
    ).not.toHaveBeenCalled();
  });

  it('reuses the same instance across re-renders', () => {
    const component = create(<TestComponent>test</TestComponent>);

    const firstCallCount =
      NativeModules.ShopifyCheckoutSheetKit.setConfig.mock.calls.length;

    component.update(<TestComponent>updated</TestComponent>);

    const secondCallCount =
      NativeModules.ShopifyCheckoutSheetKit.setConfig.mock.calls.length;

    expect(secondCallCount).toBe(firstCallCount);
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(
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

    create(<HookTestComponent onHookValue={onHookValue} />);

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
