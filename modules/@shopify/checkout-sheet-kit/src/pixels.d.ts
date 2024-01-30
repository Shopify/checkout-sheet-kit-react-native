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

export type PixelEvent = CustomEvent | StandardEvent;

/**
 * A Standard Web Pixels event.
 *
 * See https://shopify.dev/docs/api/web-pixels-api/standard-events
 */
export interface StandardEvent {
  /* A snapshot of various read-only properties of the browser at the time of the event */
  context?: Context;
  /* Event data */
  data?: StandardEventData;
  /* The ID of the event */
  id?: string;
  /* The name of the event */
  name?: string;
  /* A timestamp of when the event occurred (ISO_8601) */
  timestamp?: string;
  /* Event type */
  type?: 'STANDARD';
}

export interface StandardEventData {
  checkout?: Checkout;
}

/**
 * A Custom Web Pixels event.
 *
 * See https://shopify.dev/docs/api/web-pixels-api/emitting-data#publishing-custom-events
 */
export interface CustomEvent {
  /* A snapshot of various read-only properties of the browser at the time of the event */
  context?: Context;
  /**
   * A free-form object representing data specific to a custom event provided by
   * the custom event publisher.
   */
  customData?: any;
  /* The ID of the event */
  id?: string;
  /* The name of the event */
  name?: string;
  /* The timestamp of when the event occurred (ISO_8601) */
  timestamp?: string;
  /* Event type */
  type?: 'CUSTOM';
}

interface Context {
  /* Snapshot of a subset of properties of the `document` object in the top */
  /* frame of the browser */
  document?: WebPixelsDocument;
  /* Snapshot of a subset of properties of the `navigator` object in the top */
  /* frame of the browser */
  navigator?: WebPixelsNavigator;
  /* Snapshot of a subset of properties of the `window` object in the top frame */
  /* of the browser */
  window?: WebPixelsWindow;
}

/**
 * A snapshot of a subset of properties of the `document` object in the top frame of the browser.
 *
 * Per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document)
 * */
interface WebPixelsDocument {
  /* The character set being used by the document */
  characterSet?: string;
  /* Returns the URI of the current document */
  location?: Location;
  /* Returns the URI of the page that linked to this page */
  referrer?: string;
  /* Returns the title of the current document */
  title?: string;
}

/**
 * The location, or current URL, of the window object.
 *
 * Per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window)
 */
interface Location {
  /* String containing a `'#'` followed by the fragment identifier of the URL */
  hash?: string;
  /* String containing the host, that is the hostname, a `':'`, and the port of the URL */
  host?: string;
  /* String containing the domain of the URL */
  hostname?: string;
  /* String containing the entire URL */
  href?: string;
  /* String containing the canonical form of the origin of the specific location */
  origin?: string;
  /* String containing an initial `'/'` followed by the path of the URL, not including the query string or fragment */
  pathname?: string;
  /* String containing the port number of the URL */
  port?: string;
  /* String containing the protocol scheme of the URL, including the final `':'` */
  locationProtocol?: string;
  /* String containing a `'?'` followed by the parameters or "querystring" of */
  /* the URL */
  search?: string;
}

/**
 * A snapshot of a subset of properties based on the `navigator` object
 * in the top frame of the browser.
 *
 * Per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator)
 */
interface WebPixelsNavigator {
  /* Returns `false` if setting a cookie will be ignored and true otherwise */
  cookieEnabled?: boolean;
  /* Returns a string representing the preferred language of the user, usually */
  /* the language of the browser UI. The `null` value is returned when this */
  /* is unknown */
  language?: string;
  /* Returns an array of strings representing the languages known to the user, */
  /* by order of preference */
  languages?: string[];
  /* Returns the user agent string for the current browser */
  userAgent?: string;
}

/**
 * A snapshot of a subset of properties of the `window` object in the top frame  of the browser.
 *
 * Per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window)
 */
interface WebPixelsWindow {
  /* The height of the content area of the browser window including, if */
  /* rendered, the horizontal scrollbar */
  innerHeight?: number;
  /* The width of the content area of the browser window including, if rendered, */
  /* the vertical scrollbar */
  innerWidth?: number;
  /* Location, or current URL, of the window object */
  location?: Location;
  /* The global object's origin, serialized as a string */
  origin?: string;
  /* The height of the outside of the browser window */
  outerHeight?: number;
  /* The width of the outside of the browser window */
  outerWidth?: number;
  /* Alias for window.scrollX */
  pageXOffset?: number;
  /* Alias for window.scrollY */
  pageYOffset?: number;
  /* Interface representing a screen, usually the one on which the current window is being rendered */
  screen?: Screen;
  /* Horizontal distance from the left border of the user's browser viewport to */
  /* the left side of the screen */
  screenX?: number;
  /* Vertical distance from the top border of the user's browser viewport to the */
  /* top side of the screen */
  screenY?: number;
  /* Number of pixels that the document has already been scrolled horizontally */
  scrollX?: number;
  /* Number of pixels that the document has already been scrolled vertically */
  scrollY?: number;
}

/* Per [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen), the */
/* interface representing a screen, usually the one on which the current */
/* window is being rendered */
//
/* The interface representing a screen, usually the one on which the current */
/* window is being rendered */
interface Screen {
  /* The height of the screen */
  height?: number;
  /* The width of the screen */
  width?: number;
}

/* A monetary value with currency allocated to the transaction method. */
interface MoneyV2 {
  /* A decimal money amount. */
  amount?: number;
  /* Three-letter code that represents the currency, for example, USD. */
  /* Supported codes include standard ISO 4217 codes, legacy codes, and non- */
  /* standard codes. */
  currencyCode?: string;
}

/* Information about the merchandise in the cart. */
interface CartLine {
  /* The cost of the merchandise that the customer will pay for at checkout. The */
  /* costs are subject to change and changes will be reflected at checkout. */
  cost?: CartLineCost;
  /* The merchandise that the buyer intends to purchase. */
  merchandise?: ProductVariant;
  /* The quantity of the merchandise that the customer intends to purchase. */
  quantity?: number;
}

/* The cost of the merchandise line that the customer will pay at checkout. */
interface CartLineCost {
  /* The total cost of the merchandise line. */
  totalAmount?: MoneyV2;
}

/**
 * A product variant represents a different version of a product, such as
 * differing sizes or differing colors.
 * */
interface ProductVariant {
  /* A globally unique identifier. */
  id?: string;
  /* Image associated with the product variant. This field falls back to the */
  /* product image if no image is available. */
  image?: Image;
  /* The product variant’s price. */
  price?: MoneyV2;
  /* The product object that the product variant belongs to. */
  product?: Product;
  /* The SKU (stock keeping unit) associated with the variant. */
  sku?: string;
  /* The product variant’s title. */
  title?: string;
  /* The product variant’s untranslated title. */
  untranslatedTitle?: string;
}

/* An image resource. */
interface Image {
  /* The location of the image as a URL. */
  src?: string;
}

/* The product object that the product variant belongs to. */
interface Product {
  /* The ID of the product. */
  id?: string;
  /* The product’s title. */
  title?: string;
  /* The [product type](https://help.shopify.com/en/manual/products/details/product-type) */
  type?: string;
  /* The product’s untranslated title. */
  untranslatedTitle?: string;
  /* The relative URL of the product. */
  url?: string;
  /* The product’s vendor name. */
  vendor?: string;
}

/* A container for all the information required to add items to checkout and pay. */
interface Checkout {
  /* A list of attributes accumulated throughout the checkout process. */
  attributes?: Attribute[];
  /* The billing address to where the order will be charged. */
  billingAddress?: MailingAddress;
  /**
   * The three-letter code that represents the currency, for example, USD.
   * Supported codes include standard ISO 4217 codes, legacy codes, and non-
   * standard codes.
   */
  currencyCode?: string;
  /* A list of discount applications. */
  discountApplications?: DiscountApplication[];
  /* The email attached to this checkout. */
  email?: string;
  /* A list of line item objects, each one containing information about an item */
  /* in the checkout. */
  lineItems?: CheckoutLineItem[];
  /* The resulting order from a paid checkout. */
  order?: Order;
  /* A unique phone number for the customer. Formatted using E.164 standard. For */
  /* example, *+16135551111*. */
  phone?: string;
  /* The shipping address to where the line items will be shipped. */
  shippingAddress?: MailingAddress;
  /* Once a shipping rate is selected by the customer it is transitioned to a */
  /* `shipping_line` object. */
  shippingLine?: ShippingRate;
  /* The price at checkout before duties, shipping, and taxes. */
  subtotalPrice?: MoneyV2;
  /* A unique identifier for a particular checkout. */
  token?: string;
  /* The sum of all the prices of all the items in the checkout, including */
  /* duties, taxes, and discounts. */
  totalPrice?: MoneyV2;
  /* The sum of all the taxes applied to the line items and shipping lines in */
  /* the checkout. */
  totalTax?: MoneyV2;
  /* A list of transactions associated with a checkout or order. */
  transactions?: Transaction[];
}

/* Custom attributes left by the customer to the merchant, either in their cart */
/* or during checkout. */
interface Attribute {
  /* The key for the attribute. */
  key?: string;
  /* The value for the attribute. */
  value?: string;
}

/* A mailing address for customers and shipping. */
interface MailingAddress {
  /* The first line of the address. This is usually the street address or a P.O. */
  /* Box number. */
  address1?: string;
  /* The second line of the address. This is usually an apartment, suite, or */
  /* unit number. */
  address2?: string;
  /* The name of the city, district, village, or town. */
  city?: string;
  /* The name of the country. */
  country?: string;
  /* The two-letter code that represents the country, for example, US. */
  /* The country codes generally follows ISO 3166-1 alpha-2 guidelines. */
  countryCode?: string;
  /* The customer’s first name. */
  firstName?: string;
  /* The customer’s last name. */
  lastName?: string;
  /* The phone number for this mailing address as entered by the customer. */
  phone?: string;
  /* The region of the address, such as the province, state, or district. */
  province?: string;
  /* The two-letter code for the region. */
  /* For example, ON. */
  provinceCode?: string;
  /* The ZIP or postal code of the address. */
  zip?: string;
}

/* The information about the intent of the discount. */
interface DiscountApplication {
  /* The method by which the discount's value is applied to its entitled items. */
  //
  /* - `ACROSS`: The value is spread across all entitled lines. */
  /* - `EACH`: The value is applied onto every entitled line. */
  allocationMethod?: string;
  /* How the discount amount is distributed on the discounted lines. */
  //
  /* - `ALL`: The discount is allocated onto all the lines. */
  /* - `ENTITLED`: The discount is allocated onto only the lines that it's */
  /* entitled for. */
  /* - `EXPLICIT`: The discount is allocated onto explicitly chosen lines. */
  targetSelection?: string;
  /* The type of line (i.e. line item or shipping line) on an order that the */
  /* discount is applicable towards. */
  //
  /* - `LINE_ITEM`: The discount applies onto line items. */
  /* - `SHIPPING_LINE`: The discount applies onto shipping lines. */
  targetType?: string;
  /* The customer-facing name of the discount. If the type of discount is */
  /* a `DISCOUNT_CODE`, this `title` attribute represents the code of the */
  /* discount. */
  title?: string;
  /* The type of the discount. */
  //
  /* - `AUTOMATIC`: A discount automatically at checkout or in the cart without */
  /* the need for a code. */
  /* - `DISCOUNT_CODE`: A discount applied onto checkouts through the use of */
  /* a code. */
  /* - `MANUAL`: A discount that is applied to an order by a merchant or store */
  /* owner manually, rather than being automatically applied by the system or */
  /* through a script. */
  /* - `SCRIPT`: A discount applied to a customer's order using a script */
  type?: string;
  /* The value of the discount. Fixed discounts return a `Money` Object, while */
  /* Percentage discounts return a `PricingPercentageValue` object. */
  value?: Value;
}

/* A value given to a customer when a discount is applied to an order. The */
/* application of a discount with this value gives the customer the specified */
/* percentage off a specified item. */
interface Value {
  /* The decimal money amount. */
  amount?: number;
  /* The three-letter code that represents the currency, for example, USD. */
  /* Supported codes include standard ISO 4217 codes, legacy codes, and non- */
  /* standard codes. */
  currencyCode?: string;
  /* The percentage value of the object. */
  percentage?: number;
}

/* A single line item in the checkout, grouped by variant and attributes. */
interface CheckoutLineItem {
  /* The discounts that have been applied to the checkout line item by a */
  /* discount application. */
  discountAllocations?: DiscountAllocation[];
  /* A globally unique identifier. */
  id?: string;
  /* The quantity of the line item. */
  quantity?: number;
  /* The title of the line item. Defaults to the product's title. */
  title?: string;
  /* Product variant of the line item. */
  variant?: ProductVariant;
}

/* The discount that has been applied to the checkout line item. */
interface DiscountAllocation {
  /* The monetary value with currency allocated to the discount. */
  amount?: MoneyV2;
  /* The information about the intent of the discount. */
  discountApplication?: DiscountApplication;
}

/**
 * An order is a customer’s completed request to purchase one or more products
 * from a shop. An order is created when a customer completes the checkout
 * process.
 */
interface Order {
  /* The ID of the order. */
  id?: string;
}

/* A shipping rate to be applied to a checkout. */
interface ShippingRate {
  /* Price of this shipping rate. */
  price?: MoneyV2;
}

/* A transaction associated with a checkout or order. */
interface Transaction {
  /* The monetary value with currency allocated to the transaction method. */
  amount?: MoneyV2;
  /* The name of the payment provider used for the transaction. */
  gateway?: string;
}

/**
 * A value given to a customer when a discount is applied to an order. The
 * application of a discount with this value gives the customer the specified
 * percentage off a specified item.
 */
interface PricingPercentageValue {
  /* The percentage value of the object. */
  percentage?: number;
}
