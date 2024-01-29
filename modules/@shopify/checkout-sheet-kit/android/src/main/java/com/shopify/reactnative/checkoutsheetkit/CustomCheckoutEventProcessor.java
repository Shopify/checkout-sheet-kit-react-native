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

import android.content.Context;
import com.shopify.checkoutsheetkit.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableMap;
import com.shopify.checkoutsheetkit.pixelevents.PixelEvent;

import org.jetbrains.annotations.NotNull;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.jetbrains.annotations.Nullable;

import java.io.IOException;

public class CustomCheckoutEventProcessor extends DefaultCheckoutEventProcessor {
  private final ReactContext reactContext;

  public CustomCheckoutEventProcessor(Context context, ReactContext reactContext) {
    super(context);

    this.reactContext = reactContext;
  }

  @Override
  public void onCheckoutCompleted() {
    sendEvent(this.reactContext, "completed", null);
  }

  @Override
  public void onWebPixelEvent(@NotNull PixelEvent event) {
    try {
      ObjectMapper mapper = new ObjectMapper();
      String data = mapper.writeValueAsString(event);
      sendPixelEvent(this.reactContext, data);
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  @Override
  public void onCheckoutFailed(CheckoutException checkoutError) {
    WritableNativeMap error = new WritableNativeMap();

    error.putString("message", checkoutError.getErrorDescription());

    sendEvent(this.reactContext, "error", error);
  }

  @Override
  public void onCheckoutCanceled() {
    sendEvent(this.reactContext, "close", null);
  }

  private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableNativeMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  private void sendPixelEvent(ReactContext reactContext, String data) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("pixel", data);
  }
}
