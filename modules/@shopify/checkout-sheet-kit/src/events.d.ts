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

/**
 * Cart state from checkout events.
 * Represents the current state of the buyer's cart including items, costs, delivery, and buyer identity.
 */
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

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: CartLineMerchandise;
  cost: CartLineCost;
  discountAllocations: CartDiscountAllocation[];
}

export interface CartLineCost {
  amountPerQuantity: Money;
  subtotalAmount: Money;
  totalAmount: Money;
}

export interface CartLineMerchandise {
  id: string;
  title: string;
  product: Product;
  image?: MerchandiseImage;
  selectedOptions: SelectedOption[];
}

export interface Product {
  id: string;
  title: string;
}

export interface MerchandiseImage {
  url: string;
  altText?: string;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface CartDiscountAllocation {
  discountedAmount: Money;
  discountApplication: DiscountApplication;
  targetType: DiscountApplicationTargetType;
}

export interface DiscountApplication {
  allocationMethod: AllocationMethod;
  targetSelection: TargetSelection;
  targetType: DiscountApplicationTargetType;
  value: DiscountValue;
}

export type AllocationMethod = 'ACROSS' | 'EACH';
export type TargetSelection = 'ALL' | 'ENTITLED' | 'EXPLICIT';
export type DiscountApplicationTargetType = 'LINE_ITEM' | 'SHIPPING_LINE';

export interface CartCost {
  subtotalAmount: Money;
  totalAmount: Money;
}

export interface CartBuyerIdentity {
  email?: string;
  phone?: string;
  customer?: Customer;
  countryCode?: string;
}

export interface Customer {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface CartDeliveryGroup {
  deliveryAddress: MailingAddress;
  deliveryOptions: CartDeliveryOption[];
  selectedDeliveryOption?: CartDeliveryOption;
  groupType: CartDeliveryGroupType;
}

export interface MailingAddress {
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

export interface CartDeliveryOption {
  code?: string;
  title?: string;
  description?: string;
  handle: string;
  estimatedCost: Money;
  deliveryMethodType: CartDeliveryMethodType;
}

export type CartDeliveryMethodType = 'SHIPPING' | 'PICKUP' | 'PICKUP_POINT' | 'LOCAL' | 'NONE';
export type CartDeliveryGroupType = 'SUBSCRIPTION' | 'ONE_TIME_PURCHASE';

export interface CartDelivery {
  addresses: CartSelectableAddress[];
}

export interface CartSelectableAddress {
  address: CartAddress;
}

/**
 * A delivery address of the buyer that is interacting with the cart.
 * This is a union type to support future address types
 * Currently only CartDeliveryAddress is supported.
 */
export type CartAddress = CartDeliveryAddress;

export interface CartDeliveryAddress {
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

export interface CartDiscountCode {
  code: string;
  applicable: boolean;
}

export interface AppliedGiftCard {
  amountUsed: Money;
  balance: Money;
  lastCharacters: string;
  presentmentAmountUsed: Money;
}

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface PricingPercentageValue {
  percentage: number;
}

export type DiscountValue = Money | PricingPercentageValue;

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
}

export interface CheckoutCompleteEvent {
  orderConfirmation: CheckoutCompleteEvent.OrderConfirmation;
  cart: Cart;
}

export interface CheckoutStartEvent {
  cart: Cart;
}

/**
 * Error object returned in checkout event responses.
 * Used to communicate validation or processing errors back to checkout.
 */
export interface CheckoutResponseError {
  /**
   * Human-readable error message.
   */
  message: string;
  /**
   * Additional error properties (e.g., error code, field name, etc.)
   */
  [key: string]: any;
}

/**
 * Cart input for updating cart state via checkout events.
 * Mirrors the Storefront API CartInput structure.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/input-objects/CartInput
 */
export interface CartInput {
  /**
   * Delivery-related fields for the cart.
   */
  delivery?: {
    /**
     * Array of selectable addresses presented to the buyer.
     */
    addresses?: Array<{
      /**
       * The delivery address details.
       */
      address: {
        /** First line of the address (street address or PO Box) */
        address1?: string;
        /** Second line of the address (apartment, suite, unit) */
        address2?: string;
        /** City, district, village, or town */
        city?: string;
        /** Company or organization name */
        company?: string;
        /**
         * Two-letter country code - REQUIRED
         * Must be exactly 2 characters (ISO 3166-1 alpha-2 format)
         * Examples: "US", "CA", "GB", "AU"
         */
        countryCode: string;
        /** First name of the customer */
        firstName?: string;
        /** Last name of the customer */
        lastName?: string;
        /** Phone number (E.164 format recommended, e.g., +16135551111) */
        phone?: string;
        /** Province/state code (e.g., "CA", "ON") */
        provinceCode?: string;
        /** Zip or postal code */
        zip?: string;
      };
      /**
       * Whether this address is selected as the active delivery address.
       * Optional - use to pre-select an address from multiple options.
       */
      selected?: boolean;
    }>;
  };
  /**
   * The customer associated with the cart.
   * Optional - use to update buyer identity information.
   */
  buyerIdentity?: {
    email?: string;
    phone?: string;
    countryCode?: string;
  };
  /**
   * Case-insensitive discount codes.
   * Optional - use to apply discount codes to the cart.
   */
  discountCodes?: string[];
}

/**
 * Event emitted when checkout starts an address change flow.
 *
 * This event is only emitted when native address selection is enabled
 * for the authenticated app in the Shopify admin settings.
 */
export interface CheckoutAddressChangeStart {
  /**
   * Unique identifier for this event instance.
   * Use this ID with the CheckoutEventProvider to respond to the event.
   */
  id: string;

  /**
   * The event type identifier
   */
  type: 'addressChangeStart';

  /**
   * The type of address being changed.
   * - "shipping": The buyer is changing their shipping address
   * - "billing": The buyer is changing their billing address
   */
  addressType: 'shipping' | 'billing';

  /**
   * The current cart state at the time of the address change request.
   * This provides context about the cart contents, buyer identity, and current delivery options.
   */
  cart: Cart;
}

/**
 * Response payload for CheckoutAddressChangeStart event.
 * Use with CheckoutEventProvider.respondToEvent() or useShopifyEvent().respondWith()
 *
 * Note: This response is only used when native address selection is enabled
 * for the authenticated app in the Shopify admin settings.
 *
 * Validation requirements:
 * - cart.delivery.addresses must contain at least one address
 * - Each address must include a countryCode
 * - countryCode must be exactly 2 characters (ISO 3166-1 alpha-2 format)
 */
export interface CheckoutAddressChangeStartResponse {
  /**
   * Updated cart input with delivery addresses and optional buyer identity.
   */
  cart?: CartInput;
  /**
   * Optional array of errors if the address selection failed.
   */
  errors?: CheckoutResponseError[];
}

export interface CheckoutPaymentChangeIntent {
  id: string;
  type: string;
  currentCard?: {
    last4: string;
    brand: string;
  };
}
