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
import android.util.Log;
import androidx.annotation.NonNull;
import com.shopify.checkoutsheetkit.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableNativeMap;
import com.shopify.checkoutsheetkit.pixelevents.PixelEvent;
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
    sendEvent("completed", null);
  }

  @Override
  public void onWebPixelEvent(@NonNull PixelEvent event) {
    try {
      ObjectMapper mapper = new ObjectMapper();
      String data = mapper.writeValueAsString(event);
      sendPixelEvent(data);
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error processing pixel event", e);
    }
  }

  @Override
  public void onCheckoutFailed(CheckoutException checkoutError) {
    WritableNativeMap error = new WritableNativeMap();

    error.putString("message", checkoutError.getErrorDescription());

    sendEvent("error", error);
  }

  @Override
  public void onCheckoutCanceled() {
    sendEvent("close", null);
  }

  private void sendEvent(String eventName, @Nullable WritableNativeMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  private void sendPixelEvent(String data) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("pixel", data);
  }
}
