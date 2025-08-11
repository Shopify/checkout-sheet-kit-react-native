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

/// Present checkout
RCT_EXTERN_METHOD(present : (NSString *)checkoutURLString);

/// Preload checkout
RCT_EXTERN_METHOD(preload : (NSString *)checkoutURLString);

/// Dismiss checkout
RCT_EXTERN_METHOD(dismiss);

/// Invalidate preload cache
RCT_EXTERN_METHOD(invalidateCache);

/// Set configuration for checkout
RCT_EXTERN_METHOD(setConfig : (NSDictionary *)configuration);

// Return configuration for checkout
RCT_EXTERN_METHOD(getConfig : (RCTPromiseResolveBlock)
                      resolve reject : (RCTPromiseRejectBlock)reject)

/// Configure AcceleratedCheckouts
RCT_EXTERN_METHOD(configureAcceleratedCheckouts : (NSString *)
                      storefrontDomain storefrontAccessToken : (NSString *)
                          storefrontAccessToken customerEmail : (NSString *)
                              customerEmail customerPhoneNumber : (NSString *)
                                  customerPhoneNumber);

/// Check if accelerated checkout is available
RCT_EXTERN_METHOD(
    isAcceleratedCheckoutAvailable : (NSString *)cartId variantId : (NSString *)
        variantId quantity : (nonnull NSNumber *)
            quantity resolve : (RCTPromiseResolveBlock)
                resolve reject : (RCTPromiseRejectBlock)reject);

@end

// AcceleratedCheckoutButtons View Manager
@interface RCT_EXTERN_MODULE (RCTAcceleratedCheckoutButtonsManager,
                              RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(cartId, NSString *)
RCT_EXPORT_VIEW_PROPERTY(variantId, NSString *)
RCT_EXPORT_VIEW_PROPERTY(quantity, NSNumber *)
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, NSNumber *)
RCT_EXPORT_VIEW_PROPERTY(wallets, NSArray *)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFail, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onComplete, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onCancel, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onRenderStateChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onShouldRecoverFromError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onWebPixelEvent, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onClickLink, RCTBubblingEventBlock)

@end
