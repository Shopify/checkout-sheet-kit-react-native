/*
MIT License

Copyright 2023 - Present, Shopify Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import {codegenNativeComponent, type ViewProps} from 'react-native';
import type {
  BubblingEventHandler,
  DirectEventHandler,
  Double,
  Float,
  UnsafeMixed,
  // eslint-disable-next-line @react-native/no-deep-imports -- codegen parser requires these type names to be imported directly (not via aliases) so it can match them statically during AST traversal
} from 'react-native/Libraries/Types/CodegenTypes';

type FailEvent = Readonly<{
  __typename: string;
  message: string;
  code?: string;
  recoverable?: boolean;
}>;

type CompleteEvent = Readonly<{
  orderDetails: Readonly<{
    id: string;
    cart?: UnsafeMixed;
    email?: string;
    paymentMethods?: UnsafeMixed;
    phone?: string;
  }>;
}>;

type RenderStateChangeEvent = Readonly<{
  state: string;
  reason?: string;
}>;

type WebPixelEvent = Readonly<{
  context?: UnsafeMixed;
  customData?: UnsafeMixed;
  data?: UnsafeMixed;
  id?: string;
  name?: string;
  timestamp?: string;
  type?: string;
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
  applePayStyle?: string;
  onFail?: BubblingEventHandler<FailEvent>;
  onComplete?: BubblingEventHandler<CompleteEvent>;
  onCancel?: BubblingEventHandler<null>;
  onRenderStateChange?: BubblingEventHandler<RenderStateChangeEvent>;
  onWebPixelEvent?: BubblingEventHandler<WebPixelEvent>;
  onClickLink?: BubblingEventHandler<ClickLinkEvent>;
  onSizeChange?: DirectEventHandler<SizeChangeEvent>;
  onShouldRecoverFromError?: DirectEventHandler<
    Readonly<{recoverable: boolean}>
  >;
}

export default codegenNativeComponent<NativeProps>(
  'RCTAcceleratedCheckoutButtons',
);
