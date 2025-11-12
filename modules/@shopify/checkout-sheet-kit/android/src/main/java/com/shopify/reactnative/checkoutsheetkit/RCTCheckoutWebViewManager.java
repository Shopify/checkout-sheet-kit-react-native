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

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class RCTCheckoutWebViewManager extends SimpleViewManager<RCTCheckoutWebView> {
    private static final String TAG = "RCTCheckoutWebViewManager";
    private static final String REACT_CLASS = "RCTCheckoutWebView";

    private static final int COMMAND_RELOAD = 1;
    private static final int COMMAND_RESPOND_TO_EVENT = 2;

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected RCTCheckoutWebView createViewInstance(@NonNull ThemedReactContext context) {
        return new RCTCheckoutWebView(context);
    }

    @ReactProp(name = "checkoutUrl")
    public void setCheckoutUrl(RCTCheckoutWebView view, @Nullable String url) {
        view.setCheckoutUrl(url);
    }

    @ReactProp(name = "auth")
    public void setAuth(RCTCheckoutWebView view, @Nullable String authToken) {
        view.setAuth(authToken);
    }

    @Override
    public Map<String, Integer> getCommandsMap() {
        return MapBuilder.of(
            "reload", COMMAND_RELOAD,
            "respondToEvent", COMMAND_RESPOND_TO_EVENT
        );
    }

    @Override
    public void receiveCommand(@NonNull RCTCheckoutWebView view, int commandId, @Nullable ReadableArray args) {
        switch (commandId) {
            case COMMAND_RELOAD:
                view.reload();
                break;
            case COMMAND_RESPOND_TO_EVENT:
                if (args != null && args.size() >= 2) {
                    String eventId = args.getString(0);
                    String responseData = args.getString(1);
                    view.respondToEvent(eventId, responseData);
                } else {
                    Log.e(TAG, "respondToEvent command requires eventId and responseData arguments");
                }
                break;
            default:
                Log.e(TAG, "Unsupported command: " + commandId);
        }
    }

    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
            .put("onLoad", MapBuilder.of("registrationName", "onLoad"))
            .put("onError", MapBuilder.of("registrationName", "onError"))
            .put("onComplete", MapBuilder.of("registrationName", "onComplete"))
            .put("onCancel", MapBuilder.of("registrationName", "onCancel"))
            .put("onPixelEvent", MapBuilder.of("registrationName", "onPixelEvent"))
            .put("onClickLink", MapBuilder.of("registrationName", "onClickLink"))
            .put("onAddressChangeIntent", MapBuilder.of("registrationName", "onAddressChangeIntent"))
            .put("onPaymentChangeIntent", MapBuilder.of("registrationName", "onPaymentChangeIntent"))
            .build();
    }

    @Override
    public void onDropViewInstance(@NonNull RCTCheckoutWebView view) {
        Log.d(TAG, "onDropViewInstance: Properly cleaning up CheckoutWebView");
        // Clean up the webview when React actually unmounts the component
        view.setCheckoutUrl(null);
        super.onDropViewInstance(view);
    }
}
