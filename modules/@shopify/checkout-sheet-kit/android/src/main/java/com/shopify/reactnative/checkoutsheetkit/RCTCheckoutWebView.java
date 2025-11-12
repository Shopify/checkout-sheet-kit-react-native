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
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.util.Log;
import android.widget.FrameLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import com.shopify.checkoutsheetkit.CheckoutAddressChangeRequestedEvent;
import com.shopify.checkoutsheetkit.CheckoutException;
import com.shopify.checkoutsheetkit.CheckoutOptions;
import com.shopify.checkoutsheetkit.CheckoutWebView;
import com.shopify.checkoutsheetkit.CheckoutWebViewEventProcessor;
import com.shopify.checkoutsheetkit.DefaultCheckoutEventProcessor;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompletedEvent;
import com.shopify.checkoutsheetkit.pixelevents.PixelEvent;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

public class RCTCheckoutWebView extends FrameLayout {
    private static final String TAG = "RCTCheckoutWebView";

    private CheckoutWebView checkoutWebView;
    private String checkoutUrl;
    private String auth;
    private boolean pendingSetup = false;
    private CheckoutConfiguration lastConfiguration = null;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private static class CheckoutConfiguration {
        final String url;
        final String authToken;

        CheckoutConfiguration(String url, String authToken) {
            this.url = url;
            this.authToken = authToken;
        }

        @Override
        public boolean equals(Object obj) {
            if (!(obj instanceof CheckoutConfiguration)) {
                return false;
            }
            CheckoutConfiguration other = (CheckoutConfiguration) obj;
            return url.equals(other.url) &&
                   ((authToken == null && other.authToken == null) ||
                    (authToken != null && authToken.equals(other.authToken)));
        }
    }

    public RCTCheckoutWebView(Context context) {
        super(context);
        Log.d(TAG, "RCTCheckoutWebView constructor called");
        init();
    }

    public RCTCheckoutWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        Log.d(TAG, "RCTCheckoutWebView constructor with attrs called");
        init();
    }

    private void init() {
        // Empty initialization - WebView will be created when URL is set
        Log.d(TAG, "RCTCheckoutWebView initialized");
    }

    public void setCheckoutUrl(String url) {
        if (url == null ? checkoutUrl == null : url.equals(checkoutUrl)) {
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
        if (authToken == null ? auth == null : authToken.equals(auth)) {
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
        CheckoutWebEventProcessor eventProcessor = new CheckoutWebEventProcessor();
        CheckoutWebViewEventProcessor webViewEventProcessor = new CheckoutWebViewEventProcessor(
            eventProcessor,
            (visible) -> { return kotlin.Unit.INSTANCE; }, // toggleHeader
            (error) -> { return kotlin.Unit.INSTANCE; }, // closeCheckoutDialogWithError
            (visibility) -> { return kotlin.Unit.INSTANCE; }, // setProgressBarVisibility
            (percentage) -> { return kotlin.Unit.INSTANCE; } // updateProgressBarPercentage
        );
        checkoutWebView.setEventProcessor(webViewEventProcessor);

        // Configure authentication if provided
        CheckoutOptions options = null;
        if (auth != null && !auth.isEmpty()) {
            options = new CheckoutOptions(auth);
        }

        // Add to view hierarchy
        LayoutParams params = new LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        );
        addView(checkoutWebView, params);

        // Load the URL with options
        checkoutWebView.loadCheckout(url, false, options);
        checkoutWebView.notifyPresented();

        // Send onLoad event
        WritableMap event = Arguments.createMap();
        event.putString("url", url);
        sendEvent("onLoad", event);

        lastConfiguration = configuration;
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
        ReactContext reactContext = (ReactContext) getContext();
        reactContext.getJSModule(RCTEventEmitter.class)
            .receiveEvent(getId(), eventName, params);
    }

    private class CheckoutWebEventProcessor extends DefaultCheckoutEventProcessor {

        public CheckoutWebEventProcessor() {
            super(getContext());
        }

        @Override
        public void onCheckoutCompleted(CheckoutCompletedEvent event) {
            try {
                String eventJson = mapper.writeValueAsString(event);
                WritableMap params = Arguments.createMap();

                // Parse the JSON to extract fields
                Map<String, Object> eventMap = mapper.readValue(eventJson, Map.class);
                for (Map.Entry<String, Object> entry : eventMap.entrySet()) {
                    if (entry.getValue() instanceof String) {
                        params.putString(entry.getKey(), (String) entry.getValue());
                    } else if (entry.getValue() instanceof Number) {
                        params.putDouble(entry.getKey(), ((Number) entry.getValue()).doubleValue());
                    } else if (entry.getValue() instanceof Boolean) {
                        params.putBoolean(entry.getKey(), (Boolean) entry.getValue());
                    } else if (entry.getValue() != null) {
                        params.putString(entry.getKey(), mapper.writeValueAsString(entry.getValue()));
                    }
                }

                sendEvent("onComplete", params);
            } catch (JsonProcessingException e) {
                Log.e(TAG, "Failed to serialize completed event", e);
            }
        }

        @Override
        public void onCheckoutFailed(CheckoutException error) {
            WritableMap params = Arguments.createMap();
            params.putString("message", error.getMessage());
            params.putString("code", error.getErrorCode());
            params.putBoolean("recoverable", error.isRecoverable());
            sendEvent("onError", params);
        }

        @Override
        public void onCheckoutCanceled() {
            sendEvent("onCancel", Arguments.createMap());
        }

        @Override
        public void onWebPixelEvent(PixelEvent event) {
            try {
                String eventJson = mapper.writeValueAsString(event);
                WritableMap params = Arguments.createMap();

                // Parse the JSON to extract fields
                Map<String, Object> eventMap = mapper.readValue(eventJson, Map.class);
                for (Map.Entry<String, Object> entry : eventMap.entrySet()) {
                    if (entry.getValue() instanceof String) {
                        params.putString(entry.getKey(), (String) entry.getValue());
                    } else if (entry.getValue() != null) {
                        params.putString(entry.getKey(), mapper.writeValueAsString(entry.getValue()));
                    }
                }

                sendEvent("onPixelEvent", params);
            } catch (JsonProcessingException e) {
                Log.e(TAG, "Failed to serialize pixel event", e);
            }
        }

        @Override
        public void onCheckoutLinkClicked(Uri url) {
            WritableMap params = Arguments.createMap();
            params.putString("url", url.toString());
            sendEvent("onClickLink", params);
        }

        @Override
        public void onAddressChangeRequested(CheckoutAddressChangeRequestedEvent event) {
            String eventId = event.getId();
            if (eventId == null) {
                Log.e(TAG, "Event ID is null for address change event");
                return;
            }

            WritableMap params = Arguments.createMap();
            params.putString("id", eventId);
            params.putString("type", "addressChangeIntent");
            params.putString("addressType", event.getAddressType());

            // Include selected address if available
            if (event.getSelectedAddress() != null) {
                try {
                    String selectedAddressJson = mapper.writeValueAsString(event.getSelectedAddress());
                    params.putString("selectedAddress", selectedAddressJson);
                } catch (JsonProcessingException e) {
                    Log.e(TAG, "Failed to serialize selected address", e);
                }
            }

            sendEvent("onAddressChangeIntent", params);
        }

        // Note: Payment change events are not yet supported in Android SDK
        // This will be added when the SDK supports it
    }
}
