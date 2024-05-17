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
import XCTest
@testable import ShopifyCheckoutSheetKit
@testable import RNShopifyCheckoutSheetKit

class CheckoutDidFailTests: XCTestCase {
  private var shopifyCheckoutSheetKit: RCTShopifyCheckoutSheetKit!

  override func setUp() {
    super.setUp()
    shopifyCheckoutSheetKit = getShopifyCheckoutSheetKit()
    resetShopifyCheckoutSheetKitDefaults()
  }

  private func resetShopifyCheckoutSheetKitDefaults() {
    ShopifyCheckoutSheetKit.configuration.preloading = Configuration.Preloading(enabled: true)
    ShopifyCheckoutSheetKit.configuration.colorScheme = .automatic
  }

  override func tearDown() {
    shopifyCheckoutSheetKit = nil
    super.tearDown()
  }

  private func getShopifyCheckoutSheetKit() -> RCTShopifyCheckoutSheetKit {
    return RCTShopifyCheckoutSheetKit()
  }

  func testCheckoutDidFailEmitsCheckoutExpiredError() {
    let mock = mockSendEvent(eventName: "error")
    mock.startObserving()

    let error = CheckoutError.checkoutExpired(
        message: "expired",
        code: CheckoutErrorCode.cartExpired,
        recoverable: false
    )

    mock.checkoutDidFail(error: error)

    XCTAssertTrue(mock.didSendEvent, "Event should have been sent when checkout fails")

    guard let eventBody = mock.eventBody as? [String: Any] else {
        return XCTFail("Event body was not available or not in the correct format")
    }

    if case .checkoutExpired(let message, let code, let recoverable) = error {
      XCTAssertEqual(eventBody["__typename"] as? String, "CheckoutExpiredError")
      XCTAssertEqual(eventBody["message"] as? String, "expired")
      XCTAssertEqual(eventBody["code"] as? String, CheckoutErrorCode.cartExpired.rawValue)
      XCTAssertEqual(eventBody["recoverable"] as? Bool, false)
    } else {
        XCTFail("Expected checkoutExpiredError but found different error")
    }
  }

  func testCheckoutDidFailEmitsCheckoutClientError() {
    let mock = mockSendEvent(eventName: "error")
    mock.startObserving()

    let error = CheckoutError.checkoutUnavailable(
        message: "expired",
        code: .clientError(code: CheckoutErrorCode.cartExpired),
        recoverable: false
    )

    mock.checkoutDidFail(error: error)

    XCTAssertTrue(mock.didSendEvent, "Event should have been sent when checkout fails")

    guard let eventBody = mock.eventBody as? [String: Any] else {
        return XCTFail("Event body was not available or not in the correct format")
    }

    if case .checkoutUnavailable = error {
      XCTAssertEqual(eventBody["__typename"] as? String, "CheckoutClientError")
      XCTAssertEqual(eventBody["message"] as? String, "expired")
      XCTAssertEqual(eventBody["code"] as? String, CheckoutErrorCode.cartExpired.rawValue)
      XCTAssertEqual(eventBody["recoverable"] as? Bool, false)
    } else {
        XCTFail("Expected checkoutClientError but found different error")
    }
  }

  func testCheckoutDidFailEmitsCheckoutHTTPError() {
    let mock = mockSendEvent(eventName: "error")
    mock.startObserving()

    let error = CheckoutError.checkoutUnavailable(
        message: "internal server error",
        code: .httpError(statusCode: 500),
        recoverable: true
    )

    mock.checkoutDidFail(error: error)

    XCTAssertTrue(mock.didSendEvent, "Event should have been sent when checkout fails")

    guard let eventBody = mock.eventBody as? [String: Any] else {
        return XCTFail("Event body was not available or not in the correct format")
    }

    if case .checkoutUnavailable = error {
      XCTAssertEqual(eventBody["__typename"] as? String, "CheckoutHTTPError")
      XCTAssertEqual(eventBody["message"] as? String, "internal server error")
      XCTAssertEqual(eventBody["statusCode"] as? Int, 500)
      XCTAssertEqual(eventBody["recoverable"] as? Bool, true)
    } else {
        XCTFail("Expected checkoutClientError but found different error")
    }
  }

  func testCheckoutDidFailEmitsConfigurationError() {
    let mock = mockSendEvent(eventName: "error")
    mock.startObserving()

    let error = CheckoutError.configurationError(
        message: "storefront password required",
        code: CheckoutErrorCode.storefrontPasswordRequired,
        recoverable: false
    )

    mock.checkoutDidFail(error: error)

    XCTAssertTrue(mock.didSendEvent, "Event should have been sent when checkout fails")

    guard let eventBody = mock.eventBody as? [String: Any] else {
        return XCTFail("Event body was not available or not in the correct format")
    }

    if case .configurationError = error {
      XCTAssertEqual(eventBody["__typename"] as? String, "ConfigurationError")
      XCTAssertEqual(eventBody["message"] as? String, "storefront password required")
      XCTAssertEqual(eventBody["code"] as? String, CheckoutErrorCode.storefrontPasswordRequired.rawValue)
      XCTAssertEqual(eventBody["recoverable"] as? Bool, false)
    } else {
        XCTFail("Expected CheckoutConfigurationError but found different error")
    }
  }

  func testCheckoutDidFailEmitsInternalError() {
    let mock = mockSendEvent(eventName: "error")
    mock.startObserving()

    let error = CheckoutError.sdkError(
        underlying: NSError(domain: "com.shopify", code: 1001, userInfo: [NSLocalizedDescriptionKey: "failed"]),
        recoverable: true
    )

    mock.checkoutDidFail(error: error)

    XCTAssertTrue(mock.didSendEvent, "Event should have been sent when checkout fails")

    guard let eventBody = mock.eventBody as? [String: Any] else {
        return XCTFail("Event body was not available or not in the correct format")
    }

    if case .sdkError = error {
      XCTAssertEqual(eventBody["__typename"] as? String, "InternalError")
      XCTAssertEqual(eventBody["message"] as? String, "failed")
      XCTAssertEqual(eventBody["recoverable"] as? Bool, true)
    } else {
        XCTFail("Expected InternalError but found different error")
    }
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
