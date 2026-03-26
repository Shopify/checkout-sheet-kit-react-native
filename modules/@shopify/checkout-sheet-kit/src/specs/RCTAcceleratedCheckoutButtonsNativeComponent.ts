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
  orderDetails: Readonly<{
    id: string;
    email?: string;
    phone?: string;
  }>;
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
