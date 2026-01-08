# Implementation Plan: Issue #171 — `checkout.primaryActionChange` (React Native)

Date: 2026-01-08

## Goal

Expose the checkout JSON-RPC notification `checkout.primaryActionChange` to React Native so an app can implement a “Bring Your Own Pay Button” (BYOPB) experience over an **inline** checkout webview.

Constraint for this implementation: **do not add a native `submit()` command yet**. The sample BYOPB button can rely on `reload()` for now.

## Event spec (from issue)

Method: `checkout.primaryActionChange`

Payload:

```json
{
  "jsonrpc": "2.0",
  "method": "checkout.primaryActionChange",
  "params": {
    "state": "enabled" | "disabled" | "loading",
    "action": "pay" | "review",
    "cart": { "id": "...", "...": "..." }
  }
}
```

## Deliverables

- iOS + Android: bridge the native event into the inline `ShopifyCheckout` component as a new prop callback: `onPrimaryActionChange`.
- JS/TS: add types for the event payload and wire the prop in `ShopifyCheckout`.
- Sample app: demonstrate a native overlay button that updates enabled/loading/label based on the event and calls `reload()` when pressed.
- Tests: cover the new JS prop wiring and native bridge emission (platform-appropriate unit tests).

## Implementation steps

### 1) Confirm native SDK availability + update dependencies

- iOS:
  - There is no released version yet, so use a git ref temporarily.
  - This repo’s sample app already overrides the Swift SDK via `sample/ios/Podfile` using `:path` (recommended). Pin your local clone to a commit SHA for reproducibility.
    - Current branch: `Shopify/checkout-sheet-kit-swift` `prototype/primary-action-change-event`
    - Current commit SHA (as of 2026-01-08): `3a17f22c9d26d15dc13c3b25765f067369ecb14a`
    - Suggested workflow:
      1. Clone `checkout-sheet-kit-swift` locally and checkout the SHA above.
      2. Install sample pods using the existing env var:
         - `cd sample/ios && SWIFT_SDK_PATH=~/src/github.com/Shopify/checkout-sheet-kit-swift pod install`
  - Alternative (if you can’t/won’t use a local clone): in the consuming app `Podfile`, point to the git repo and pin to a commit SHA for both pods:
    - `pod "ShopifyCheckoutSheetKit", :git => "...", :commit => "..."` and
    - `pod "ShopifyCheckoutSheetKit/AcceleratedCheckouts", :git => "...", :commit => "..."`
  - Note: `modules/@shopify/checkout-sheet-kit/RNShopifyCheckoutSheetKit.podspec` pins `ShopifyCheckoutSheetKit` to a released version; the sample’s `Podfile` overrides this, but external consumers will not unless they also override.
- Android:
  - Work is currently in progress and there is no released artifact to consume from a git branch.
  - To use WIP Android changes before release, one of the following needs to exist:
    - A locally-published Maven artifact (`publishToMavenLocal`) and then set `SHOPIFY_CHECKOUT_SDK_VERSION` accordingly (this repo already includes `mavenLocal()` in `modules/@shopify/checkout-sheet-kit/android/build.gradle`), or
    - A remote Maven repo where the WIP artifact is published (snapshots) and then configure Gradle to resolve it.

Acceptance check:
- Both platforms compile against the new event APIs (no missing symbols).

### 2) iOS (inline checkout) — add a new bubbling event prop

Files:
- `modules/@shopify/checkout-sheet-kit/ios/RCTCheckoutWebView.swift`
- `modules/@shopify/checkout-sheet-kit/ios/ShopifyCheckoutSheetKit.mm`
- `modules/@shopify/checkout-sheet-kit/ios/ShopifyCheckoutSheetKit+EventSerialization.swift`

Steps:
- Add `@objc var onPrimaryActionChange: RCTBubblingEventBlock?` to `RCTCheckoutWebView`.
- Implement `checkoutDidChangePrimaryAction(event: CheckoutPrimaryActionChangeEvent)` in the `CheckoutDelegate` extension and emit a payload:
  - `method`
  - `state`
  - `action`
  - `cart` (encoded via the existing encoder helper)
- Export the prop in `ShopifyCheckoutSheetKit.mm` as `RCT_EXPORT_VIEW_PROPERTY(onPrimaryActionChange, RCTBubblingEventBlock)`.
- Add a serializer helper (or inline) in `ShopifyCheckoutSheetKit+EventSerialization.swift` for a consistent payload shape.

Acceptance check:
- `ShopifyCheckout` receives `onPrimaryActionChange` callbacks on iOS with the expected shape.

### 3) Android (inline checkout) — add a new direct event + dispatch it

Files:
- `modules/@shopify/checkout-sheet-kit/android/src/main/java/com/shopify/reactnative/checkoutsheetkit/CheckoutEventType.java`
- `modules/@shopify/checkout-sheet-kit/android/src/main/java/com/shopify/reactnative/checkoutsheetkit/RCTCheckoutWebView.java`

Steps:
- Add a new enum entry to `CheckoutEventType`, e.g. `ON_PRIMARY_ACTION_CHANGE("onPrimaryActionChange")`.
- In `RCTCheckoutWebView.InlineCheckoutEventProcessor`, override the SDK callback for the event (name depends on SDK, e.g. `onPrimaryActionChange(...)`) and dispatch a `WritableMap` with:
  - `method`
  - `state`
  - `action`
  - `cart`
- Ensure `RCTCheckoutWebViewManager.getExportedCustomDirectEventTypeConstants()` exposes the new event automatically via the enum.

Acceptance check:
- `ShopifyCheckout` receives `onPrimaryActionChange` callbacks on Android with the expected shape.

### 4) JS/TS — types + `ShopifyCheckout` prop plumbing

Files:
- `modules/@shopify/checkout-sheet-kit/src/events.d.ts`
- `modules/@shopify/checkout-sheet-kit/src/components/ShopifyCheckout.tsx`
- (optional re-export surface) `modules/@shopify/checkout-sheet-kit/src/index.d.ts` / `modules/@shopify/checkout-sheet-kit/src/index.ts`

Steps:
- Add a new event interface in `events.d.ts`, for example:
  - `method: 'checkout.primaryActionChange'`
  - `state: 'enabled' | 'disabled' | 'loading'`
  - `action: 'pay' | 'review'`
  - `cart: Cart`
- Add `onPrimaryActionChange?: (event: CheckoutPrimaryActionChangeEvent) => void` to `ShopifyCheckoutProps`.
- Add the corresponding native prop in `NativeShopifyCheckoutWebViewProps` and wire it into the rendered `RCTCheckoutWebView` with the same “guard nativeEvent exists” pattern used by other callbacks.
- Optional (parity): also expose it through the sheet `addEventListener` API. Only do this if consumers need the event outside inline checkout.

Acceptance check:
- TypeScript builds; `ShopifyCheckout` callers can type the event and handle it without `any`.

### 5) Sample app — BYOPB overlay (reload-based)

Files:
- Prefer editing an existing screen: `sample/src/screens/BuyNow/CheckoutScreen.tsx`

Steps:
- Add component state for the primary action:
  - start in `{state: 'disabled', action: 'pay'}` until the first event arrives
- Render an absolutely-positioned bottom button over the checkout view.
- Use `onPrimaryActionChange` to:
  - disable/enable the button
  - show a loading indicator if `state === 'loading'`
  - set label based on `action` (e.g. “Pay now” vs “Review order”)
- On press: call `ref.current?.reload()` (explicitly *not* submitting yet).

Acceptance check:
- The sample shows the native button responding to checkout state changes.

### 6) Tests

JS tests:
- Update `modules/@shopify/checkout-sheet-kit/tests/ShopifyCheckout.test.tsx`:
  - verify `onPrimaryActionChange` is called with `nativeEvent` payload
  - verify it’s not called when `nativeEvent` is missing

iOS tests (sample native tests):
- Update `sample/ios/ReactNativeTests/RCTCheckoutWebViewTests.swift`:
  - add a test asserting `checkoutDidChangePrimaryAction` emits `onPrimaryActionChange` with `state`, `action`, and `cart`.

Android unit tests:
- Update an existing test to assert the new event is exported, e.g. via `RCTCheckoutWebViewManagerTest` (event registration constants include `onPrimaryActionChange`).
- If you also add the event to the sheet processor, add a `SheetCheckoutEventProcessorTest` case asserting the emitted JSON includes `state`/`action`.

## Definition of done

- `ShopifyCheckout` supports a new `onPrimaryActionChange` prop on both iOS and Android.
- Payload matches the agreed TS type shape (`method/state/action/cart`).
- Sample app demonstrates the BYOPB UI and uses `reload()` on tap.
- Tests pass on JS, and native tests are updated for the new event.
