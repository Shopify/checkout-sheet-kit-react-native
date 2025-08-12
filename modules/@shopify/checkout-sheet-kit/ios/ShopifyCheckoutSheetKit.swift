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
import React
import ShopifyCheckoutSheetKit
import UIKit

@objc(RCTShopifyCheckoutSheetKit)
class RCTShopifyCheckoutSheetKit: RCTEventEmitter, CheckoutDelegate {
    private var hasListeners = false

    internal var checkoutSheet: UIViewController?

    override var methodQueue: DispatchQueue! {
        return DispatchQueue.main
    }

    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override init() {
        ShopifyCheckoutSheetKit.configure {
            $0.platform = ShopifyCheckoutSheetKit.Platform.reactNative
        }

        super.init()
    }

    override func supportedEvents() -> [String]! {
        return ["close", "completed", "error", "pixel"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    func checkoutDidComplete(event: CheckoutCompletedEvent) {
        if hasListeners {
            sendEvent(withName: "completed", body: ShopifyEventSerialization.serialize(checkoutCompletedEvent: event))
        }
    }

    func shouldRecoverFromError(error: CheckoutError) -> Bool {
        return error.isRecoverable
    }

    func checkoutDidFail(error: ShopifyCheckoutSheetKit.CheckoutError) {
        guard hasListeners else { return }

        sendEvent(withName: "error", body: ShopifyEventSerialization.serialize(checkoutError: error))
    }

    func checkoutDidEmitWebPixelEvent(event: ShopifyCheckoutSheetKit.PixelEvent) {
        if hasListeners {
            sendEvent(withName: "pixel", body: ShopifyEventSerialization.serialize(pixelEvent: event))
        }
    }

    func checkoutDidCancel() {
        DispatchQueue.main.async {
            if self.hasListeners {
                self.sendEvent(withName: "close", body: nil)
            }

            self.checkoutSheet?.dismiss(animated: true)
        }
    }

    @objc override func constantsToExport() -> [AnyHashable: Any]! {
        return [
            "version": ShopifyCheckoutSheetKit.version
        ]
    }

    static func getRootViewController() -> UIViewController? {
        return (UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene)?.windows
                    .first(where: { $0.isKeyWindow })?.rootViewController
    }

    func getCurrentViewController(_ controller: UIViewController? = getRootViewController()) -> UIViewController? {
        if let presentedViewController = controller?.presentedViewController {
            return getCurrentViewController(presentedViewController)
        }

        if let navigationController = controller as? UINavigationController {
            return getCurrentViewController(navigationController.visibleViewController)
        }

        if let tabBarController = controller as? UITabBarController {
            if let selectedViewController = tabBarController.selectedViewController {
                return getCurrentViewController(selectedViewController)
            }
        }

        return controller
    }

    @objc func dismiss() {
        DispatchQueue.main.async {
            self.checkoutSheet?.dismiss(animated: true)
        }
    }

    @objc func invalidateCache() {
        ShopifyCheckoutSheetKit.invalidate()
    }

    @objc func present(_ checkoutURL: String) {
        DispatchQueue.main.async {
            if let url = URL(string: checkoutURL), let viewController = self.getCurrentViewController() {
                let view = CheckoutViewController(checkout: url, delegate: self)
                viewController.present(view, animated: true)
                self.checkoutSheet = view
            }
        }
    }

    @objc func preload(_ checkoutURL: String) {
        DispatchQueue.main.async {
            if let url = URL(string: checkoutURL) {
                ShopifyCheckoutSheetKit.preload(checkout: url)
            }
        }
    }

    private func getColorScheme(_ colorScheme: String) -> ShopifyCheckoutSheetKit.Configuration.ColorScheme {
        switch colorScheme {
        case "web_default":
            return ShopifyCheckoutSheetKit.Configuration.ColorScheme.web
        case "automatic":
            return ShopifyCheckoutSheetKit.Configuration.ColorScheme.automatic
        case "light":
            return ShopifyCheckoutSheetKit.Configuration.ColorScheme.light
        case "dark":
            return ShopifyCheckoutSheetKit.Configuration.ColorScheme.dark
        default:
            return ShopifyCheckoutSheetKit.Configuration.ColorScheme.automatic
        }
    }

    @objc func setConfig(_ configuration: [AnyHashable: Any]) {
        let colorConfig = configuration["colors"] as? [AnyHashable: Any]
        let iosConfig = colorConfig?["ios"] as? [String: String]

        if let title = configuration["title"] as? String {
            ShopifyCheckoutSheetKit.configuration.title = title
        }

        if let preloading = configuration["preloading"] as? Bool {
            ShopifyCheckoutSheetKit.configuration.preloading.enabled = preloading
        }

        if let colorScheme = configuration["colorScheme"] as? String {
            ShopifyCheckoutSheetKit.configuration.colorScheme = getColorScheme(colorScheme)
        }

        if let tintColorHex = iosConfig?["tintColor"] as? String {
            ShopifyCheckoutSheetKit.configuration.tintColor = UIColor(hex: tintColorHex)
        }

        if let backgroundColorHex = iosConfig?["backgroundColor"] as? String {
            ShopifyCheckoutSheetKit.configuration.backgroundColor = UIColor(hex: backgroundColorHex)
        }

        if let closeButtonColorHex = iosConfig?["closeButtonColor"] as? String {
            ShopifyCheckoutSheetKit.configuration.closeButtonTintColor = UIColor(hex: closeButtonColorHex)
        }
    }

    @objc func getConfig(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
        let config: [String: Any] = [
            "title": ShopifyCheckoutSheetKit.configuration.title,
            "preloading": ShopifyCheckoutSheetKit.configuration.preloading.enabled,
            "colorScheme": ShopifyCheckoutSheetKit.configuration.colorScheme.rawValue,
            "tintColor": ShopifyCheckoutSheetKit.configuration.tintColor,
            "backgroundColor": ShopifyCheckoutSheetKit.configuration.backgroundColor,
            "closeButtonColor": ShopifyCheckoutSheetKit.configuration.closeButtonTintColor
        ]

        resolve(config)
    }
}
