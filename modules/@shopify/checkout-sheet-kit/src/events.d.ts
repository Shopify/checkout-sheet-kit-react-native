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

namespace CheckoutCompleteEvent {
  export interface OrderConfirmation {
    url?: string;
    order: Order;
    number?: string;
    isFirstOrder: boolean;
  }

  interface Order {
    id: string;
  }

  export interface Cart {
    id: string;
    lines: CartLine[];
    cost: CartCost;
    buyerIdentity: CartBuyerIdentity;
    deliveryGroups: CartDeliveryGroup[];
    discountCodes: CartDiscountCode[];
    appliedGiftCards: AppliedGiftCard[];
    discountAllocations: CartDiscountAllocation[];
    delivery: CartDelivery;
  }

  interface CartLine {
    id: string;
    quantity: number;
    merchandise: CartLineMerchandise;
    cost: CartLineCost;
    discountAllocations: CartDiscountAllocation[];
  }

  interface CartLineCost {
    amountPerQuantity: Money;
    subtotalAmount: Money;
    totalAmount: Money;
  }

  interface CartLineMerchandise {
    id: string;
    title: string;
    product: Product;
    image?: MerchandiseImage;
    selectedOptions: SelectedOption[];
  }

  interface Product {
    id: string;
    title: string;
  }

  interface MerchandiseImage {
    url: string;
    altText?: string;
  }

  interface SelectedOption {
    name: string;
    value: string;
  }

  interface CartDiscountAllocation {
    discountedAmount: Money;
    discountApplication: DiscountApplication;
    targetType: DiscountApplicationTargetType;
  }

  interface DiscountApplication {
    allocationMethod: AllocationMethod;
    targetSelection: TargetSelection;
    targetType: DiscountApplicationTargetType;
    value: DiscountValue;
  }

  type AllocationMethod = 'ACROSS' | 'EACH';
  type TargetSelection = 'ALL' | 'ENTITLED' | 'EXPLICIT';
  type DiscountApplicationTargetType = 'LINE_ITEM' | 'SHIPPING_LINE';

  interface CartCost {
    subtotalAmount: Money;
    totalAmount: Money;
  }

  interface CartBuyerIdentity {
    email?: string;
    phone?: string;
    customer?: Customer;
    countryCode?: string;
  }

  interface Customer {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }

  interface CartDeliveryGroup {
    deliveryAddress: MailingAddress;
    deliveryOptions: CartDeliveryOption[];
    selectedDeliveryOption?: CartDeliveryOption;
    groupType: CartDeliveryGroupType;
  }

  interface MailingAddress {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    countryCodeV2?: string;
    zip?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
  }

  interface CartDeliveryOption {
    code?: string;
    title?: string;
    description?: string;
    handle: string;
    estimatedCost: Money;
    deliveryMethodType: CartDeliveryMethodType;
  }

  type CartDeliveryMethodType = 'SHIPPING' | 'PICKUP' | 'PICKUP_POINT' | 'LOCAL' | 'NONE';
  type CartDeliveryGroupType = 'SUBSCRIPTION' | 'ONE_TIME_PURCHASE';

  interface CartDelivery {
    addresses: CartSelectableAddress[];
  }

  interface CartSelectableAddress {
    address: CartAddress;
  }

  /**
   * A delivery address of the buyer that is interacting with the cart.
   * This is a union type to support future address types
   * Currently only CartDeliveryAddress is supported.
   */
  type CartAddress = CartDeliveryAddress;

  interface CartDeliveryAddress {
    address1?: string;
    address2?: string;
    city?: string;
    company?: string;
    countryCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    provinceCode?: string;
    zip?: string;
  }

  interface CartDiscountCode {
    code: string;
    applicable: boolean;
  }

  interface AppliedGiftCard {
    amountUsed: Money;
    balance: Money;
    lastCharacters: string;
    presentmentAmountUsed: Money;
  }

  interface Money {
    amount: string;
    currencyCode: string;
  }

  interface PricingPercentageValue {
    percentage: number;
  }

  type DiscountValue = Money | PricingPercentageValue;
}

export interface CheckoutCompleteEvent {
  orderConfirmation: CheckoutCompleteEvent.OrderConfirmation;
  cart: CheckoutCompleteEvent.Cart;
}

export interface CheckoutStartEvent {
  cart: CheckoutCompleteEvent.Cart;
}

export interface CheckoutAddressChangeIntent {
  id: string;
  type: string;
  addressType: string;
}

export interface CheckoutPaymentChangeIntent {
  id: string;
  type: string;
  currentCard?: {
    last4: string;
    brand: string;
  };
}
