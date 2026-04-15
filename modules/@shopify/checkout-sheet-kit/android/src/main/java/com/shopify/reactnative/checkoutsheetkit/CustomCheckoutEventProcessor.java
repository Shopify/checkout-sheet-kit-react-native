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

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.webkit.GeolocationPermissions;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.shopify.checkoutsheetkit.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.shopify.checkoutsheetkit.pixelevents.PixelEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompletedEvent;
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
  public void onWebPixelEvent(@NonNull PixelEvent event) {
    try {
      String data = mapper.writeValueAsString(event);
      sendEventWithStringData("pixel", data);
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error processing pixel event", e);
    }
  }

  @Override
  public void onCheckoutFailed(CheckoutException checkoutError) {
    try {
      String data = mapper.writeValueAsString(populateErrorDetails(checkoutError));
      sendEventWithStringData("error", data);
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error processing checkout failed event", e);
    }
  }

  @Override
  public void onCheckoutCanceled() {
    sendEvent("close", null);
  }

  /**
   * Handles external links clicked during checkout (offsite payments, mailto, tel, etc.).
   *
   * For intent:// URIs (used by offsite payment providers like Klarna, iDEAL),
   * parses the intent and launches it safely with ACTION_VIEW only.
   * For standard schemes (http, https, mailto, tel), delegates to the default handler.
   */
  @Override
  public void onCheckoutLinkClicked(@NonNull Uri uri) {
    String scheme = uri.getScheme();
    if ("intent".equals(scheme)) {
      try {
        Intent intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
        // Security: restrict to ACTION_VIEW only to prevent intent scheme hijacking
        intent.setAction(Intent.ACTION_VIEW);
        // Security: clear potentially dangerous flags
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        Context context = reactContext.getCurrentActivity();
        if (context == null) {
          context = reactContext;
        }

        if (intent.resolveActivity(context.getPackageManager()) != null) {
          context.startActivity(intent);
        } else {
          // Fallback: try the fallback URL from the intent if available
          String fallbackUrl = intent.getStringExtra("browser_fallback_url");
          if (fallbackUrl != null) {
            Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl));
            fallbackIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(fallbackIntent);
          } else {
            Log.w("ShopifyCheckoutSheetKit", "No app found to handle intent URI: " + uri);
            super.onCheckoutLinkClicked(uri);
          }
        }
      } catch (Exception e) {
        Log.e("ShopifyCheckoutSheetKit", "Error handling intent:// URI", e);
        super.onCheckoutLinkClicked(uri);
      }
    } else {
      super.onCheckoutLinkClicked(uri);
    }
  }

  @Override
  public void onCheckoutCompleted(@NonNull CheckoutCompletedEvent event) {
    try {
      String data = mapper.writeValueAsString(event);
      sendEventWithStringData("completed", data);
    } catch (IOException e) {
      Log.e("ShopifyCheckoutSheetKit", "Error processing completed event", e);
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
