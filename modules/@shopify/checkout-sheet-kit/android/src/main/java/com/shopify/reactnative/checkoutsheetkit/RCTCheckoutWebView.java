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
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.util.Log;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import com.shopify.checkoutsheetkit.Authentication;
import com.shopify.checkoutsheetkit.CheckoutOptions;
import com.shopify.checkoutsheetkit.CheckoutWebView;
import com.shopify.checkoutsheetkit.CheckoutWebViewEventProcessor;

import java.util.Objects;

import kotlin.Unit;

public class RCTCheckoutWebView extends FrameLayout {
    private static final String TAG = "RCTCheckoutWebView";
    private final ThemedReactContext context;

    private CheckoutWebView checkoutWebView;
    private String checkoutUrl;
    private String auth;
    private boolean pendingSetup = false;
    private CheckoutConfiguration lastConfiguration = null;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private record CheckoutConfiguration(String url, String authToken) {}

    public RCTCheckoutWebView(ThemedReactContext context) {
        super(context);
        this.context = context;
    }

    public RCTCheckoutWebView(ThemedReactContext context, AttributeSet attrs) {
        super(context, attrs);
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

  private void scheduleSetupIfNeeded() {
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

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);
        setup();
    }

    private void setupCheckoutWebView(String url, CheckoutConfiguration configuration) {
        Log.d(TAG, "setupCheckoutWebView: Setting up new webview for URL: " + url);
        removeCheckout();

        // Create the CheckoutWebView with null AttributeSet
        checkoutWebView = new CheckoutWebView(getContext(), null);
        Log.d(TAG, "setupCheckoutWebView: New CheckoutWebView created");

        // Set up event processor with all required parameters
      CheckoutWebViewEventProcessor webViewEventProcessor = getCheckoutWebViewEventProcessor();
      checkoutWebView.setEventProcessor(webViewEventProcessor);

        // Configure authentication if provided
        CheckoutOptions options = new CheckoutOptions();
        if (auth != null && !auth.isEmpty()) {
            options = new CheckoutOptions(new Authentication.Token(auth));
        }

        // Add to view hierarchy
        LayoutParams params = new LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        );
        addView(checkoutWebView, params);

        // Load the URL with options
        checkoutWebView.loadCheckout(url, options);
        checkoutWebView.notifyPresented();

        // Send onLoad event
        WritableMap event = Arguments.createMap();
        event.putString("url", url);
        sendEvent("onLoad", event);

        lastConfiguration = configuration;
    }

  @NonNull
  private CheckoutWebViewEventProcessor getCheckoutWebViewEventProcessor() {
    Activity currentActivity = this.context.getCurrentActivity();
    ReactApplicationContext reactAppContext = this.context.getReactApplicationContext();

    return new CheckoutWebViewEventProcessor(
        new CustomCheckoutEventProcessor(currentActivity, reactAppContext),
        (visible) -> Unit.INSTANCE, // toggleHeader
        (error) -> Unit.INSTANCE, // closeCheckoutDialogWithError
        (visibility) -> Unit.INSTANCE, // setProgressBarVisibility
        (percentage) -> Unit.INSTANCE // updateProgressBarPercentage
    );
  }

  private void removeCheckout() {
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
            // Delegate to the WebView's respondToEvent method
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

    private void sendEvent(String eventName, WritableMap params) {
        ReactContext reactContext = this.context.getReactApplicationContext();
        reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), eventName, params);
    }
}
