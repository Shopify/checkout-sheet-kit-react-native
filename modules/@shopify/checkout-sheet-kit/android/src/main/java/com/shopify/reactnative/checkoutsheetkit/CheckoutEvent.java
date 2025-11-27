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

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

/**
 * Can be used to send events back to props of instances of components
 *
 *     private void sendEvent(String eventName, WritableMap params) {
 *         ReactContext reactContext = this.context.getReactApplicationContext();
 *         int viewId = getId();
 *         EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId);
 *         int surfaceId = UIManagerHelper.getSurfaceId(reactContext);
 *         eventDispatcher.dispatchEvent(new CheckoutEvent(surfaceId, viewId, eventName, params));
 *     }
**/
public class CheckoutEvent extends Event<CheckoutEvent> {
    private final String eventName;
    private final WritableMap payload;

    public CheckoutEvent(int surfaceId, int viewId, String eventName, WritableMap payload) {
        super(surfaceId, viewId);
        this.eventName = eventName;
        this.payload = payload;
    }

    @NonNull
    @Override
    public String getEventName() {
        return eventName;
    }

    @Override
    protected WritableMap getEventData() {
        return payload != null ? payload : Arguments.createMap();
    }
}
