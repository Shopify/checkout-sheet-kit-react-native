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

    func test_respondToEvent_whenAddressIntentResponded_doesNotRecreateCheckout() {
        checkoutWebView.checkoutUrl = "https://shop.example.com/checkout"
        checkoutWebView.auth = "valid-token"
        checkoutWebView.flushScheduledSetup()

        let request = AddressChangeRequested(
            id: "event-1",
            params: .init(addressType: "shipping", selectedAddress: nil)
        )
        checkoutWebView.checkoutDidRequestAddressChange(event: request)

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

        let event = createEmptyCheckoutCompletedEvent(id: "order-123")

        checkoutWebView.checkoutDidComplete(event: event)

        wait(for: [expectation], timeout: 0.1)

        let orderConfirmation = receivedPayload?["orderConfirmation"] as? [String: Any]
        let order = orderConfirmation?["order"] as? [String: Any]
        XCTAssertEqual(order?["id"] as? String, "order-123")
    }
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

    // Override to check if checkout exists in tests
    private var checkoutWebViewController: AnyObject? {
        return hasExistingCheckout ? NSObject() : nil
    }
}
