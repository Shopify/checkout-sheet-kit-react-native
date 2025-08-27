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
import ShopifyCheckoutSheetKit
import XCTest

@available(iOS 16.0, *)
class EventSerializationTests: XCTestCase {

    // MARK: - RenderState

    func testRenderStateSerialization_includesErrorReason() throws {
        let serialized = ShopifyEventSerialization.serialize(renderState: .error(reason: "invariant_violation"))
        XCTAssertEqual(serialized["state"], "error")
        XCTAssertEqual(serialized["reason"], "invariant_violation")
    }

    func testRenderStateSerialization_includesEmptyErrorReason() throws {
        let serialized = ShopifyEventSerialization.serialize(renderState: .error(reason: ""))
        XCTAssertEqual(serialized["state"], "error")
        XCTAssertEqual(serialized["reason"], "")
    }

    func testRenderStateSerialization_loadingAndRendered() throws {
        let loading = ShopifyEventSerialization.serialize(renderState: .loading)
        XCTAssertEqual(loading["state"], "loading")
        XCTAssertNil(loading["reason"])

        let rendered = ShopifyEventSerialization.serialize(renderState: .rendered)
        XCTAssertEqual(rendered["state"], "rendered")
        XCTAssertNil(rendered["reason"])
    }

    // MARK: - Click event

    func testClickEventSerialization() throws {
        let url = URL(string: "https://shopify.dev/test")!
        let serialized = ShopifyEventSerialization.serialize(clickEvent: url)
        XCTAssertEqual(serialized["url"], url)
    }
}
