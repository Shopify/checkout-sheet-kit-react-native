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

namespace CheckoutCompletedEvent {
  interface Address {
    address1?: string;
    address2?: string;
    city?: string;
    countryCode?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    postalCode?: string;
    referenceId?: string;
    zoneCode?: string;
  }

  interface CartInfo {
    lines: CartLine[];
    price: Price;
    token: string;
  }

  interface CartLineImage {
    altText?: string;
    lg: string;
    md: string;
    sm: string;
  }

  interface CartLine {
    discounts?: Discount[];
    image?: CartLineImage;
    merchandiseId?: string;
    price: Money;
    productId?: string;
    quantity: number;
    title: string;
  }

  interface DeliveryDetails {
    additionalInfo?: string;
    location?: Address;
    name?: string;
  }

  interface DeliveryInfo {
    details: DeliveryDetails;
    method: string;
  }

  interface Discount {
    amount?: Money;
    applicationType?: string;
    title?: string;
    value?: number;
    valueType?: string;
  }

  export interface OrderDetails {
    billingAddress?: Address;
    cart: CartInfo;
    deliveries?: DeliveryInfo[];
    email?: string;
    id: string;
    paymentMethods?: PaymentMethod[];
    phone?: string;
  }

  interface PaymentMethod {
    details: {[key: string]: string | null};
    type: string;
  }

  interface Price {
    discounts?: Discount[];
    shipping?: Money;
    subtotal?: Money;
    taxes?: Money;
    total?: Money;
  }

  interface Money {
    amount?: number;
    currencyCode?: string;
  }
}

export interface CheckoutCompletedEvent {
  orderDetails: CheckoutCompletedEvent.OrderDetails;
}
