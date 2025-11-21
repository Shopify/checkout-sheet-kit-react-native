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

class ShopifyCheckoutSheetKitTests: XCTestCase {
    private var shopifyCheckoutSheetKit: RCTShopifyCheckoutSheetKit!

    override func setUp() {
        super.setUp()
        shopifyCheckoutSheetKit = getShopifyCheckoutSheetKit()
        resetShopifyCheckoutSheetKitDefaults()
    }

    override func tearDown() {
        shopifyCheckoutSheetKit = nil
        super.tearDown()
    }

    private func resetShopifyCheckoutSheetKitDefaults() {
        ShopifyCheckoutSheetKit.configuration.preloading = Configuration.Preloading(enabled: true)
        ShopifyCheckoutSheetKit.configuration.colorScheme = .automatic
        ShopifyCheckoutSheetKit.configuration.closeButtonTintColor = nil
    }

    private func getShopifyCheckoutSheetKit() -> RCTShopifyCheckoutSheetKit {
        return RCTShopifyCheckoutSheetKit()
    }

    /// getConfig
    func testReturnsDefaultConfig() {
        // Call getConfig and capture the result
        var result: [String: Any]?
        shopifyCheckoutSheetKit.getConfig({ config in result = config as? [String: Any] }, reject: { _, _, _ in })

        // Verify that getConfig returned the expected result
        XCTAssertEqual(result?["preloading"] as? Bool, true)
        XCTAssertEqual(result?["colorScheme"] as? String, "automatic")
    }

    /// configure
    func testConfigure() {
        let configuration: [AnyHashable: Any] = [
            "preloading": true,
            "colorScheme": "dark",
            "colors": [
                "ios": [
                    "tintColor": "#FF0000",
                    "backgroundColor": "#0000FF"
                ]
            ]
        ]

        shopifyCheckoutSheetKit.setConfig(configuration)

        XCTAssertTrue(ShopifyCheckoutSheetKit.configuration.preloading.enabled)
        XCTAssertEqual(ShopifyCheckoutSheetKit.configuration.colorScheme, .dark)
        XCTAssertEqual(ShopifyCheckoutSheetKit.configuration.tintColor, UIColor(hex: "#FF0000"))
        XCTAssertEqual(ShopifyCheckoutSheetKit.configuration.backgroundColor, UIColor(hex: "#0000FF"))
    }

    func testConfigureWithPartialConfig() {
        let configuration: [AnyHashable: Any] = [
            "preloading": false
        ]

        shopifyCheckoutSheetKit.setConfig(configuration)

        XCTAssertFalse(ShopifyCheckoutSheetKit.configuration.preloading.enabled)
    }

    func testConfigureWithInvalidColors() {
        let configuration: [AnyHashable: Any] = [
            "colors": [
                "ios": [
                    "tintColor": "invalid"
                ]
            ]
        ]

        let defaultColorFallback = UIColor(red: 0, green: 0, blue: 0, alpha: 1)
        shopifyCheckoutSheetKit.setConfig(configuration)

        XCTAssertEqual(ShopifyCheckoutSheetKit.configuration.tintColor, defaultColorFallback)
    }

  func testConfigureWithCloseButtonColor() {
    let configuration: [AnyHashable: Any] = [
      "colors": [
        "ios": [
          "closeButtonColor": "#FF0000"
        ]
      ]
    ]

    shopifyCheckoutSheetKit.setConfig(configuration)

    XCTAssertEqual(ShopifyCheckoutSheetKit.configuration.closeButtonTintColor, UIColor(hex: "#FF0000"))
  }

  func testConfigureWithInvalidCloseButtonColor() {
    let configuration: [AnyHashable: Any] = [
      "colors": [
        "ios": [
          "closeButtonColor": "invalid"
        ]
      ]
    ]

    let defaultColorFallback = UIColor(red: 0, green: 0, blue: 0, alpha: 1)
    shopifyCheckoutSheetKit.setConfig(configuration)

    XCTAssertEqual(ShopifyCheckoutSheetKit.configuration.closeButtonTintColor, defaultColorFallback)
  }

  func testConfigureWithoutCloseButtonColor() {
    let configuration: [AnyHashable: Any] = [
      "colors": [
        "ios": [
          "tintColor": "#FF0000"
        ]
      ]
    ]

    shopifyCheckoutSheetKit.setConfig(configuration)

    // closeButtonTintColor should remain nil when not specified (uses system default)
    XCTAssertNil(ShopifyCheckoutSheetKit.configuration.closeButtonTintColor)
  }

  func testGetConfigIncludesCloseButtonColor() {
    // Set a close button color
    let configuration: [AnyHashable: Any] = [
      "colors": [
        "ios": [
          "closeButtonColor": "#00FF00"
        ]
      ]
    ]
    shopifyCheckoutSheetKit.setConfig(configuration)

    // Call getConfig and capture the result
    var result: [String: Any]?
    shopifyCheckoutSheetKit.getConfig({ config in result = config as? [String: Any] }, reject: { _, _, _ in })

    // Verify that getConfig returned the close button color
    XCTAssertNotNil(result?["closeButtonColor"])
    let returnedColor = result?["closeButtonColor"] as? UIColor
    XCTAssertEqual(returnedColor, UIColor(hex: "#00FF00"))
  }

    /// checkoutDidComplete
    func testCheckoutDidCompleteSendsEvent() {
        let mock = mockSendEvent(eventName: "completed")

        mock.startObserving()

        // Create a test JSON string matching the new CheckoutCompletedEvent structure
        let testEventJSON = """
        {
            "orderConfirmation": {
                "order": {
                    "id": "test-order-id",
                    "email": "test@shopify.com"
                }
            },
            "cart": {
                "token": "test-cart-token"
            }
        }
        """

        // Simulate the event by calling sendEvent directly with the JSON string
        // This matches how the Android implementation sends completed events
        mock.sendEvent(withName: "completed", body: testEventJSON)

        XCTAssertTrue(mock.didSendEvent)
        XCTAssertEqual(mock.eventBody as? String, testEventJSON)
    }

    /// checkoutDidStart
    func testCheckoutDidStartSendsEvent() {
        let mock = mockSendEvent(eventName: "started")

        mock.startObserving()

        // Create a test JSON string matching the CheckoutStartedEvent structure
        let testEventJSON = """
        {
            "cart": {
                "id": "test-cart-id",
                "token": "test-cart-token"
            }
        }
        """

        // Simulate the event by calling sendEvent directly with the JSON string
        mock.sendEvent(withName: "started", body: testEventJSON)

        XCTAssertTrue(mock.didSendEvent)
        XCTAssertEqual(mock.eventBody as? String, testEventJSON)
    }

    /// checkoutDidCancel
    func testCheckoutDidCancelSendsEvent() {
        let mock = mockAsyncSendEvent(eventName: "close")

        let expectation = self.expectation(description: "CheckoutDidCancel")

        mock.sendEventImplementation = { name, _ in
            if name == "close" {
                mock.didSendEvent = true
                expectation.fulfill()
            }
        }

        mock.checkoutSheet = MockCheckoutSheet()
        mock.startObserving()
        mock.checkoutDidCancel()

        // Wait for the expectation to be fulfilled
        waitForExpectations(timeout: 1, handler: nil)

        XCTAssertTrue(mock.didSendEvent)

        // swiftlint:disable:next force_cast
        XCTAssertTrue((mock.checkoutSheet as! MockCheckoutSheet).dismissWasCalled)
    }

    /// CheckoutOptions parsing
    func testCanPresentCheckoutWithAuthenticationOptions() {
        let options: [AnyHashable: Any] = [
            "authentication": [
                "token": "test-auth-token"
            ]
        ]

        let checkoutOptions = shopifyCheckoutSheetKit.parseCheckoutOptions(options)

        XCTAssertNotNil(checkoutOptions)
        if case .token(let token) = checkoutOptions?.authentication {
            XCTAssertEqual(token, "test-auth-token")
        } else {
            XCTFail("Expected authentication token")
        }
    }

    func testCanPreloadCheckoutWithAuthenticationOptions() {
        let options: [AnyHashable: Any] = [
            "authentication": [
                "token": "test-auth-token"
            ]
        ]

        let checkoutOptions = shopifyCheckoutSheetKit.parseCheckoutOptions(options)

        XCTAssertNotNil(checkoutOptions)
        if case .token(let token) = checkoutOptions?.authentication {
            XCTAssertEqual(token, "test-auth-token")
        } else {
            XCTFail("Expected authentication token")
        }
    }

    func testCanPresentCheckoutWithNullOptions() {
        let checkoutOptions = shopifyCheckoutSheetKit.parseCheckoutOptions(nil)

        XCTAssertNil(checkoutOptions)
    }

    func testCanPreloadCheckoutWithNullOptions() {
        let checkoutOptions = shopifyCheckoutSheetKit.parseCheckoutOptions(nil)

        XCTAssertNil(checkoutOptions)
    }

    private func mockSendEvent(eventName: String) -> RCTShopifyCheckoutSheetKitMock {
        let mock = RCTShopifyCheckoutSheetKitMock()
        mock.eventName = eventName
        return mock
    }

    private func mockAsyncSendEvent(eventName: String) -> AsyncRCTShopifyCheckoutSheetKitMock {
        let mock = AsyncRCTShopifyCheckoutSheetKitMock()
        mock.eventName = eventName
        return mock
    }
}

class RCTShopifyCheckoutSheetKitMock: RCTShopifyCheckoutSheetKit {
    var didSendEvent = false
    var eventName: String?
    var eventBody: Any!

    override func sendEvent(withName name: String!, body: Any!) {
        if name == eventName {
            didSendEvent = true
            eventBody = body
        }
    }
}

class AsyncRCTShopifyCheckoutSheetKitMock: RCTShopifyCheckoutSheetKit {
    var didSendEvent = false
    var eventName: String?
    var sendEventImplementation: ((String?, Any?) -> Void)?

    override func sendEvent(withName name: String!, body: Any!) {
        sendEventImplementation?(name, body)
    }
}

class MockCheckoutSheet: UIViewController {
    var dismissWasCalled = false

    override func dismiss(animated flag: Bool, completion: (() -> Void)? = nil) {
        dismissWasCalled = true
        super.dismiss(animated: flag, completion: completion)
    }
}
