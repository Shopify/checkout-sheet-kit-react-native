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
import ShopifyCheckout
import UIKit

@objc(RCTShopifyCheckout)
class RCTShopifyCheckout: UIViewController, CheckoutDelegate {
    func checkoutDidComplete() {}

    func checkoutDidFail(error: ShopifyCheckout.CheckoutError) {}

    func checkoutDidCancel() {
        DispatchQueue.main.async {
            if let rootViewController = UIApplication.shared.delegate?.window??.rootViewController {
                rootViewController.dismiss(animated: true)
            }
        }
    }

    @objc func constantsToExport() -> [AnyHashable: Any]! {
        return [
            "preloading": ShopifyCheckout.configuration.preloading.enabled,
            "prefill": true,
            "colorScheme": ShopifyCheckout.configuration.colorScheme,
            "backgroundColor": ShopifyCheckout.configuration.backgroundColor,
            "spinnerColor": ShopifyCheckout.configuration.spinnerColor
        ]
    }

    @objc func present(_ checkoutURL: String) -> Void {
        DispatchQueue.main.async {
            let sharedDelegate = UIApplication.shared.delegate

            if let url = URL(string: checkoutURL), let rootViewController = sharedDelegate?.window??.rootViewController {
                ShopifyCheckout.present(checkout: url, from: rootViewController, delegate: self)
            }
        }
    }

    @objc func preload(_ checkoutURL: String) -> Void {
        DispatchQueue.main.async {
            if let url = URL(string: checkoutURL) {
                ShopifyCheckout.preload(checkout: url)
            }
        }
    }

    @objc func setConfiguration(_ configuration: [AnyHashable: Any]) {
        if let preloading = configuration["preloading"] as? Bool {
            ShopifyCheckout.configuration.preloading.enabled = preloading
        }
        if let colorScheme = configuration["colorScheme"] as? Configuration.ColorScheme {
            ShopifyCheckout.configuration.colorScheme = colorScheme
        }
        if let backgroundColor = configuration["backgroundColor"] as? UIColor {
            ShopifyCheckout.configuration.backgroundColor = backgroundColor
        }
        if let spinnerColor = configuration["spinnerColor"] as? UIColor {
            ShopifyCheckout.configuration.spinnerColor = spinnerColor
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
