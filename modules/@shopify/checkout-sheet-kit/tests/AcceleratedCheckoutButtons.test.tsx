import React from 'react';
import {render, act} from '@testing-library/react-native';
import {Platform} from 'react-native';
import {
  AcceleratedCheckoutButtons,
  AcceleratedCheckoutWallet,
  RenderState,
} from '../src';

jest.mock('react-native');

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
      it.each(['16.0', '17.0', '16.4.1'])('renders on iOS %s', version => {
        (Platform as any).Version = version;

        const {getByTestId} = render(
          <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
        );

        expect(getByTestId('accelerated-checkout-buttons')).toBeTruthy();
      });

      it.each(['15.5', '14.0', '15.0'])(
        'does not render on iOS %s',
        version => {
          (Platform as any).Version = version;

          const {queryByTestId} = render(
            <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
          );

          expect(queryByTestId('accelerated-checkout-buttons')).toBeNull();
          expect(mockLog).not.toHaveBeenCalled();
          expect(mockError).not.toHaveBeenCalled();
        },
      );
    });

    it('renders without crashing with cartId', () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons cartId={'gid://shopify/Cart/123'} />,
      );

      expect(getByTestId('accelerated-checkout-buttons')).toBeTruthy();
    });

    it('renders without crashing with variant', () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          variantId={'gid://shopify/ProductVariant/456'}
          quantity={1}
        />,
      );

      expect(getByTestId('accelerated-checkout-buttons')).toBeTruthy();
    });

    it('renders without crashing with variant and quantity', () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          variantId={'gid://shopify/ProductVariant/456'}
          quantity={2}
        />,
      );

      expect(getByTestId('accelerated-checkout-buttons')).toBeTruthy();
    });

    it('passes through props to native component', () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId={'gid://shopify/Cart/123'}
          cornerRadius={12}
          wallets={[AcceleratedCheckoutWallet.shopPay]}
        />,
      );

      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      expect(nativeComponent).toBeTruthy();
      expect(nativeComponent.props.checkoutIdentifier).toEqual({
        cartId: 'gid://shopify/Cart/123',
      });
      expect(nativeComponent.props.cornerRadius).toBe(12);
      expect(nativeComponent.props.wallets).toEqual([
        AcceleratedCheckoutWallet.shopPay,
      ]);
    });

    it.each([0, -1, -2, Number.NaN])(
      'throws when invalid variant quantity %p',
      quantity => {
        expect(() => {
          render(
            <AcceleratedCheckoutButtons
              variantId={'gid://shopify/ProductVariant/456'}
              quantity={quantity as any}
            />,
          );
        }).toThrow(
          'AcceleratedCheckoutButton: Either `cartId` or `variantId` and `quantity` must be provided',
        );
      },
    );

    it('uses default values for cornerRadius', () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          variantId="gid://shopify/ProductVariant/456"
          quantity={1}
        />,
      );

      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      expect(nativeComponent).toBeTruthy();
      expect(nativeComponent.props.cornerRadius).toBeUndefined();
    });

    it('passes through custom quantity and cornerRadius', () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          variantId="gid://shopify/ProductVariant/456"
          quantity={3}
          cornerRadius={16}
        />,
      );

      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      expect(nativeComponent).toBeTruthy();
      expect(nativeComponent.props.cornerRadius).toBe(16);
    });

    it('supports custom wallet configuration', () => {
      const customWallets = [
        AcceleratedCheckoutWallet.applePay,
        AcceleratedCheckoutWallet.shopPay,
      ];

      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          wallets={customWallets}
        />,
      );

      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      expect(nativeComponent).toBeTruthy();
      expect(nativeComponent.props.wallets).toEqual(customWallets);
    });

    it('forwards native fail event to onFail prop', () => {
      const onFail = jest.fn();
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          onFail={onFail}
        />,
      );

      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      const error = {message: 'boom'} as any;
      nativeComponent.props.onFail({nativeEvent: error});
      expect(onFail).toHaveBeenCalledWith(error);
    });

    it('forwards native complete event to onComplete prop', () => {
      const onComplete = jest.fn();
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          onComplete={onComplete}
        />,
      );

      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      const details = {orderConfirmation: {order: {id: '1'}}, cart: {}} as any;
      nativeComponent.props.onComplete({nativeEvent: details});
      expect(onComplete).toHaveBeenCalledWith(details);
    });

    it('calls onCancel when native cancel is invoked', () => {
      const onCancel = jest.fn();
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          onCancel={onCancel}
        />,
      );
      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      nativeComponent.props.onCancel();
      expect(onCancel).toHaveBeenCalled();
    });

    it('maps render state change to typed states including error reason', () => {
      const onRenderStateChange = jest.fn();
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          onRenderStateChange={onRenderStateChange}
        />,
      );
      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      nativeComponent.props.onRenderStateChange({
        nativeEvent: {state: 'error', reason: 'bad'},
      });
      expect(onRenderStateChange).toHaveBeenCalledWith({
        state: RenderState.Error,
        reason: 'bad',
      });

      nativeComponent.props.onRenderStateChange({
        nativeEvent: {state: 'rendered'},
      });
      expect(onRenderStateChange).toHaveBeenCalledWith({
        state: RenderState.Rendered,
      });

      nativeComponent.props.onRenderStateChange({
        nativeEvent: {state: 'loading'},
      });
      expect(onRenderStateChange).toHaveBeenCalledWith({
        state: RenderState.Loading,
      });

      nativeComponent.props.onRenderStateChange({
        nativeEvent: {state: 'unexpected'},
      });
      expect(onRenderStateChange).toHaveBeenCalledWith({
        state: RenderState.Error,
      });
    });

    it('forwards web pixel native events', () => {
      const onWebPixelEvent = jest.fn();
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          onWebPixelEvent={onWebPixelEvent}
        />,
      );
      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      const pixel = {type: 'STANDARD'} as any;
      nativeComponent.props.onWebPixelEvent({nativeEvent: pixel});
      expect(onWebPixelEvent).toHaveBeenCalledWith(pixel);
    });

    it('handles onClickLink when URL is present and ignores when absent', () => {
      const onClickLink = jest.fn();
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons
          cartId="gid://shopify/Cart/123"
          onClickLink={onClickLink}
        />,
      );
      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      nativeComponent.props.onClickLink({
        nativeEvent: {url: 'https://checkout.shopify.com'},
      });
      expect(onClickLink).toHaveBeenCalledWith('https://checkout.shopify.com');

      onClickLink.mockClear();
      nativeComponent.props.onClickLink({nativeEvent: {}});
      expect(onClickLink).not.toHaveBeenCalled();
    });

    it('applies dynamic height when onSizeChange is emitted', async () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons cartId="gid://shopify/Cart/123" />,
      );
      let nativeComponent = getByTestId('accelerated-checkout-buttons');
      await act(async () => {
        nativeComponent.props.onSizeChange({nativeEvent: {height: 42}});
      });
      nativeComponent = getByTestId('accelerated-checkout-buttons');
      expect(nativeComponent.props.style).toEqual({
        flex: 1,
        height: 42,
      });
    });

    it('warns and returns null when missing identifiers in production', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;
      (Platform as any).Version = '16.0';
      const warn = jest.spyOn(global.console, 'warn').mockImplementation();

      const {queryByTestId} = render(
        // invalid: no cartId and invalid variant path
        <AcceleratedCheckoutButtons variantId="" quantity={0} />,
      );
      expect(queryByTestId('accelerated-checkout-buttons')).toBeNull();
      expect(warn).toHaveBeenCalledWith(
        'AcceleratedCheckoutButton: Either `cartId` or `variantId` and `quantity` must be provided',
      );

      warn.mockRestore();
      (global as any).__DEV__ = originalDev;
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
        render(
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
      const {queryByTestId} = render(
        <AcceleratedCheckoutButtons cartId="gid://shopify/Cart/123" />,
      );

      expect(queryByTestId('accelerated-checkout-buttons')).toBeNull();
    });

    it('does not warn on Android even without required props', () => {
      render(<AcceleratedCheckoutButtons variantId="" quantity={0} />);

      expect(mockLog).not.toHaveBeenCalled();
    });
  });

  describe('RenderState enum', () => {
    it('exports correct render states', () => {
      expect(RenderState.Loading).toBe('loading');
      expect(RenderState.Rendered).toBe('rendered');
      expect(RenderState.Error).toBe('error');
    });

    it('logs unexpected render states', async () => {
      const {getByTestId} = render(
        <AcceleratedCheckoutButtons cartId="gid://shopify/Cart/123" />,
      );
      const nativeComponent = getByTestId('accelerated-checkout-buttons');
      nativeComponent.props.onRenderStateChange({
        nativeEvent: {state: 'unexpected'},
      });

      expect(mockError).toHaveBeenCalledWith(
        '[ShopifyAcceleratedCheckouts] Invalid render state: unexpected',
      );
    });
  });
});
