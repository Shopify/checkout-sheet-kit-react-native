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
import XCTest

class AcceleratedCheckouts_UnsupportedTests: XCTestCase {
    private var module: RCTShopifyCheckoutSheetKit!
    private var manager: RCTAcceleratedCheckoutButtonsManager!

    override func setUp() {
        super.setUp()
        module = RCTShopifyCheckoutSheetKit()
        manager = RCTAcceleratedCheckoutButtonsManager()
        manager.supported = false
    }

    override func tearDown() {
        module = nil
        manager = nil
        super.tearDown()
    }

    func testManagerReturnsFallbackViewOnPreIOS16() throws {
        let view = manager.view()
        XCTAssertEqual(String(describing: type(of: view!)), "UIView")
    }

    func testAvailabilityAPIsReturnFalseOnPreIOS16() throws {
        let accelExpectation = expectation(description: "isAcceleratedCheckoutAvailable false on <16")
        module.isAcceleratedCheckoutAvailable({ value in
            XCTAssertEqual(value as? Bool, false)
            accelExpectation.fulfill()
        }, reject: { _, _, _ in })

        let applePayExpectation = expectation(description: "isApplePayAvailable false on <16")
        module.isApplePayAvailable({ value in
            XCTAssertEqual(value as? Bool, false)
            applePayExpectation.fulfill()
        }, reject: { _, _, _ in })

        wait(for: [accelExpectation, applePayExpectation], timeout: 2)
    }
}
