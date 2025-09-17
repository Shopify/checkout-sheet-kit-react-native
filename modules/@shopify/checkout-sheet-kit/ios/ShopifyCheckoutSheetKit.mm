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
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE (RCTShopifyCheckoutSheetKit, NSObject)

/**
 * Present checkout
 */
RCT_EXTERN_METHOD(present : (NSString*)checkoutURLString);

/**
 * Preload checkout
 */
RCT_EXTERN_METHOD(preload : (NSString*)checkoutURLString);

/**
 * Dismiss checkout
 */
RCT_EXTERN_METHOD(dismiss);

/**
 * Invalidate preload cache
 */
RCT_EXTERN_METHOD(invalidateCache);

/**
 * Set configuration for checkout
 */
RCT_EXTERN_METHOD(setConfig : (NSDictionary*)configuration);

/**
 * Return configuration for checkout
 */
RCT_EXTERN_METHOD(getConfig : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)

/**
 * Configure AcceleratedCheckouts
 */
RCT_EXTERN_METHOD(configureAcceleratedCheckouts : (NSString*)storefrontDomain storefrontAccessToken : (
  NSString*)storefrontAccessToken customerEmail : (NSString*)customerEmail customerPhoneNumber : (NSString*)
    customerPhoneNumber customerAccessToken : (NSString*)customerAccessToken applePayMerchantIdentifier : (NSString*)
      applePayMerchantIdentifier applyPayContactFields : (NSArray*)applyPayContactFields resolve : (
        RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject);

/**
 * Check if accelerated checkout is available
 */
RCT_EXTERN_METHOD(
  isAcceleratedCheckoutAvailable : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject);

/**
 * Check if Apple Pay is available
 */
RCT_EXTERN_METHOD(isApplePayAvailable : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject);

@end

/**
 * CheckoutWebView View Manager
 */
@interface RCT_EXTERN_MODULE (RCTCheckoutWebViewManager, RCTViewManager)

/**
 * The checkout URL to load
 */
RCT_EXPORT_VIEW_PROPERTY(checkoutUrl, NSString*)

/**
 * Emitted when the webview loads
 */
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)

/**
 * Emitted when checkout fails
 */
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)

/**
 * Emitted when checkout completes successfully
 */
RCT_EXPORT_VIEW_PROPERTY(onComplete, RCTBubblingEventBlock)

/**
 * Emitted when checkout is cancelled
 */
RCT_EXPORT_VIEW_PROPERTY(onCancel, RCTBubblingEventBlock)

/**
 * Emitted when a web pixel event occurs
 */
RCT_EXPORT_VIEW_PROPERTY(onPixelEvent, RCTBubblingEventBlock)

/**
 * Emitted when a link is clicked
 */
RCT_EXPORT_VIEW_PROPERTY(onClickLink, RCTBubblingEventBlock)

/**
 * Emitted when the view is attached
 */
RCT_EXPORT_VIEW_PROPERTY(onViewAttached, RCTDirectEventBlock)

/**
 * Reload the webview
 */
RCT_EXTERN_METHOD(reload : (nonnull NSNumber*)node)

@end

/**
 * AcceleratedCheckoutButtons View Manager
 */
@interface RCT_EXTERN_MODULE (RCTAcceleratedCheckoutButtonsManager, RCTViewManager)

/**
 * Unified checkout identifier payload.
 * Accepts either { cartId } or { variantId, quantity }.
 */
RCT_EXPORT_VIEW_PROPERTY(checkoutIdentifier, NSDictionary*)

/**
 * Corner radius for rendered buttons, in points. Defaults to 8.
 */
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, NSNumber*)

/**
 * Wallets to render. Accepts an array of identifiers such as "shopPay" and "applePay".
 * If omitted, native defaults are used.
 */
RCT_EXPORT_VIEW_PROPERTY(wallets, NSArray*)

/**
 * Label variant for the Apple Pay button (e.g., "plain", "buy", "checkout").
 */
RCT_EXPORT_VIEW_PROPERTY(applePayLabel, NSString*)

/**
 * Emitted when checkout fails. Payload contains a CheckoutException-like shape.
 */
RCT_EXPORT_VIEW_PROPERTY(onFail, RCTBubblingEventBlock)

/**
 * Emitted when checkout completes successfully. Payload contains order details.
 */
RCT_EXPORT_VIEW_PROPERTY(onComplete, RCTBubblingEventBlock)

/**
 * Emitted when checkout is cancelled by the buyer.
 */
RCT_EXPORT_VIEW_PROPERTY(onCancel, RCTBubblingEventBlock)

/**
 * Emitted when the native render state changes. Values: "loading", "rendered", "error".
 */
RCT_EXPORT_VIEW_PROPERTY(onRenderStateChange, RCTBubblingEventBlock)

/**
 * Direct event used to determine whether native should attempt recovery from an error.
 */
RCT_EXPORT_VIEW_PROPERTY(onShouldRecoverFromError, RCTDirectEventBlock)

/**
 * Emitted when a web pixel event occurs during checkout.
 */
RCT_EXPORT_VIEW_PROPERTY(onWebPixelEvent, RCTBubblingEventBlock)

/**
 * Emitted when a link is clicked within the checkout experience. Payload contains the URL.
 */
RCT_EXPORT_VIEW_PROPERTY(onClickLink, RCTBubblingEventBlock)

/**
 * Emitted when the intrinsic height of the native view changes. Payload contains { height }.
 */
RCT_EXPORT_VIEW_PROPERTY(onSizeChange, RCTDirectEventBlock)

@end
