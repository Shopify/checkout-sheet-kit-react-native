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

package com.shopify.reactnative.checkoutkit;

import android.app.Activity;
import android.content.Context;
import androidx.activity.ComponentActivity;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableNativeMap;
import org.jetbrains.annotations.NotNull;
import android.net.Uri;
import com.shopify.checkoutkit.*;

import java.util.HashMap;
import java.util.Map;

public class ShopifyCheckoutKitModule extends ReactContextBaseJavaModule {
  private static final String MODULE_NAME = "ShopifyCheckoutKit";

  private static Configuration checkoutConfig = new Configuration();

  public ShopifyCheckoutKitModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("version", ShopifyCheckoutKit.version);
    return constants;
  }

  @ReactMethod
  public void present(String checkoutURL) {
    Activity currentActivity = getCurrentActivity();
    if (currentActivity instanceof ComponentActivity) {
      Context appContext = getReactApplicationContext();
      CheckoutEventProcessor checkoutEventProcessor = new CustomCheckoutEventProcessor(appContext);
      currentActivity.runOnUiThread(() -> {
        ShopifyCheckoutKit.present(checkoutURL, (ComponentActivity) currentActivity,
            checkoutEventProcessor);
      });
    }
  }

  @ReactMethod
  public void preload(String checkoutURL) {
    Activity currentActivity = getCurrentActivity();

    if (currentActivity instanceof ComponentActivity) {
      ShopifyCheckoutKit.preload(checkoutURL, (ComponentActivity) currentActivity);
    }
  }

  private ColorScheme getColorScheme(String colorScheme) {
    switch (colorScheme) {
      case "web_default":
        return new ColorScheme.Web();
      case "automatic":
        return new ColorScheme.Automatic();
      case "light":
        return new ColorScheme.Light();
      case "dark":
        return new ColorScheme.Dark();
      default:
        return new ColorScheme.Automatic();
    }
  }

  private String colorSchemeToString(ColorScheme colorScheme) {
    return colorScheme.getId();
  }

  @ReactMethod
  public void configure(ReadableMap config) {
    ShopifyCheckoutKit.configure(configuration -> {
      if (config.hasKey("preloading")) {
        configuration.setPreloading(new Preloading(config.getBoolean("preloading")));
      }

      if (config.hasKey("colorScheme")) {
        configuration.setColorScheme(getColorScheme(config.getString("colorScheme")));
      }

      checkoutConfig = configuration;
    });
  }

  @ReactMethod
  public void getConfig(Promise promise) {
    WritableNativeMap resultConfig = new WritableNativeMap();

    resultConfig.putBoolean("preloading", checkoutConfig.getPreloading().getEnabled());
    resultConfig.putString("colorScheme", colorSchemeToString(checkoutConfig.getColorScheme()));

    promise.resolve(resultConfig);
  }
}
