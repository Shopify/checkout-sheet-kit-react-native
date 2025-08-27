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

import _PassKit_SwiftUI
import Foundation
import PassKit
import SwiftUI

// MARK: - Apple Pay Button

@available(iOS 16.0, *)
extension PayWithApplePayButtonLabel {
    static func from(_ string: String?, fallback: PayWithApplePayButtonLabel = .plain) -> PayWithApplePayButtonLabel {
        guard let string else {
            return fallback
        }
        return map[string] ?? .plain
    }

    public static func ==(lhs: PayWithApplePayButtonLabel, rhs: PayWithApplePayButtonLabel) -> Bool {
        return String(describing: lhs) == String(describing: rhs)
    }

    private static let map: [String: PayWithApplePayButtonLabel] = [
        "addMoney": .addMoney,
        "book": .book,
        "buy": .buy,
        "checkout": .checkout,
        "continue": .continue,
        "contribute": .contribute,
        "donate": .donate,
        "inStore": .inStore,
        "order": .order,
        "plain": .plain,
        "reload": .reload,
        "rent": .rent,
        "setUp": .setUp,
        "subscribe": .subscribe,
        "support": .support,
        "tip": .tip,
        "topUp": .topUp
    ]
}
