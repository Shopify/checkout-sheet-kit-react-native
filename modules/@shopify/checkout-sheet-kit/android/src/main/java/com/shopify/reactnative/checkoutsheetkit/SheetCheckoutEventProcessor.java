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

import com.shopify.checkoutsheetkit.CheckoutException;
import com.shopify.checkoutsheetkit.CheckoutExpiredException;
import com.shopify.checkoutsheetkit.CheckoutSheetKitException;
import com.shopify.checkoutsheetkit.ClientException;
import com.shopify.checkoutsheetkit.ConfigurationException;
import com.shopify.checkoutsheetkit.DefaultCheckoutEventProcessor;
import com.shopify.checkoutsheetkit.HttpException;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompleteEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutStartEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutAddressChangeStartEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutSubmitStartEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutPaymentMethodChangeStartEvent;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class SheetCheckoutEventProcessor extends DefaultCheckoutEventProcessor {
  private static final String TAG = "SheetCheckoutEventProcessor";

  private final ReactApplicationContext reactContext;
  private final ObjectMapper mapper = new ObjectMapper();

  // Geolocation-specific variables

  private String geolocationOrigin;
  private GeolocationPermissions.Callback geolocationCallback;

  public SheetCheckoutEventProcessor(Context context, ReactApplicationContext reactContext) {
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
   * <p>
   * Since the app needs to request permissions first before granting, we store
   * the callback and origin in memory and emit a "geolocationRequest" event to
   * the app. The app will then request the necessary geolocation permissions
   * and invoke the native callback with the result.
   *
   * @param origin   - The origin of the request
   * @param callback - The callback to invoke when the app requests permissions
   */
  @Override
  public void onGeolocationPermissionsShowPrompt(
    @NonNull String origin,
    @NonNull GeolocationPermissions.Callback callback
  ) {

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
      Log.e(TAG, "Error emitting \"geolocationRequest\" event", e);
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
  public void onFail(@NonNull CheckoutException checkoutError) {
    try {
      String data = mapper.writeValueAsString(populateErrorDetails(checkoutError));
      sendEventWithStringData("error", data);
    } catch (IOException e) {
      Log.e(TAG, "Error processing checkout failed event", e);
    }
  }

  @Override
  public void onCancel() {
    sendEvent("close", null);
  }

  @Override
  public void onComplete(@NonNull CheckoutCompleteEvent event) {
    try {
      Map<String, Object> eventMap = new HashMap<>();
      eventMap.put("method", event.getMethod());
      eventMap.put("orderConfirmation", event.getOrderConfirmation());
      eventMap.put("cart", event.getCart());

      String data = mapper.writeValueAsString(eventMap);
      sendEventWithStringData("complete", data);
    } catch (IOException e) {
      Log.e(TAG, "Error processing complete event", e);
    }
  }

  @Override
  public void onStart(@NonNull CheckoutStartEvent event) {
    try {
      Map<String, Object> eventMap = new HashMap<>();
      eventMap.put("method", event.getMethod());
      eventMap.put("cart", event.getCart());

      String data = mapper.writeValueAsString(eventMap);
      sendEventWithStringData("start", data);
    } catch (IOException e) {
      Log.e(TAG, "Error processing start event", e);
    }
  }

  @Override
  public void onAddressChangeStart(@NonNull CheckoutAddressChangeStartEvent event) {
    try {
      Map<String, Object> eventMap = new HashMap<>();
      eventMap.put("id", event.getId());
      eventMap.put("method", event.getMethod());
      eventMap.put("addressType", event.getAddressType());
      eventMap.put("cart", event.getCart());

      String data = mapper.writeValueAsString(eventMap);
      sendEventWithStringData("addressChangeStart", data);
    } catch (IOException e) {
      Log.e(TAG, "Error processing address change start event", e);
    }
  }

  @Override
  public void onPaymentMethodChangeStart(@NonNull CheckoutPaymentMethodChangeStartEvent event) {
    try {
      Map<String, Object> eventMap = new HashMap<>();
      eventMap.put("id", event.getId());
      eventMap.put("method", event.getMethod());
      eventMap.put("cart", event.getCart());

      String data = mapper.writeValueAsString(eventMap);
      sendEventWithStringData("paymentMethodChangeStart", data);
    } catch (IOException e) {
      Log.e(TAG, "Error processing payment method change start event", e);
    }
  }

  @Override
  public void onSubmitStart(@NonNull CheckoutSubmitStartEvent event) {
    try {
      Map<String, Object> eventMap = new HashMap<>();
      eventMap.put("id", event.getId());
      eventMap.put("method", event.getMethod());
      eventMap.put("cart", event.getCart());

      Map<String, Object> checkoutMap = new HashMap<>();
      checkoutMap.put("id", event.getCheckout().getId());
      eventMap.put("checkout", checkoutMap);

      String data = mapper.writeValueAsString(eventMap);
      sendEventWithStringData("submitStart", data);
    } catch (IOException e) {
      Log.e(TAG, "Error processing submit start event", e);
    }
  }

  // Private
  private Map<String, Object> populateErrorDetails(CheckoutException error) {
    Map<String, Object> errorMap = new HashMap<>(Map.of(
      "__typename", getErrorTypeName(error),
      "message", error.getErrorDescription(),
      "recoverable", error.isRecoverable(),
      "code", error.getErrorCode()
    ));

    if (error instanceof HttpException) {
      errorMap.put("statusCode", ((HttpException) error).getStatusCode());
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
