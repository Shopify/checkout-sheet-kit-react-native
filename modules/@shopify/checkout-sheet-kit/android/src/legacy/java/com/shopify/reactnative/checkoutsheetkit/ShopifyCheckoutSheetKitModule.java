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
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.Map;

/**
 * @note
 *
 *       This is the legacy module class for the ShopifyCheckoutSheetKit module.
 *       It is used to support applications using React Native with the old
 *       legacy architecture.
 */

public class ShopifyCheckoutSheetKitModule extends ReactContextBaseJavaModule {
  private final CheckoutKitModule common;
  public static com.shopify.checkoutsheetkit.Configuration checkoutConfig;

  public ShopifyCheckoutSheetKitModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.common = new CheckoutKitModule(reactContext);
    ShopifyCheckoutSheetKitModule.checkoutConfig = CheckoutKitModule.checkoutConfig;
  }

  @Override
  public String getName() {
    return common.getName();
  }

  @Override
  public Map<String, Object> getConstants() {
    return common.getConstants();
  }

  @ReactMethod
  public void addListener(String eventName) {
    common.addListener(eventName);
  }

  @ReactMethod
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

  @ReactMethod
  public void dismiss() {
    common.dismiss();
  }

  @ReactMethod
  public void getConfig(Promise promise) {
    common.getConfig(promise);
  }

  public String getVersion() {
    return common.getVersion();
  }

  @ReactMethod
  public void initiateGeolocationRequest(boolean allow) {
    common.initiateGeolocationRequest(allow);
  }

  @ReactMethod
  public void invalidateCache() {
    common.invalidateCache();
  }

  @ReactMethod
  public void isAcceleratedCheckoutAvailable(Promise promise) {
    common.isAcceleratedCheckoutAvailable(promise);
  }

  @ReactMethod
  public void isApplePayAvailable(Promise promise) {
    common.isApplePayAvailable(promise);
  }

  @ReactMethod
  public void preload(String checkoutURL) {
    common.preload(checkoutURL);
  }

  @ReactMethod
  public void present(String checkoutURL) {
    common.present(checkoutURL);
  }

  @ReactMethod
  public void removeListeners(double count) {
    common.removeListeners(count);
  }

  @ReactMethod
  public void setConfig(ReadableMap config) {
    common.setConfig(config);
    ShopifyCheckoutSheetKitModule.checkoutConfig = CheckoutKitModule.checkoutConfig;
  }
}
