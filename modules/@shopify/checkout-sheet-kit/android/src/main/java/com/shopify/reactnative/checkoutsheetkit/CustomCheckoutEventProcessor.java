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
import android.webkit.GeolocationPermissions;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.shopify.checkoutsheetkit.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompleteEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutStartEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class CustomCheckoutEventProcessor extends DefaultCheckoutEventProcessor {
  private final ReactApplicationContext reactContext;
  private final ObjectMapper mapper = new ObjectMapper();

  // Geolocation-specific variables

  private String geolocationOrigin;
  private GeolocationPermissions.Callback geolocationCallback;

  public CustomCheckoutEventProcessor(Context context, ReactApplicationContext reactContext) {
    super(context);
    this.reactContext = reactContext;
  }

  // Public methods

  public void invokeGeolocationCallback(boolean allow) {
    if (geolocationCallback != null) {
      boolean retainGeolocationForFutureRequests = false;
      geolocationCallback.invoke(geolocationOrigin, allow, retainGeolocationForFutureRequests);
      geolocationCallback = null;
    }
  }

  // Lifecycle events

  /**
   * This method is called when the checkout sheet webpage requests geolocation
   * permissions.
   *
   * Since the app needs to request permissions first before granting, we store
   * the callback and origin in memory and emit a "geolocationRequest" event to
   * the app. The app will then request the necessary geolocation permissions
   * and invoke the native callback with the result.
   *
   * @param origin   - The origin of the request
   * @param callback - The callback to invoke when the app requests permissions
   */
  @Override
  public void onGeolocationPermissionsShowPrompt(@NonNull String origin,
      @NonNull GeolocationPermissions.Callback callback) {

    // Store the callback and origin in memory. The kit will wait for the app to
    // request permissions first before granting.
    this.geolocationCallback = callback;
    this.geolocationOrigin = origin;

    // Emit a "geolocationRequest" event to the app.
    try {
      Map<String, Object> event = new HashMap<>();
      event.put("origin", origin);
      sendEventWithStringData("geolocationRequest", mapper.writeValueAsString(event));
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error emitting \"geolocationRequest\" event", e);
    }
  }

  @Override
  public void onGeolocationPermissionsHidePrompt() {
    super.onGeolocationPermissionsHidePrompt();

    // Reset the geolocation callback and origin when the prompt is hidden.
    this.geolocationCallback = null;
    this.geolocationOrigin = null;
  }

  @Override
  public void onFail(CheckoutException checkoutError) {
    try {
      String data = mapper.writeValueAsString(populateErrorDetails(checkoutError));
      sendEventWithStringData("error", data);
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error processing checkout failed event", e);
    }
  }

  @Override
  public void onCancel() {
    sendEvent("close", null);
  }

  @Override
  public void onComplete(@NonNull CheckoutCompleteEvent event) {
    try {
      String data = mapper.writeValueAsString(event);
      sendEventWithStringData("complete", data);
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error processing complete event", e);
    }
  }

  @Override
  public void onStart(@NonNull CheckoutStartEvent event) {
    try {
      String data = mapper.writeValueAsString(event);
      sendEventWithStringData("start", data);
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error processing start event", e);
    }
  }

  // Private

  private Map<String, Object> populateErrorDetails(CheckoutException checkoutError) {
    Map<String, Object> errorMap = new HashMap();
    errorMap.put("__typename", getErrorTypeName(checkoutError));
    errorMap.put("message", checkoutError.getErrorDescription());
    errorMap.put("recoverable", checkoutError.isRecoverable());
    errorMap.put("code", checkoutError.getErrorCode());

    if (checkoutError instanceof HttpException) {
      errorMap.put("statusCode", ((HttpException) checkoutError).getStatusCode());
    }

    return errorMap;
  }

  private String getErrorTypeName(CheckoutException error) {
    if (error instanceof CheckoutExpiredException) {
      return "CheckoutExpiredError";
    } else if (error instanceof ClientException) {
      return "CheckoutClientError";
    } else if (error instanceof HttpException) {
      return "CheckoutHTTPError";
    } else if (error instanceof ConfigurationException) {
      return "ConfigurationError";
    } else if (error instanceof CheckoutSheetKitException) {
      return "InternalError";
    } else {
      return "UnknownError";
    }
  }

  private void sendEvent(String eventName, @Nullable WritableNativeMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  private void sendEventWithStringData(String name, String data) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(name, data);
  }
}
