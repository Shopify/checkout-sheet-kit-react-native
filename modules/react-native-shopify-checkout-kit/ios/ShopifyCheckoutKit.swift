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
import ShopifyCheckoutKit
import UIKit

@objc(RCTShopifyCheckoutKit)
class RCTShopifyCheckoutKit: UIViewController, CheckoutDelegate {
    func checkoutDidComplete() {}

    func checkoutDidFail(error _: ShopifyCheckoutKit.CheckoutError) {}

    func checkoutDidCancel() {
        DispatchQueue.main.async {
            if let rootViewController = UIApplication.shared.delegate?.window??.rootViewController {
                rootViewController.dismiss(animated: true)
            }
        }
    }

    @objc func constantsToExport() -> [String: String]! {
        return [
            "version": ShopifyCheckoutKit.version
        ]
    }

    @objc func present(_ checkoutURL: String) {
        DispatchQueue.main.async {
            let sharedDelegate = UIApplication.shared.delegate

            if let url = URL(string: checkoutURL), let rootViewController = sharedDelegate?.window??.rootViewController {
                ShopifyCheckoutKit.present(checkout: url, from: rootViewController, delegate: self)
            }
        }
    }

    @objc func preload(_ checkoutURL: String) {
        DispatchQueue.main.async {
            if let url = URL(string: checkoutURL) {
                ShopifyCheckoutKit.preload(checkout: url)
            }
        }
    }

    private func getColorScheme(_ colorScheme: String) -> ShopifyCheckoutKit.Configuration.ColorScheme {
        switch colorScheme {
        case "web_default":
            return ShopifyCheckoutKit.Configuration.ColorScheme.web
        case "automatic":
            return ShopifyCheckoutKit.Configuration.ColorScheme.automatic
        case "light":
            return ShopifyCheckoutKit.Configuration.ColorScheme.light
        case "dark":
            return ShopifyCheckoutKit.Configuration.ColorScheme.dark
        default:
            return ShopifyCheckoutKit.Configuration.ColorScheme.automatic
        }
    }

    @objc func configure(_ configuration: [AnyHashable: Any]) {
        if let preloading = configuration["preloading"] as? Bool {
            ShopifyCheckoutKit.configuration.preloading.enabled = preloading
        }

        if let colorScheme = configuration["colorScheme"] as? String {
            ShopifyCheckoutKit.configuration.colorScheme = getColorScheme(colorScheme)
        }

         if let spinnerColorHex = configuration["spinnerColor"] as? String {
            ShopifyCheckoutKit.configuration.spinnerColor = UIColor(hex: spinnerColorHex)
        }

        if let backgroundColorHex = configuration["backgroundColor"] as? String {
            ShopifyCheckoutKit.configuration.backgroundColor = UIColor(hex: backgroundColorHex)
        }
    }

    @objc func getConfig(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
        let config: [String: Any] = [
            "preloading": ShopifyCheckoutKit.configuration.preloading.enabled,
            "colorScheme": ShopifyCheckoutKit.configuration.colorScheme.rawValue
        ]

        resolve(config)
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

extension UIColor {
    convenience init(hex: String) {
        let hexString: String = hex.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
        let scanner = Scanner(string: hexString)

        if (hexString.hasPrefix("#")) {
            scanner.scanLocation = 1
        }

        var color: UInt32 = 0
        scanner.scanHexInt32(&color)

        let mask = 0x000000FF
        let r = Int(color >> 16) & mask
        let g = Int(color >> 8) & mask
        let b = Int(color) & mask

        let red   = CGFloat(r) / 255.0
        let green = CGFloat(g) / 255.0
        let blue  = CGFloat(b) / 255.0

        self.init(red:red, green:green, blue:blue, alpha:1)
    }
}
