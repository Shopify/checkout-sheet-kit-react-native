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

import android.app.Activity;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.util.Log;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;

import com.shopify.checkoutsheetkit.Authentication;
import com.shopify.checkoutsheetkit.CheckoutException;
import com.shopify.checkoutsheetkit.CheckoutPaymentMethodChangeStartParams;
import com.shopify.checkoutsheetkit.DefaultCheckoutEventProcessor;
import com.shopify.checkoutsheetkit.CheckoutOptions;
import com.shopify.checkoutsheetkit.CheckoutWebView;
import com.shopify.checkoutsheetkit.CheckoutWebViewEventProcessor;
import com.shopify.checkoutsheetkit.HttpException;
import com.shopify.checkoutsheetkit.CheckoutExpiredException;
import com.shopify.checkoutsheetkit.ClientException;
import com.shopify.checkoutsheetkit.ConfigurationException;
import com.shopify.checkoutsheetkit.CheckoutSheetKitException;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompleteEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutStartEvent;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutAddressChangeStart;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutAddressChangeStartEvent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutPaymentMethodChangeStart;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import kotlin.Unit;

public class RCTCheckoutWebView extends FrameLayout {
  private static final String TAG = "RCTCheckoutWebView";
  private final ThemedReactContext context;
  private final ObjectMapper mapper = new ObjectMapper();

  private CheckoutWebView checkoutWebView;
  private String checkoutUrl;
  private String auth;
  private boolean pendingSetup = false;
  private CheckoutConfiguration lastConfiguration = null;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());

  private static class CheckoutConfiguration {
    private final String url;
    private final String authToken;

    CheckoutConfiguration(String url, String authToken) {
      this.url = url;
      this.authToken = authToken;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      CheckoutConfiguration that = (CheckoutConfiguration) o;
      return Objects.equals(url, that.url) && Objects.equals(authToken, that.authToken);
    }

    @Override
    public int hashCode() {
      return Objects.hash(url, authToken);
    }
  }

  public RCTCheckoutWebView(ThemedReactContext context) {
    super(context);
    this.context = context;
  }

  public void setCheckoutUrl(String url) {
    if (Objects.equals(url, checkoutUrl)) {
      return;
    }

    checkoutUrl = url;

    if (url == null) {
      removeCheckout();
    } else {
      scheduleSetupIfNeeded();
    }
  }

  public void setAuth(String authToken) {
    if (Objects.equals(authToken, auth)) {
      return;
    }

    auth = authToken;
    scheduleSetupIfNeeded();
  }

  void scheduleSetupIfNeeded() {
    if (pendingSetup) {
      return;
    }

    pendingSetup = true;
    mainHandler.post(this::setup);
  }

  private void setup() {
    pendingSetup = false;

    if (checkoutUrl == null) {
      removeCheckout();
      return;
    }

    CheckoutConfiguration newConfiguration = new CheckoutConfiguration(checkoutUrl, auth);
    if (newConfiguration.equals(lastConfiguration)) {
      return;
    }

    setupCheckoutWebView(checkoutUrl, newConfiguration);
  }

  public void setupCheckoutWebView(String url, CheckoutConfiguration configuration) {
    Log.d(TAG, "setupCheckoutWebView: Setting up new webview for URL: " + url);
    removeCheckout();

    checkoutWebView = new CheckoutWebView(this.context, null);
    Log.d(TAG, "setupCheckoutWebView: New CheckoutWebView created");

    CheckoutWebViewEventProcessor webViewEventProcessor = getCheckoutWebViewEventProcessor();
    checkoutWebView.setEventProcessor(webViewEventProcessor);

    CheckoutOptions options = new CheckoutOptions();
    if (auth != null && !auth.isEmpty()) {
      options = new CheckoutOptions(new Authentication.Token(auth));
    }
    checkoutWebView.loadCheckout(url, options);
    checkoutWebView.notifyPresented();

    LayoutParams params = new LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT
    );
    addView(checkoutWebView, params);
    ///  Works around a race condition where onLayout executes before setupCheckoutWebView
    ///  resulting in an empty view being rendered. Cannot move setup to constructor as
    ///  checkoutUrl is undefined until setCheckoutUrl is called by RCTCheckoutWebViewManager
    ///  requestLayout / invalidate were unsuccessful in remedying this
    checkoutWebView.layout(0, 0, getWidth(), getHeight());
    lastConfiguration = configuration;
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);
    if (checkoutWebView != null) {
      checkoutWebView.layout(0, 0, right - left, bottom - top);
    }
  }

  @NonNull
  private CheckoutWebViewEventProcessor getCheckoutWebViewEventProcessor() {
    Activity currentActivity = this.context.getCurrentActivity();
    InlineCheckoutEventProcessor eventProcessor = new InlineCheckoutEventProcessor(currentActivity);

    return new CheckoutWebViewEventProcessor(
      eventProcessor,
      (visible) -> Unit.INSTANCE, // toggleHeader
      (error) -> Unit.INSTANCE, // closeCheckoutDialogWithError
      (visibility) -> Unit.INSTANCE, // setProgressBarVisibility
      (percentage) -> Unit.INSTANCE // updateProgressBarPercentage
    );
  }

  void removeCheckout() {
    Log.d(TAG, "removeCheckout: Called, webview exists: " + (checkoutWebView != null));
    if (checkoutWebView != null) {
      Log.d(TAG, "removeCheckout: Destroying webview");
      removeView(checkoutWebView);
      checkoutWebView.destroy();
      checkoutWebView = null;
    }
    lastConfiguration = null;
  }

  public void reload() {
    if (checkoutWebView != null) {
      checkoutWebView.reload();
    } else if (checkoutUrl != null) {
      // Re-setup if WebView was destroyed but URL is still set
      CheckoutConfiguration configuration = new CheckoutConfiguration(checkoutUrl, auth);
      setupCheckoutWebView(checkoutUrl, configuration);
    }
  }

  public void respondToEvent(String eventId, String responseData) {
    Log.d(TAG, "Responding to event: " + eventId + " with data: " + responseData);

    if (checkoutWebView != null) {
      checkoutWebView.respondToEvent(eventId, responseData);
    } else {
      Log.e(TAG, "CheckoutWebView is null when trying to respond to event: " + eventId);
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    Log.d(TAG, "onAttachedToWindow: View attached to window, webview exists: " + (checkoutWebView != null));
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    Log.d(TAG, "onDetachedFromWindow: View detached from window (not destroying webview), webview exists: " + (checkoutWebView != null));
    // NOTE: We do NOT destroy the webview here to prevent issues during navigation
    // The webview will be properly cleaned up in the ViewManager's onDropViewInstance instead
  }

  private WritableMap serializeToWritableMap(Object event) {
    Map<String, Object> map = mapper.convertValue(event, new TypeReference<>() {
    });
    return Arguments.makeNativeMap(map);
  }

  private WritableMap buildErrorMap(CheckoutException error) {
    WritableMap errorMap = Arguments.createMap();
    errorMap.putString("__typename", getErrorTypeName(error));
    errorMap.putString("message", error.getErrorDescription());
    errorMap.putBoolean("recoverable", error.isRecoverable());
    errorMap.putString("code", error.getErrorCode());
    if (error instanceof HttpException) {
      errorMap.putInt("statusCode", ((HttpException) error).getStatusCode());
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

  private void sendEvent(String eventName, WritableMap params) {
    ReactContext reactContext = this.context.getReactApplicationContext();
    int viewId = getId();

    EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId);
    if (eventDispatcher == null) {
      Log.w(TAG, "Cannot send event '" + eventName + "': EventDispatcher not available (viewId=" + viewId + ")");
      return;
    }

    int surfaceId = UIManagerHelper.getSurfaceId(reactContext);
    eventDispatcher.dispatchEvent(new CheckoutEvent(surfaceId, viewId, eventName, params));
  }

  private class InlineCheckoutEventProcessor extends DefaultCheckoutEventProcessor {

    public InlineCheckoutEventProcessor(android.content.Context context) {
      super(context);
    }

    @Override
    public void onStart(@NonNull CheckoutStartEvent event) {
      try {
        WritableMap data = serializeToWritableMap(event);
        sendEvent("onStart", data);
      } catch (Exception e) {
        Log.e(TAG, "Error processing start event", e);
      }
    }

    @Override
    public void onComplete(@NonNull CheckoutCompleteEvent event) {
      try {
        WritableMap data = serializeToWritableMap(event);
        sendEvent("onComplete", data);
      } catch (Exception e) {
        Log.e(TAG, "Error processing complete event", e);
      }
    }

    @Override
    public void onFail(@NonNull CheckoutException error) {
      sendEvent("onError", buildErrorMap(error));
    }

    @Override
    public void onCancel() {
      sendEvent("onCancel", null);
    }

    @Override
    public void onAddressChangeStart(@NonNull CheckoutAddressChangeStart event) {
      try {
        CheckoutAddressChangeStartEvent params = event.getParams();
        Map<String, Object> eventData = new HashMap<>();

        eventData.put("id", event.getId());
        eventData.put("type", "addressChangeStart");
        eventData.put("addressType", params.getAddressType());
        eventData.put("cart", params.getCart());

        sendEvent("onAddressChangeStart", serializeToWritableMap(eventData));
      } catch (Exception e) {
        Log.e(TAG, "Error processing address change start event", e);
      }
    }

    @Override
    public void onPaymentMethodChangeStart(@NonNull CheckoutPaymentMethodChangeStart event) {
      try {
        CheckoutPaymentMethodChangeStartParams params = event.getParams();

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("id", event.getId());
        eventData.put("type", "paymentMethodChangeStart");
        eventData.put("cart", params.getCart());

        sendEvent("paymentMethodChangeStart", serializeToWritableMap(eventData));
      } catch (Exception e) {
        Log.e(TAG, "Error processing address change start event", e);
      }
    }

    @Override
    public void onLinkClick(@NonNull Uri uri) {
      WritableMap params = Arguments.createMap();
      params.putString("url", uri.toString());
      sendEvent("onLinkClick", params);
    }
  }
}
