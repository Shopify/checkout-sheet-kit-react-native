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

import Foundation
@testable import RNShopifyCheckoutSheetKit
@testable import ShopifyCheckoutSheetKit
import XCTest

class RCTCheckoutWebViewTests: XCTestCase {
    private var checkoutWebView: RCTCheckoutWebViewMock!

    override func setUp() {
        super.setUp()
        checkoutWebView = RCTCheckoutWebViewMock()
    }

    override func tearDown() {
        checkoutWebView = nil
        super.tearDown()
    }

    // MARK: - URL Validation

    func test_setup_whenUrlMissing_doesNotCreateCheckout() {
        checkoutWebView.checkoutUrl = nil
        checkoutWebView.auth = "valid-token"

        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 0)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    func test_setup_whenUrlEmpty_doesNotCreateCheckout() {
        checkoutWebView.checkoutUrl = ""
        checkoutWebView.auth = "valid-token"

        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 0)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    // MARK: - Checkout Creation Without Auth Token

    func test_setup_whenAuthMissing_createsCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = nil

        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    // MARK: - Checkout Creation With Auth Token

    func test_setup_whenUrlAndAuthProvided_createsCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"

        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    func test_setup_whenConfigurationUnchanged_doesNotRecreateCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)

        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    // MARK: - URL Changes

    func test_setup_whenUrlChanges_recreatesCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout1"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)

        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout2"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 2)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 1)
    }

    func test_setup_whenUrlBecomesEmpty_removesCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"

        checkoutWebView.flushScheduledSetup()
        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)

        checkoutWebView.checkoutUrl = ""
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 1)
    }

    // MARK: - App Auth Token Updates

    func test_setup_whenAuthTokenChanges_recreatesCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "token1"

        checkoutWebView.flushScheduledSetup()

        checkoutWebView.auth = "token2"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 2)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 1)
    }

    func test_setup_whenAuthTokenRemoved_recreatesCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)

        checkoutWebView.auth = nil
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 2)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 1)
    }

    func test_setup_whenAuthTokenBecomesAvailable_recreatesCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = nil
        checkoutWebView.flushScheduledSetup()

        checkoutWebView.auth = "new-token"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 2)
    }

    // MARK: - Concurrent Configuration Updates

    func test_setup_whenUrlAndAuthChangeTogether_recreatesCheckoutOnce() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout1"
        checkoutWebView.auth = "token1"
        checkoutWebView.flushScheduledSetup()

        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout2"
        checkoutWebView.auth = "token2"
        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 2)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 1)
    }

    func test_reload_whenCheckoutExists_recreatesCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        checkoutWebView.reload()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 2)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 1)
    }

    func test_respondToEvent_whenAddressStartResponded_doesNotRecreateCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        let request = CheckoutAddressChangeStartEvent.testInstance(
            id: "event-1",
            addressType: "shipping",
            cart: createTestCart()
        )
        checkoutWebView.checkoutDidStartAddressChange(event: request)

        checkoutWebView.respondToEvent(eventId: "event-1", responseData: "{}")

        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    // MARK: - Event Emission

    func test_checkoutDidComplete_whenDelegateCalled_emitsOnCompleteEvent() {
        let expectation = expectation(description: "onComplete event emitted")
        var receivedPayload: [AnyHashable: Any]?

        checkoutWebView.onComplete = { payload in
            receivedPayload = payload
            expectation.fulfill()
        }

        let event = createEmptyCheckoutCompleteEvent(id: "order-123")

        checkoutWebView.checkoutDidComplete(event: event)

        wait(for: [expectation], timeout: 0.1)

        let orderConfirmation = receivedPayload?["orderConfirmation"] as? [String: Any]
        let order = orderConfirmation?["order"] as? [String: Any]
        XCTAssertEqual(order?["id"] as? String, "order-123")
    }

    func test_checkoutDidStartAddressChange_whenDelegateCalled_emitsOnAddressChangeStartEvent() {
        let expectation = expectation(description: "onAddressChangeStart event emitted")
        var receivedPayload: [AnyHashable: Any]?

        checkoutWebView.onAddressChangeStart = { payload in
            receivedPayload = payload
            expectation.fulfill()
        }

        let request = CheckoutAddressChangeStartEvent.testInstance(
            id: "address-event-123",
            addressType: "shipping",
            cart: createTestCart(
                id: "gid://shopify/Cart/address-cart-123",
                subtotalAmount: "25.00",
                totalAmount: "30.00"
            )
        )

        checkoutWebView.checkoutDidStartAddressChange(event: request)

        wait(for: [expectation], timeout: 0.1)

        XCTAssertEqual(receivedPayload?["id"] as? String, "address-event-123")
        XCTAssertEqual(receivedPayload?["method"] as? String, "checkout.addressChangeStart")
        XCTAssertEqual(receivedPayload?["addressType"] as? String, "shipping")

        let cart = receivedPayload?["cart"] as? [String: Any]
        XCTAssertNotNil(cart, "Cart should be included in the emitted event")
        XCTAssertEqual(cart?["id"] as? String, "gid://shopify/Cart/address-cart-123")

        let cost = cart?["cost"] as? [String: Any]
        let subtotalAmount = cost?["subtotalAmount"] as? [String: Any]
        XCTAssertEqual(subtotalAmount?["amount"] as? String, "25.00")

        let totalAmount = cost?["totalAmount"] as? [String: Any]
        XCTAssertEqual(totalAmount?["amount"] as? String, "30.00")
    }

    func test_checkoutDidStartAddressChange_storesEventInRegistry() {
        checkoutWebView.onAddressChangeStart = { _ in }

        let request = CheckoutAddressChangeStartEvent.testInstance(
            id: "address-registry-test",
            addressType: "billing",
            cart: createTestCart()
        )

        checkoutWebView.checkoutDidStartAddressChange(event: request)

        XCTAssertTrue(checkoutWebView.hasStoredEvent(forKey: "address-registry-test"))

        let storedEvent = checkoutWebView.getStoredEvent(forKey: "address-registry-test")
        XCTAssertNotNil(storedEvent)
        XCTAssertEqual(storedEvent?.id, "address-registry-test")
    }

    func test_checkoutDidStart_whenDelegateCalled_emitsOnStartEvent() {
        let expectation = expectation(description: "onStart event emitted")
        var receivedPayload: [AnyHashable: Any]?

        checkoutWebView.onStart = { payload in
            receivedPayload = payload
            expectation.fulfill()
        }

        let cart = Cart(
            id: "gid://shopify/Cart/test-cart-123",
            lines: [],
            cost: CartCost(
                subtotalAmount: Money(amount: "100.00", currencyCode: "USD"),
                totalAmount: Money(amount: "100.00", currencyCode: "USD")
            ),
            buyerIdentity: CartBuyerIdentity(email: nil, phone: nil, customer: nil, countryCode: nil),
            deliveryGroups: [],
            discountCodes: [],
            appliedGiftCards: [],
            discountAllocations: [],
            delivery: CartDelivery(addresses: []),
            payment: .init(methods: [])
        )
        let event = CheckoutStartEvent(cart: cart, locale: "en-US")

        checkoutWebView.checkoutDidStart(event: event)

        wait(for: [expectation], timeout: 0.1)

        let receivedCart = receivedPayload?["cart"] as? [String: Any]
        XCTAssertEqual(receivedCart?["id"] as? String, "gid://shopify/Cart/test-cart-123")
    }

    // MARK: - Payment Method Change Events

    func test_checkoutDidStartPaymentMethodChange_whenDelegateCalled_emitsOnPaymentMethodChangeStartEvent() {
        let expectation = expectation(description: "onPaymentMethodChangeStart event emitted")
        var receivedPayload: [AnyHashable: Any]?

        checkoutWebView.onPaymentMethodChangeStart = { payload in
            receivedPayload = payload
            expectation.fulfill()
        }

        let request = CheckoutPaymentMethodChangeStartEvent.testInstance(
            id: "payment-event-456",
            cart: createTestCart(
                id: "gid://shopify/Cart/payment-cart-123",
                subtotalAmount: "50.00",
                totalAmount: "55.00"
            )
        )

        checkoutWebView.checkoutDidStartPaymentMethodChange(event: request)

        wait(for: [expectation], timeout: 0.1)

        XCTAssertEqual(receivedPayload?["id"] as? String, "payment-event-456")
        XCTAssertEqual(receivedPayload?["method"] as? String, "checkout.paymentMethodChangeStart")

        let cart = receivedPayload?["cart"] as? [String: Any]
        XCTAssertNotNil(cart, "Cart should be included in the emitted event")
        XCTAssertEqual(cart?["id"] as? String, "gid://shopify/Cart/payment-cart-123")

        let cost = cart?["cost"] as? [String: Any]
        let subtotalAmount = cost?["subtotalAmount"] as? [String: Any]
        XCTAssertEqual(subtotalAmount?["amount"] as? String, "50.00")

        let totalAmount = cost?["totalAmount"] as? [String: Any]
        XCTAssertEqual(totalAmount?["amount"] as? String, "55.00")
    }

    func test_checkoutDidStartPaymentMethodChange_storesEventInRegistry() {
        checkoutWebView.onPaymentMethodChangeStart = { _ in }

        let request = CheckoutPaymentMethodChangeStartEvent.testInstance(
            id: "payment-registry-test",
            cart: createTestCart()
        )

        checkoutWebView.checkoutDidStartPaymentMethodChange(event: request)

        XCTAssertTrue(checkoutWebView.hasStoredEvent(forKey: "payment-registry-test"))

        let storedEvent = checkoutWebView.getStoredEvent(forKey: "payment-registry-test")
        XCTAssertNotNil(storedEvent)
        XCTAssertEqual(storedEvent?.id, "payment-registry-test")
    }

    // MARK: - Submit Start Events

    func test_checkoutDidStartSubmit_whenDelegateCalled_emitsOnSubmitStartEvent() {
        let expectation = expectation(description: "onSubmitStart event emitted")
        var receivedPayload: [AnyHashable: Any]?

        checkoutWebView.onSubmitStart = { payload in
            receivedPayload = payload
            expectation.fulfill()
        }

        let request = CheckoutSubmitStartEvent.testInstance(
            id: "submit-event-789",
            cart: createTestCart(
                id: "gid://shopify/Cart/submit-cart-123",
                subtotalAmount: "100.00",
                totalAmount: "110.00"
            ),
            sessionId: "checkout-123"
        )

        checkoutWebView.checkoutDidStartSubmit(event: request)

        wait(for: [expectation], timeout: 0.1)

        XCTAssertEqual(receivedPayload?["id"] as? String, "submit-event-789")
        XCTAssertEqual(receivedPayload?["method"] as? String, "checkout.submitStart")

        XCTAssertEqual(receivedPayload?["sessionId"] as? String, "checkout-123")

        let cart = receivedPayload?["cart"] as? [String: Any]
        XCTAssertNotNil(cart, "Cart should be included in the emitted event")
        XCTAssertEqual(cart?["id"] as? String, "gid://shopify/Cart/submit-cart-123")

        let cost = cart?["cost"] as? [String: Any]
        let subtotalAmount = cost?["subtotalAmount"] as? [String: Any]
        XCTAssertEqual(subtotalAmount?["amount"] as? String, "100.00")

        let totalAmount = cost?["totalAmount"] as? [String: Any]
        XCTAssertEqual(totalAmount?["amount"] as? String, "110.00")
    }

    func test_checkoutDidChangePrimaryAction_whenDelegateCalled_emitsOnPrimaryActionChangeEvent() {
        let expectation = expectation(description: "onPrimaryActionChange event emitted")
        var receivedPayload: [AnyHashable: Any]?

        checkoutWebView.onPrimaryActionChange = { payload in
            receivedPayload = payload
            expectation.fulfill()
        }

        let event = CheckoutPrimaryActionChangeEvent(
            state: "enabled",
            action: "pay",
            cart: createTestCart()
        )

        checkoutWebView.checkoutDidChangePrimaryAction(event: event)

        wait(for: [expectation], timeout: 0.1)

        XCTAssertEqual(receivedPayload?["method"] as? String, "checkout.primaryActionChange")
        XCTAssertEqual(receivedPayload?["state"] as? String, "enabled")
        XCTAssertEqual(receivedPayload?["action"] as? String, "pay")

        let cart = receivedPayload?["cart"] as? [String: Any]
        XCTAssertNotNil(cart)
        XCTAssertEqual(cart?["id"] as? String, "gid://shopify/Cart/test-cart-123")
    }

    func test_checkoutDidStartSubmit_storesEventInRegistry() {
        checkoutWebView.onSubmitStart = { _ in }

        let request = CheckoutSubmitStartEvent.testInstance(
            id: "submit-registry-test",
            cart: createTestCart(),
            sessionId: "checkout-123"
        )

        checkoutWebView.checkoutDidStartSubmit(event: request)

        XCTAssertTrue(checkoutWebView.hasStoredEvent(forKey: "submit-registry-test"))

        let storedEvent = checkoutWebView.getStoredEvent(forKey: "submit-registry-test")
        XCTAssertNotNil(storedEvent)
        XCTAssertEqual(storedEvent?.id, "submit-registry-test")
    }

    // MARK: - Cancel Events

    func test_checkoutDidCancel_emitsOnCancelEvent() {
        let expectation = expectation(description: "onCancel event emitted")
        var wasCalled = false

        checkoutWebView.onCancel = { _ in
            wasCalled = true
            expectation.fulfill()
        }

        checkoutWebView.checkoutDidCancel()

        wait(for: [expectation], timeout: 0.1)

        XCTAssertTrue(wasCalled)
    }

    // MARK: - Link Click Events

    func test_checkoutDidClickLink_emitsOnLinkClickEventWithUrl() {
        let expectation = expectation(description: "onLinkClick event emitted")
        var receivedPayload: [AnyHashable: Any]?

        checkoutWebView.onLinkClick = { payload in
            receivedPayload = payload
            expectation.fulfill()
        }

        let url = URL(string: "https://example.com/terms")!
        checkoutWebView.checkoutDidClickLink(url: url)

        wait(for: [expectation], timeout: 0.1)

        XCTAssertEqual(receivedPayload?["url"] as? String, "https://example.com/terms")
    }

    // MARK: - Respond To Event Tests

    func test_respondToEvent_whenPaymentMethodChangeResponded_removesEventFromRegistry() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()
        checkoutWebView.onPaymentMethodChangeStart = { _ in }

        let request = CheckoutPaymentMethodChangeStartEvent.testInstance(
            id: "payment-event-1",
            cart: createTestCart()
        )
        checkoutWebView.checkoutDidStartPaymentMethodChange(event: request)

        XCTAssertTrue(checkoutWebView.hasStoredEvent(forKey: "payment-event-1"))

        checkoutWebView.respondToEvent(eventId: "payment-event-1", responseData: "{}")

        XCTAssertFalse(checkoutWebView.hasStoredEvent(forKey: "payment-event-1"))

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    func test_respondToEvent_whenSubmitStartResponded_removesEventFromRegistry() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()
        checkoutWebView.onSubmitStart = { _ in }

        let request = CheckoutSubmitStartEvent.testInstance(
            id: "submit-event-1",
            cart: createTestCart(),
            sessionId: "checkout-123"
        )
        checkoutWebView.checkoutDidStartSubmit(event: request)

        XCTAssertTrue(checkoutWebView.hasStoredEvent(forKey: "submit-event-1"))

        checkoutWebView.respondToEvent(eventId: "submit-event-1", responseData: "{}")

        XCTAssertFalse(checkoutWebView.hasStoredEvent(forKey: "submit-event-1"))

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }

    func test_respondToEvent_whenAddressChangeResponded_removesEventFromRegistry() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()
        checkoutWebView.onAddressChangeStart = { _ in }

        let request = CheckoutAddressChangeStartEvent.testInstance(
            id: "address-event-1",
            addressType: "shipping",
            cart: createTestCart()
        )
        checkoutWebView.checkoutDidStartAddressChange(event: request)

        XCTAssertTrue(checkoutWebView.hasStoredEvent(forKey: "address-event-1"))

        checkoutWebView.respondToEvent(eventId: "address-event-1", responseData: "{}")

        XCTAssertFalse(checkoutWebView.hasStoredEvent(forKey: "address-event-1"))
    }

    func test_respondToEvent_whenEventNotFound_doesNothing() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        checkoutWebView.respondToEvent(eventId: "non-existent-event", responseData: "{}")

        checkoutWebView.flushScheduledSetup()

        XCTAssertEqual(checkoutWebView.setupCheckoutWebViewControllerCallCount, 1)
        XCTAssertEqual(checkoutWebView.removeCheckoutWebViewControllerCallCount, 0)
    }
}

// MARK: - Test Helpers

/// Creates a test Cart instance with sensible defaults
private func createTestCart(
    id: String = "gid://shopify/Cart/test-cart-123",
    subtotalAmount: String = "10.00",
    totalAmount: String = "10.00",
    currencyCode: String = "USD"
) -> ShopifyCheckoutSheetKit.Cart {
    return ShopifyCheckoutSheetKit.Cart(
        id: id,
        lines: [],
        cost: .init(
            subtotalAmount: .init(amount: subtotalAmount, currencyCode: currencyCode),
            totalAmount: .init(amount: totalAmount, currencyCode: currencyCode)
        ),
        buyerIdentity: CartBuyerIdentity(email: nil, phone: nil, customer: nil, countryCode: nil),
        deliveryGroups: [],
        discountCodes: [],
        appliedGiftCards: [],
        discountAllocations: [],
        delivery: .init(addresses: []),
        payment: .init(methods: [])
    )
}

/// Creates a CheckoutCompleteEvent for testing
private func createEmptyCheckoutCompleteEvent(id: String) -> CheckoutCompleteEvent {
    return CheckoutCompleteEvent(
        orderConfirmation: OrderConfirmation(
            order: OrderConfirmation.Order(id: id),
            isFirstOrder: true,
            url: "https://example.com/order",
            number: "1001"
        ),
        cart: createTestCart()
    )
}

// MARK: - Mock Class

class RCTCheckoutWebViewMock: RCTCheckoutWebView {
    var setupCheckoutWebViewControllerCallCount = 0
    var removeCheckoutWebViewControllerCallCount = 0
    var hasExistingCheckout = false
    private var scheduledWork: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupScheduler = { [weak self] work in self?.scheduledWork = work }
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupScheduler = { [weak self] work in self?.scheduledWork = work }
    }

    override func setupCheckoutWebViewController(with url: URL, configuration: CheckoutConfiguration? = nil) -> Bool {
        if hasExistingCheckout {
            removeCheckout()
        }
        setupCheckoutWebViewControllerCallCount += 1
        hasExistingCheckout = true
        if let configuration {
            lastConfiguration = configuration
        }
        return true
    }

    override func removeCheckout() {
        if hasExistingCheckout {
            removeCheckoutWebViewControllerCallCount += 1
        }
        hasExistingCheckout = false
        lastConfiguration = nil
    }

    func flushScheduledSetup() {
        let work = scheduledWork
        scheduledWork = nil
        work?()
    }

    func getStoredEvent(forKey key: String) -> (any CheckoutRequest)? {
        return events.get(key: key)
    }

    func hasStoredEvent(forKey key: String) -> Bool {
        return events.get(key: key) != nil
    }

    func storedEventCount() -> Int {
        return events.count
    }

    private var checkoutWebViewController: AnyObject? {
        return hasExistingCheckout ? NSObject() : nil
    }
}
