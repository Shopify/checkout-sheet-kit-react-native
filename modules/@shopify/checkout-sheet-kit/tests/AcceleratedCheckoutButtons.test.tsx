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
    },
    requireNativeComponent: mockRequireNativeComponent,
    NativeModules: {
      ShopifyCheckoutSheetKit: mockShopifyCheckoutSheetKit,
    },
    NativeEventEmitter: jest.fn(),
  };
});

// Mock console methods
const mockWarn = jest.fn();

beforeAll(() => {
  global.console = {
    ...global.console,
    warn: mockWarn,
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
    });

    it('renders without crashing with cartId', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons cartId="gid://shopify/Cart/123" />,
      );

      expect(component.toJSON()).toBeTruthy();
    });

    it('renders without crashing with variantId', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons variantId="gid://shopify/ProductVariant/456" />,
      );

      expect(component.toJSON()).toBeTruthy();
    });

    it('renders without crashing with variantId and quantity', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          variantId="gid://shopify/ProductVariant/456"
          quantity={2}
        />,
      );

      expect(component.toJSON()).toBeTruthy();
    });

    it('applies custom styling', () => {
      const customStyle = {backgroundColor: 'red', height: 50};
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          style={customStyle}
        />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.style).toEqual(customStyle);
    });

    it('passes through props to native component', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          cornerRadius={12}
          wallets={[AcceleratedCheckoutWallet.shopPay]}
        />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.cartId).toBe('gid://shopify/Cart/123');
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.cornerRadius).toBe(12);
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.wallets).toEqual([AcceleratedCheckoutWallet.shopPay]);
    });

    it('warns and returns null when neither cartId nor variantId is provided', () => {
      const component = renderer.create(<AcceleratedCheckoutButtons />);

      expect(mockWarn).toHaveBeenCalledWith(
        'AcceleratedCheckoutButton: Either `cartId` or `variantId` must be provided',
      );
      expect(component.toJSON()).toBeNull();
    });

    it('uses default values for quantity and cornerRadius', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons variantId="gid://shopify/ProductVariant/456" />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.quantity).toBe(1);
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.cornerRadius).toBe(8);
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
      expect(tree.props.quantity).toBe(3);
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

    it('supports both cartId and variantId provided', () => {
      const component = renderer.create(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          variantId="gid://shopify/ProductVariant/456"
        />,
      );

      const tree = component.toJSON();
      expect(tree).toBeTruthy();
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.cartId).toBe('gid://shopify/Cart/123');
      // @ts-expect-error tree is not null based on check above
      expect(tree.props.variantId).toBe('gid://shopify/ProductVariant/456');
    });

    it('handles callbacks without throwing', () => {
      const mockCallbacks = {
        onPress: jest.fn(),
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
            cartId="gid://shopify/Cart/123"
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
      renderer.create(<AcceleratedCheckoutButtons />);

      expect(mockWarn).not.toHaveBeenCalled();
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
