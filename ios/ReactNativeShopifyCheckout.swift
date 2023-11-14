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

    // TODO @markmur - Improve return type here
    @objc func constantsToExport() -> [AnyHashable: Any]! {
        return [
            "version": ShopifyCheckout.version,
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

    private func getColorScheme(_ colorScheme: String) -> ShopifyCheckout.Configuration.ColorScheme {
        switch colorScheme {
        case "web_default":
            return ShopifyCheckout.Configuration.ColorScheme.web
        case "automatic":
            return ShopifyCheckout.Configuration.ColorScheme.automatic
        case "light":
            return ShopifyCheckout.Configuration.ColorScheme.light
        case "dark":
            return ShopifyCheckout.Configuration.ColorScheme.dark
        default:
            return ShopifyCheckout.Configuration.ColorScheme.automatic
        }
    }

    // TODO @markmur - Improve argument type here
    @objc func configure(_ configuration: [AnyHashable: Any]) -> Void {
         if let preloading = configuration["preloading"] as? Bool {
             ShopifyCheckout.configuration.preloading.enabled = preloading
         }

        if let colorScheme = configuration["colorScheme"] as? String {
            ShopifyCheckout.configuration.colorScheme = getColorScheme(colorScheme)
        }
    }

    @objc func getConfig(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        // TODO @markmur - Improve type here
        let config: [AnyHashable: Any]! = [
            "preloading": ShopifyCheckout.configuration.preloading.enabled,
            "colorScheme": ShopifyCheckout.configuration.colorScheme.rawValue,
        ]

        resolve(config)
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
