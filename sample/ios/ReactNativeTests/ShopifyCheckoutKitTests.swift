//
//  ShopifyCheckoutKitTests.swift
//  ReactNativeTests
//
//  Created by Mark Murray on 28/11/2023.
//

import Foundation
import XCTest
import ShopifyCheckoutKit
@testable import react_native_shopify_checkout_kit

class ShopifyCheckoutKitTests: XCTestCase {
  func testReturnsDefaultConfig() {
    let shopifyCheckout = getInstance()

    // Call getConfig and capture the result
    var result: [String: Any]?
    shopifyCheckout.getConfig({ config in result = config as? [String: Any] }, reject: { _, _, _ in })

    // Verify that getConfig returned the expected result
    XCTAssertEqual(result?["preloading"] as? Bool, true)
    XCTAssertEqual(result?["colorScheme"] as? String, "automatic")
  }

  func testCheckoutDidCompleteSendsEvent() {
    let mock = mockSendEvent(eventName: "completed")

    mock.startObserving()
    mock.checkoutDidComplete()

    XCTAssertTrue(mock.didSendEvent)
  }

  func testCheckoutDidCancelSendsEvent() {
    let mock = mockAsyncSendEvent(eventName: "close")

    let expectation = self.expectation(description: "CheckoutDidCancel")

    mock.sendEventImplementation = { name, body in
      if name == "close" {
        mock.didSendEvent = true
        expectation.fulfill()
      }
    }

    mock.startObserving()
    mock.checkoutDidCancel()

    // Wait for the expectation to be fulfilled
    waitForExpectations(timeout: 1, handler: nil)

    XCTAssertTrue(mock.didSendEvent)
  }

  func testCheckoutDidFailSendsEvent() {
    let mock = mockSendEvent(eventName: "error")

    mock.startObserving()
    let error = CheckoutError.checkoutExpired(message: "Checkout expired")
    mock.checkoutDidFail(error: error)

    XCTAssertTrue(mock.didSendEvent)
    let message = (mock.eventBody as? [String: Any])?["message"] as! String
    XCTAssertEqual(message, error.localizedDescription)
  }

  private func getInstance() -> RCTShopifyCheckoutKit {
    return RCTShopifyCheckoutKit()
  }

  private func mockSendEvent(eventName: String) -> RCTShopifyCheckoutKitMock {
    let mock = RCTShopifyCheckoutKitMock()
    mock.eventName = eventName
    return mock
  }

  private func mockAsyncSendEvent(eventName: String) -> AsyncRCTShopifyCheckoutKitMock {
    let mock = AsyncRCTShopifyCheckoutKitMock()
    mock.eventName = eventName
    return mock
  }
}

class RCTShopifyCheckoutKitMock: RCTShopifyCheckoutKit {
  var didSendEvent = false
  var eventName: String?
  var eventBody: Any!

  override func sendEvent(withName name: String!, body: Any!) {
    if name == self.eventName {
      didSendEvent = true
      eventBody = body
    }
  }
}

class AsyncRCTShopifyCheckoutKitMock: RCTShopifyCheckoutKit {
  var didSendEvent = false
  var eventName: String?
  var sendEventImplementation: ((String?, Any?) -> Void)?

  override func sendEvent(withName name: String!, body: Any!) {
    sendEventImplementation?(name, body)
  }
}
