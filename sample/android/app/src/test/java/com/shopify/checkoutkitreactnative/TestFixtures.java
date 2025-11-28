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

package com.shopify.checkoutkitreactnative;

import com.shopify.checkoutsheetkit.lifecycleevents.Cart;
import com.shopify.checkoutsheetkit.lifecycleevents.CartBuyerIdentity;
import com.shopify.checkoutsheetkit.lifecycleevents.CartCost;
import com.shopify.checkoutsheetkit.lifecycleevents.CartDelivery;
import com.shopify.checkoutsheetkit.lifecycleevents.Money;

import java.util.Collections;

/**
 * Shared test fixtures for creating test objects.
 */
public class TestFixtures {

  /**
   * Creates a test Cart instance with sensible defaults.
   *
   * @param id The cart identifier
   * @param subtotalAmount The subtotal amount as a string
   * @param totalAmount The total amount as a string
   * @param currencyCode The currency code (default: "USD")
   * @return A Cart instance suitable for testing
   *
   * Example:
   * <pre>
   * Cart cart = createTestCart(
   *     "custom-cart-id",
   *     "50.00",
   *     "50.00",
   *     "USD"
   * );
   * </pre>
   */
  public static Cart createTestCart(
      String id,
      String subtotalAmount,
      String totalAmount,
      String currencyCode
  ) {
    Money subtotal = new Money(subtotalAmount, currencyCode);
    Money total = new Money(totalAmount, currencyCode);
    CartCost cost = new CartCost(subtotal, total);
    CartBuyerIdentity buyerIdentity = new CartBuyerIdentity(null, null, null, null);
    CartDelivery delivery = new CartDelivery(Collections.emptyList());

    return new Cart(
        id,
        Collections.emptyList(), // lines
        cost,
        buyerIdentity,
        Collections.emptyList(), // deliveryGroups
        Collections.emptyList(), // discountCodes
        Collections.emptyList(), // appliedGiftCards
        Collections.emptyList(), // discountAllocations
        delivery,
        Collections.emptyList() // paymentInstruments
    );
  }

  /**
   * Creates a test Cart instance with default values.
   *
   * @return A Cart instance with default test values
   */
  public static Cart createTestCart() {
    return createTestCart(
        "gid://shopify/Cart/test-cart-123",
        "10.00",
        "10.00",
        "USD"
    );
  }
}

