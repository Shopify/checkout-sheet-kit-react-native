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
package com.shopify.reactnative.checkoutsheetkit;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.Map;

/**
 * @note
 *
 *       This is the new architecture module class for the
 *       ShopifyCheckoutSheetKit module.
 *       It is used to support applications using React Native with the new
 *       new architecture.
 */

public class ShopifyCheckoutSheetKitModule extends NativeShopifyCheckoutSheetKitSpec {
  private final CheckoutKitModule common;
  public static com.shopify.checkoutsheetkit.Configuration checkoutConfig;

  public ShopifyCheckoutSheetKitModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.common = new CheckoutKitModule(reactContext);
    ShopifyCheckoutSheetKitModule.checkoutConfig = CheckoutKitModule.checkoutConfig;
  }

  @Override
  public Map<String, Object> getConstants() {
    return common.getConstants();
  }

  @Override
  public void addListener(String eventName) {
    common.addListener(eventName);
  }

  @Override
  public void removeListeners(double count) {
    common.removeListeners(count);
  }

  @Override
  public void present(String checkoutURL) {
    common.present(checkoutURL);
  }

  @Override
  public void dismiss() {
    common.dismiss();
  }

  @Override
  public void preload(String checkoutURL) {
    common.preload(checkoutURL);
  }

  @Override
  public void invalidateCache() {
    common.invalidateCache();
  }

  @Override
  public void getConfig(Promise promise) {
    common.getConfig(promise);
  }

  @Override
  public void setConfig(ReadableMap config) {
    common.setConfig(config);
    ShopifyCheckoutSheetKitModule.checkoutConfig = CheckoutKitModule.checkoutConfig;
  }

  @Override
  public void isApplePayAvailable(Promise promise) {
    common.isApplePayAvailable(promise);
  }

  @Override
  public void isAcceleratedCheckoutAvailable(Promise promise) {
    common.isAcceleratedCheckoutAvailable(promise);
  }

  @Override
  public void configureAcceleratedCheckouts(
      String storefrontDomain,
      String storefrontAccessToken,
      String customerEmail,
      String customerPhoneNumber,
      String customerAccessToken,
      String applePayMerchantIdentifier,
      ReadableArray applePayContactFields,
      Promise promise) {
    common.configureAcceleratedCheckouts(
        storefrontDomain,
        storefrontAccessToken,
        customerEmail,
        customerPhoneNumber,
        customerAccessToken,
        applePayMerchantIdentifier,
        applePayContactFields,
        promise);
  }

  @Override
  public void initiateGeolocationRequest(boolean allow) {
    common.initiateGeolocationRequest(allow);
  }

  @Override
  public String getVersion() {
    return common.getVersion();
  }
}
