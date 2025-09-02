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

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type {HostComponent} from 'react-native';
import type {ViewProps} from 'react-native';

export type AcceleratedCheckoutButtonsNativeProps = Readonly<
  ViewProps & {
    checkoutIdentifier?: {
      cartId?: string;
      variantId?: string;
      quantity?: number;
    };
    cornerRadius?: number;
    wallets?: string[];
    applePayLabel?: string;
    onFail?: (event: {nativeEvent: any}) => void;
    onComplete?: (event: {nativeEvent: any}) => void;
    onCancel?: () => void;
    onRenderStateChange?: (event: {
      nativeEvent: {state: string; reason?: string};
    }) => void;
    onWebPixelEvent?: (event: {nativeEvent: any}) => void;
    onClickLink?: (event: {nativeEvent: {url: string}}) => void;
    onSizeChange?: (event: {nativeEvent: {height: number}}) => void;
  }
>;

export default codegenNativeComponent<AcceleratedCheckoutButtonsNativeProps>(
  'ShopifyAcceleratedCheckoutButtons',
) as HostComponent<AcceleratedCheckoutButtonsNativeProps>;
