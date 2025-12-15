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
  addresses: CartSelectableAddress[];
}

/**
 * A selectable delivery address with selection and reuse settings.
 */
export interface CartSelectableAddress {
  /** The mailing address details */
  address: MailingAddress;
  /** Whether this address is currently selected for delivery */
  selected?: boolean;
  /** Whether this address should only be used for this checkout */
  oneTimeUse?: boolean;
}

/**
 * A delivery address of the buyer that is interacting with the cart.
 * This is a union type to support future address types.
 * Currently only CartSelectableAddress is supported.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/unions/CartAddress
 */
export type CartAddress = CartSelectableAddress;

/**
 * Remote token payment credential for delegated payment processing.
 */
export interface RemoteTokenPaymentCredential {
  /** The payment token */
  token: string;
  /** The type of token (e.g., "card") */
  tokenType: string;
  /** The token handler (e.g., "delegated") */
  tokenHandler: string;
}

/**
 * Cart credential containing payment authentication data.
 */
export interface CartCredential {
  /** Remote token payment credential for tokenized payments */
  remoteTokenPaymentCredential?: RemoteTokenPaymentCredential;
}

/**
 * Payment instrument available for selection at checkout.
 * Represents a credit card or other payment method with its details.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CartPaymentInstrument
 */
export interface CartPaymentInstrument {
  /** Type discriminator for the payment instrument */
  __typename?: string;
  /** Unique identifier for this payment instrument */
  externalReferenceId: string;
  /** Payment credentials for this instrument */
  credentials?: CartCredential[];
  /** Name of the cardholder */
  cardHolderName?: string;
  /** Last digits of the card number */
  lastDigits?: string;
  /** Expiry month (1-12) */
  month?: number;
  /** Expiry year (4-digit) */
  year?: number;
  /** Card brand (e.g., VISA, MASTERCARD) */
  brand?: CardBrand;
  /** Billing address for the payment instrument */
  billingAddress?: MailingAddress;
}

/**
 * A payment method containing payment instruments.
 */
export interface CartPaymentMethod {
  /** Type discriminator (e.g., "CreditCardPaymentMethod") */
  __typename?: string;
  /** Payment instruments for this method */
  instruments: CartPaymentInstrument[];
}

/**
 * Payment information available for the cart.
 *
 * @see https://shopify.dev/docs/api/storefront/latest/objects/CartPayment
 */
export interface CartPayment {
  /** Payment methods available for the cart */
  methods: CartPaymentMethod[];
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
  /**
   * The event type identifier
   */
  method: 'checkout.complete';
  /** Order confirmation details */
  orderConfirmation: CheckoutCompleteEvent.OrderConfirmation;
  /** Final cart state at checkout completion */
  cart: Cart;
}

/**
 * Event emitted when checkout starts.
 */
export interface CheckoutStartEvent {
  /**
   * The event type identifier
   */
  method: 'checkout.start';
  /** Initial cart state when checkout started */
  cart: Cart;
  /** 
   * Locale of the checkout 
   **/
  locale: string;
}

/**
 * Error object returned in checkout event responses.
 * Used to communicate errors back to checkout.
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
   * Optional field identifier for field-specific errors.
   *
   * @see https://shopify.dev/docs/api/checkout-ui-extensions/latest/targets
   */
  fieldTarget?: string;
}

/**
 * Event emitted when checkout starts an address change flow.
 *
 * This event is only emitted when native address selection is enabled
 * for the authenticated app.
 */
export interface CheckoutAddressChangeStartEvent {
  /**
   * Unique identifier for this event instance.
   * Use this ID with the ShopifyCheckoutEventProvider to respond to the event.
   */
  id: string;

  /**
   * The event type identifier
   */
  method: 'checkout.addressChangeStart';

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
 * Response payload for CheckoutAddressChangeStartEvent event.
 * Use with ShopifyCheckoutEventProvider.respondToEvent() or useShopifyEvent().respondWith()
 *
 * Note: This response is only used when native address selection is enabled
 * for the authenticated app.
 */
export interface CheckoutAddressChangeStartResponsePayload {
  /**
   * Updated cart with the delivery addresses to set.
   */
  cart?: Cart;
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
 * Event emitted when the buyer intends to change their payment method.
 */
export interface CheckoutPaymentMethodChangeStartEvent {
  /** Unique identifier for this event instance */
  id: string;
  /** Type of payment change event */
  method: 'checkout.paymentMethodChangeStart';
  /** Cart state when the event was emitted */
  cart: Cart;
}

/**
 * Response payload for CheckoutPaymentMethodChangeStartEvent event.
 * Use with CheckoutEventProvider.respondToEvent() or useShopifyEvent().respondWith()
 */
export interface CheckoutPaymentMethodChangeStartResponsePayload {
  /**
   * Updated cart with the payment methods to set.
   */
  cart?: Cart;
  /**
   * Optional array of errors if the payment method selection failed.
   */
  errors?: CheckoutResponseError[];
}

/**
 * Event emitted when the buyer attempts to submit the checkout.
 *
 * This event is only emitted when native payment delegation is configured
 * for the authenticated app.
 */
export interface CheckoutSubmitStartEvent {
  /**
   * Unique identifier for this event instance.
   * Use this ID with the ShopifyCheckoutEventProvider to respond to the event.
   */
  id: string;

  /**
   * The event type identifier
   */
  method: 'checkout.submitStart';

  /**
   * The current cart state when the event was emitted.
   */
  cart: Cart;

  /**
   * The checkout session information.
   */
  sessionId: string;
}

/**
 * Response payload for CheckoutSubmitStartEvent event.
 * Use with ShopifyCheckoutEventProvider.respondToEvent() or useShopifyEvent().respondWith()
 *
 * Payment credentials should be provided via cart.payment.methods[].instruments[].credentials
 *
 * Note: This response is only used when native payment delegation is enabled
 * for the authenticated app.
 */
export interface CheckoutSubmitStartResponsePayload {
  /**
   * Updated cart with payment credentials.
   */
  cart?: Cart;
  /**
   * Optional array of errors if the submission failed.
   */
  errors?: CheckoutResponseError[];
}
