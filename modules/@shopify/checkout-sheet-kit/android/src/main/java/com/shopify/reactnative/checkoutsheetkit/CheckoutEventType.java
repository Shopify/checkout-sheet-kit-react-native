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

/**
 * Registering a new type in this enum will automatically register a channel
 * that can trigger an event to be received back in React Native.
 *
 * For example, you can trigger an event from Java/Kotlin by calling:
 *
 *   RCTCheckoutWebView.sendEvent(CheckoutEventType.ON_START, null);
 *
 * This will execute the corresponding prop in JavaScript:
 *
 *   <ShopifyCheckout
 *     onStart={() => {}} // <- Will be executed
 *   />
 */
public enum CheckoutEventType {
  ON_START("onStart"),
  ON_FAIL("onFail"),
  ON_COMPLETE("onComplete"),
  ON_CANCEL("onCancel"),
  ON_LINK_CLICK("onLinkClick"),
  ON_ADDRESS_CHANGE_START("onAddressChangeStart"),
  ON_PAYMENT_METHOD_CHANGE_START("onPaymentMethodChangeStart"),
  ON_SUBMIT_START("onSubmitStart");

  private final String eventName;

  CheckoutEventType(String eventName) {
    this.eventName = eventName;
  }

  public String getEventName() {
    return eventName;
  }
}
