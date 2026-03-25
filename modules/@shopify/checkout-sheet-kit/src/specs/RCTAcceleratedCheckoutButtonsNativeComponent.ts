import type {ViewProps} from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type {
  BubblingEventHandler,
  DirectEventHandler,
  Double,
  Float,
} from 'react-native/Libraries/Types/CodegenTypes';

type FailEvent = Readonly<{
  __typename: string;
  message: string;
  code?: string;
  recoverable?: boolean;
}>;

type CompleteEvent = Readonly<{
  orderDetails: {
    id: string;
    cart: {
      token: string;
      lines: ReadonlyArray<
        Readonly<{
          title: string;
          quantity: Double;
          merchandiseId?: string;
          productId?: string;
        }>
      >;
    };
    email?: string;
    phone?: string;
  };
}>;

type RenderStateChangeEvent = Readonly<{
  state: string;
  reason?: string;
}>;

type ClickLinkEvent = Readonly<{url: string}>;
type SizeChangeEvent = Readonly<{height: Double}>;

type CheckoutIdentifierSpec = Readonly<{
  cartId?: string;
  variantId?: string;
  quantity?: Double;
}>;

interface NativeProps extends ViewProps {
  checkoutIdentifier: CheckoutIdentifierSpec;
  cornerRadius?: Float;
  wallets?: ReadonlyArray<string>;
  applePayLabel?: string;
  onFail?: BubblingEventHandler<FailEvent>;
  onComplete?: BubblingEventHandler<CompleteEvent>;
  onCancel?: BubblingEventHandler<null>;
  onRenderStateChange?: BubblingEventHandler<RenderStateChangeEvent>;
  onWebPixelEvent?: BubblingEventHandler<Readonly<{data: string}>>;
  onClickLink?: BubblingEventHandler<ClickLinkEvent>;
  onSizeChange?: DirectEventHandler<SizeChangeEvent>;
  onShouldRecoverFromError?: DirectEventHandler<
    Readonly<{recoverable: boolean}>
  >;
}

export default codegenNativeComponent<NativeProps>(
  'RCTAcceleratedCheckoutButtons',
);
