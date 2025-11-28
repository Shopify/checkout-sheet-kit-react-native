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
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/Cart
 */
export interface Cart {
  /** Globally unique identifier for the cart */
  id: string;
  /** List of merchandise line items in the cart */
  lines: CartLine[];
  /** Cost summary for the entire cart */
  cost: CartCost;
  /** Information about the buyer */
  buyerIdentity: CartBuyerIdentity;
  /** Delivery groups for the cart, grouped by delivery address */
  deliveryGroups: CartDeliveryGroup[];
  /** Discount codes applied or available to apply */
  discountCodes: CartDiscountCode[];
  /** Gift cards applied to the cart */
  appliedGiftCards: AppliedGiftCard[];
  /** Cart-level discount allocations */
  discountAllocations: CartDiscountAllocation[];
  /** Delivery addresses for the cart */
  delivery: CartDelivery;
  /** Payment information for the cart */
  payment: CartPayment;
}

/**
 * A line item in the cart, representing a single product/variant.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CartLine
 */
export interface CartLine {
  /** Globally unique identifier for the cart line */
  id: string;
  /** Number of items for this line */
  quantity: number;
  /** Product variant information */
  merchandise: CartLineMerchandise;
  /** Cost information for this line item */
  cost: CartLineCost;
  /** Discounts applied to this line item */
  discountAllocations: CartDiscountAllocation[];
}

/**
 * Cost information for a cart line item.
 * Includes per-quantity pricing and totals with discounts applied.
 */
export interface CartLineCost {
  /** Cost of a single unit of the merchandise */
  amountPerQuantity: Money;
  /** Total cost before discounts (quantity × amountPerQuantity) */
  subtotalAmount: Money;
  /** Total cost after line-item discounts applied */
  totalAmount: Money;
}

/**
 * Product variant information for a cart line item.
 * Represents the specific product variant selected by the buyer.
 */
export interface CartLineMerchandise {
  /** Globally unique identifier for the product variant */
  id: string;
  /** Display name of the variant */
  title: string;
  /** The product this variant belongs to */
  product: Product;
  /** Image for the variant or product */
  image?: MerchandiseImage;
  /** Selected product options (e.g., Size, Color) */
  selectedOptions: SelectedOption[];
}

/**
 * Basic product information.
 */
export interface Product {
  /** Globally unique identifier for the product */
  id: string;
  /** Display name of the product */
  title: string;
}

/**
 * Product or variant image.
 */
export interface MerchandiseImage {
  /** URL of the image */
  url: string;
  /** Alternative text for accessibility */
  altText?: string;
}

/**
 * A selected product option (e.g., Size: Large, Color: Blue).
 */
export interface SelectedOption {
  /** Option name (e.g., "Size", "Color") */
  name: string;
  /** Selected value (e.g., "Large", "Blue") */
  value: string;
}

/**
 * Cost summary for the entire cart.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CartCost
 */
export interface CartCost {
  /** Subtotal before shipping and taxes */
  subtotalAmount: Money;
  /** Total amount including all charges and discounts */
  totalAmount: Money;
}

/**
 * Information about the buyer associated with the cart.
 * Used for personalization and determining international pricing.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CartBuyerIdentity
 */
export interface CartBuyerIdentity {
  /** Email address of the buyer */
  email?: string;
  /** Phone number of the buyer */
  phone?: string;
  /** The customer account if the buyer is logged in */
  customer?: Customer;
  /** Two-letter country code (ISO 3166-1 alpha-2) */
  countryCode?: string;
}

/**
 * Customer account information.
 */
export interface Customer {
  /** Globally unique identifier for the customer */
  id: string;
}

/**
 * Delivery information for a group of cart lines.
 * Groups items by delivery address and provides available shipping options.
 */
export interface CartDeliveryGroup {
  /** Globally unique identifier for the delivery group */
  id: string;
  /** The delivery address for this group */
  deliveryAddress: MailingAddress;
  /** Available delivery/shipping options for this group */
  deliveryOptions: CartDeliveryOption[];
  /** The currently selected delivery option */
  selectedDeliveryOption?: CartDeliveryOption;
}

/**
 * A delivery method available for the cart.
 * Represents shipping options like standard, express, etc.
 */
export interface CartDeliveryOption {
  /** Unique identifier for the delivery method */
  handle: string;
  /** Display name (e.g., "Standard Shipping") */
  title: string;
  /** Additional details about the delivery method */
  description?: string;
  /** Estimated shipping cost */
  estimatedCost: Money;
  /** Carrier-specific code */
  code?: string;
  /** Delivery method type */
  type?: string;
}

/**
 * A discount code applied or available to apply to the cart.
 */
export interface CartDiscountCode {
  /** The discount code string */
  code: string;
  /** Whether the code is currently applicable to the cart */
  applicable: boolean;
}

/**
 * Physical mailing address.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/MailingAddress
 */
export interface MailingAddress {
  /** First line of the address (street address or PO Box) */
  address1?: string;
  /** Second line of the address (apartment, suite, unit) */
  address2?: string;
  /** City, district, village, or town */
  city?: string;
  /** Company or organization name */
  company?: string;
  /** Two-letter country code (ISO 3166-1 alpha-2) */
  countryCode?: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Phone number */
  phone?: string;
  /** Province/state code */
  provinceCode?: string;
  /** Zip or postal code */
  zip?: string;
}

/**
 * Delivery addresses available for the cart.
 */
export interface CartDelivery {
  /** List of selectable delivery addresses */
  addresses: CartDeliveryAddress[];
}

/**
 * A delivery address with selection state.
 */
export interface CartDeliveryAddress {
  /** The mailing address details */
  address: MailingAddress;
  /** Whether this address is currently selected for delivery */
  selected?: boolean;
}

/**
 * A delivery address of the buyer that is interacting with the cart.
 * This is a union type to support future address types.
 * Currently only CartDeliveryAddress is supported.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/unions/CartAddress
 */
export type CartAddress = CartDeliveryAddress;

/**
 * Payment instrument available for selection at checkout.
 * Output type from Storefront API.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CartPaymentInstrument
 */
export interface CartPaymentInstrument {
  externalReference: string;
}

/**
 * Payment information available for the cart.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CartPayment
 */
export interface CartPayment {
  instruments: CartPaymentInstrument[];
}

/**
 * Discount applied to a cart line or the entire cart.
 * Shows how much was discounted and which code/promotion applied it.
 */
export interface CartDiscountAllocation {
  /** Amount discounted */
  discountedAmount: Money;
  /** Discount code that applied this discount */
  code?: string;
  /** Name of the discount or promotion */
  title?: string;
}

/**
 * Gift card applied to the cart.
 * Shows the amount used and remaining balance.
 */
export interface AppliedGiftCard {
  /** Globally unique identifier for the gift card */
  id: string;
  /** Amount of the gift card used in this cart */
  amountUsed: Money;
  /** Remaining balance on the gift card */
  balance: Money;
  /** Last 4 characters of the gift card code */
  lastCharacters: string;
  /** Amount used in the presentment currency */
  presentmentAmountUsed: Money;
}

/**
 * Monetary value with currency.
 * Amount is a string to preserve decimal precision.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/MoneyV2
 */
export interface Money {
  /** Decimal amount as a string (e.g., "19.99") */
  amount: string;
  /** Three-letter currency code (ISO 4217) */
  currencyCode: string;
}

/**
 * Percentage-based discount value.
 */
export interface PricingPercentageValue {
  /** Percentage value (e.g., 15 for 15% off) */
  percentage: number;
}

/**
 * Discount value, either a fixed amount or percentage.
 */
export type DiscountValue = Money | PricingPercentageValue;

namespace CheckoutCompleteEvent {
  export interface OrderConfirmation {
    /** URL to the order status page */
    url?: string;
    /** The order that was created */
    order: Order;
    /** Human-readable order number */
    number?: string;
    /** Whether this is the customer's first order */
    isFirstOrder: boolean;
  }

  interface Order {
    /** Globally unique identifier for the order */
    id: string;
  }
}

/**
 * Event emitted when checkout is completed successfully.
 */
export interface CheckoutCompleteEvent {
  /** Order confirmation details */
  orderConfirmation: CheckoutCompleteEvent.OrderConfirmation;
  /** Final cart state at checkout completion */
  cart: Cart;
}

/**
 * Event emitted when checkout starts.
 */
export interface CheckoutStartEvent {
  /** Initial cart state when checkout started */
  cart: Cart;
}

/**
 * Error object returned in checkout event responses.
 * Used to communicate validation or processing errors back to checkout.
 */
export interface CheckoutResponseError {
  /**
   * Error code identifying the type of error.
   */
  code: string;
  /**
   * Human-readable error message.
   */
  message: string;
  /**
   * Optional field identifier for validation errors.
   * The field the error is related to.
   *
   * @see https://shopify.dev/docs/api/checkout-ui-extensions/latest/targets
   */
  fieldTarget?: string;
}

/**
 * Mailing address input for delivery.
 * Aligns with Storefront API MailingAddressInput.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/input-objects/MailingAddressInput
 */
export interface MailingAddressInput {
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
}

/**
 * Delivery address with selection state.
 * Used within CartDeliveryInput.
 */
export interface CartDeliveryAddressInput {
  /**
   * The delivery address details.
   */
  address: MailingAddressInput;
  /**
   * Whether this address is selected as the active delivery address.
   * Optional - use to pre-select an address from multiple options.
   */
  selected?: boolean;
}

/**
 * Delivery-related fields for the cart.
 * Aligns with Storefront API CartDeliveryInput.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/input-objects/CartDeliveryInput
 */
export interface CartDeliveryInput {
  /**
   * Array of selectable addresses presented to the buyer.
   */
  addresses?: CartDeliveryAddressInput[];
}

/**
 * The customer associated with the cart.
 * Aligns with Storefront API CartBuyerIdentityInput.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/input-objects/CartBuyerIdentityInput
 */
export interface CartBuyerIdentityInput {
  /** Email address of the buyer */
  email?: string;
  /** Phone number of the buyer */
  phone?: string;
  /** Two-letter country code for the buyer's location */
  countryCode?: string;
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
  delivery?: CartDeliveryInput;
  /**
   * The customer associated with the cart.
   * Optional - use to update buyer identity information.
   */
  buyerIdentity?: CartBuyerIdentityInput;
  /**
   * Case-insensitive discount codes.
   * Optional - use to apply discount codes to the cart.
   */
  discountCodes?: string[];
  /**
   * Payment instruments for the cart.
   * Optional - use to update payment methods.
   */
  paymentInstruments?: CartPaymentInstrumentInput[];
}

/**
 * Event emitted when checkout starts an address change flow.
 *
 * This event is only emitted when native address selection is enabled
 * for the authenticated app.
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
   * The current cart state when the event was emitted.
   * This provides context about the cart contents, buyer identity, and current delivery options.
   */
  cart: Cart;
}

/**
 * Response payload for CheckoutAddressChangeStart event.
 * Use with CheckoutEventProvider.respondToEvent() or useShopifyEvent().respondWith()
 *
 * Note: This response is only used when native address selection is enabled
 * for the authenticated app.
 *
 * Validation requirements:
 * - cart.delivery.addresses must contain at least one address
 * - Each address must include a countryCode
 * - countryCode must be exactly 2 characters (ISO 3166-1 alpha-2 format)
 */
export interface CheckoutAddressChangeStartResponse {
  /**
   * Updated cart input with the delivery address to set.
   */
  cart?: CartInput;
  /**
   * Optional array of errors if the address selection failed.
   */
  errors?: CheckoutResponseError[];
}

/**
 * Card brand identifiers for payment instruments.
 * Matches Storefront API card brand values.
 */
export type CardBrand =
  | 'VISA'
  | 'MASTERCARD'
  | 'AMERICAN_EXPRESS'
  | 'DISCOVER'
  | 'DINERS_CLUB'
  | 'JCB'
  | 'MAESTRO'
  | 'UNKNOWN';

/**
 * Expiry date for a payment instrument.
 */
export interface ExpiryInput {
  /** Month (1-12) */
  month: number;
  /** Four-digit year */
  year: number;
}

/**
 * Display fields for a payment instrument shown to the buyer.
 */
export interface CartPaymentInstrumentDisplayInput {
  /** Last 4 digits of the card number */
  last4: string;
  /** Card brand (e.g., VISA, MASTERCARD) */
  brand: CardBrand;
  /** Name of the cardholder */
  cardHolderName: string;
  /** Card expiry date */
  expiry: ExpiryInput;
}

/**
 * Input type for creating/updating payment instruments, aligned with Storefront API.
 * Display fields are grouped separately from the billing address.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/input-objects/CartPaymentInstrumentInput
 */
export interface CartPaymentInstrumentInput {
  /** Unique identifier for this payment instrument */
  externalReference: string;
  /** Display information for the payment instrument */
  display: CartPaymentInstrumentDisplayInput;
  /** Billing address for the payment instrument */
  billingAddress: MailingAddressInput;
}

/**
 * Event emitted when the buyer intends to change their payment method.
 */
export interface CheckoutPaymentMethodChangeStart {
  /** Unique identifier for this event instance */
  id: string;
  /** Type of payment change event */
  type: 'paymentMethodChangeStart';
  /** Cart state when the event was emitted */
  cart: Cart;
}
