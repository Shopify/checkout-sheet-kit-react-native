import React from 'react';
import renderer from 'react-test-renderer';
import {Platform} from 'react-native';
import {
  AcceleratedCheckoutButtons,
  AcceleratedCheckoutWallet,
  RenderState,
} from '../src';

// Mock react-native Platform and requireNativeComponent
jest.mock('react-native', () => {
  const mockRequireNativeComponent = jest.fn().mockImplementation(() => {
    const mockComponent = (props: any) => {
      // Use React.createElement with plain object instead
      const mockReact = jest.requireActual('react');
      return mockReact.createElement('View', props);
    };
    return mockComponent;
  });

  const mockShopifyCheckoutSheetKit = {
    version: '0.7.0',
    preload: jest.fn(),
    present: jest.fn(),
    invalidateCache: jest.fn(),
    getConfig: jest.fn(async () => ({preloading: true})),
    setConfig: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListeners: jest.fn(),
    initiateGeolocationRequest: jest.fn(),
    configureAcceleratedCheckouts: jest.fn(),
    isAcceleratedCheckoutAvailable: jest.fn(),
  };

  return {
    Platform: {
      OS: 'ios',
      Version: '16.0',
    },
    requireNativeComponent: mockRequireNativeComponent,
    NativeModules: {
      ShopifyCheckoutSheetKit: mockShopifyCheckoutSheetKit,
    },
    NativeEventEmitter: jest.fn(),
  };
});

const mockLog = jest.fn();
// Silence console.error
const mockError = jest.fn();

beforeAll(() => {
  global.console = {
    ...global.console,
    log: mockLog,
    error: mockError,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'ios';
});

describe('AcceleratedCheckoutButtons', () => {
  describe('iOS Platform', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
      // Default to iOS 16 for most tests
      (Platform as any).Version = '16.0';
    });

    describe('iOS Version Compatibility', () => {
      it('returns null on iOS versions below 16', () => {
        (Platform as any).Version = '15.5';

        const component = renderer.create(
          <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
        );

        expect(component.toJSON()).toBeNull();
      });

      it('returns null on iOS 14', () => {
        (Platform as any).Version = '14.0';

        const component = renderer.create(
          <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
        );

        expect(component.toJSON()).toBeNull();
      });

      it('renders on iOS 16', () => {
        (Platform as any).Version = '16.0';

        const component = renderer.create(
          <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
        );

        expect(component.toJSON()).toBeTruthy();
      });

      it('renders on iOS 17', () => {
        (Platform as any).Version = '17.0';

        const component = renderer.create(
          <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
        );

        expect(component.toJSON()).toBeTruthy();
      });

      it('handles iOS version with decimal correctly', () => {
        (Platform as any).Version = '16.4.1';

        const component = renderer.create(
          <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
        );

        expect(component.toJSON()).toBeTruthy();
      });

      it('does not warn when returning null for iOS < 16', () => {
        (Platform as any).Version = '15.0';

        const component = renderer.create(
          <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
        );

        expect(component.toJSON()).toBeNull();
        expect(mockLog).not.toHaveBeenCalled();
        expect(mockError).not.toHaveBeenCalled();
      });
    });

    it('renders without crashing with cartId', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
      );

      expect(component.toJSON()).toBeTruthy();
    });

    it('renders without crashing with variant', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          variantId={'gid://shopify/ProductVariant/456'}
          quantity={1}
        />,
      );

      expect(component.toJSON()).toBeTruthy();
    });

    it('renders without crashing with variant and quantity', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          variantId={'gid://shopify/ProductVariant/456'}
          quantity={2}
        />,
      );

      expect(component.toJSON()).toBeTruthy();
    });

    it('passes through props to native component', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          cartId={'gid://shopify/Cart/123'}
          cornerRadius={12}
          wallets={[AcceleratedCheckoutWallet.shopPay]}
        />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.checkoutIdentifier).toEqual({
        cartId: 'gid://shopify/Cart/123',
      });
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.cornerRadius).toBe(12);
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.wallets).toEqual([AcceleratedCheckoutWallet.shopPay]);
    });

    it('logs and returns null when neither cartId nor variantId is provided', () => {
      expect(() => {
        renderer.create(
          <AcceleratedCheckoutButtons variantId="" quantity={0} />,
        );
      }).toThrow(
        'AcceleratedCheckoutButton: Either `cartId` or `variantId` and `quantity` must be provided',
      );
    });

    it('uses default values for cornerRadius', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          variantId="gid://shopify/ProductVariant/456"
          quantity={1}
        />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.cornerRadius).toBeUndefined();
    });

    it('passes through custom quantity and cornerRadius', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          variantId="gid://shopify/ProductVariant/456"
          quantity={3}
          cornerRadius={16}
        />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.cornerRadius).toBe(16);
    });

    it('supports custom wallet configuration', () => {
      const customWallets = [
        AcceleratedCheckoutWallet.applePay,
        AcceleratedCheckoutWallet.shopPay,
      ];

      const component = renderer.create(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          wallets={customWallets}
        />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.wallets).toEqual(customWallets);
    });

    it('handles callbacks without throwing', () => {
      const mockCallbacks = {
        onFail: jest.fn(),
        onComplete: jest.fn(),
        onCancel: jest.fn(),
        onRenderStateChange: jest.fn(),
        onWebPixelEvent: jest.fn(),
        onClickLink: jest.fn(),
      };

      expect(() => {
        renderer.create(
          <AcceleratedCheckoutButtons
            cartId={'gid://shopify/Cart/123'}
            {...mockCallbacks}
          />,
        );
      }).not.toThrow();
    });
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('returns null on Android', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons cartId="gid://shopify/Cart/123" />,
      );

      expect(component.toJSON()).toBeNull();
    });

    it('does not warn on Android even without required props', () => {
      renderer.create(<AcceleratedCheckoutButtons variantId="" quantity={0} />);

      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe('RenderState enum', () => {
    it('exports correct render states', () => {
      expect(RenderState.Loading).toBe('loading');
      expect(RenderState.Rendered).toBe('rendered');
      expect(RenderState.Error).toBe('error');
    });
  });
});
