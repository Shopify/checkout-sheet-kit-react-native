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
import React

@objc(RCTShopifyCheckoutSheetKit)
class RCTShopifyCheckoutSheetKit: RCTEventEmitter, CheckoutDelegate {
	private var rootViewController: UIViewController?

	private var hasListeners = false

	override init() {
		super.init()
		self.rootViewController = UIApplication.shared.delegate?.window??.rootViewController
	}

	override var methodQueue: DispatchQueue! {
		return DispatchQueue.main
	}

	@objc override static func requiresMainQueueSetup() -> Bool {
		return true
	}

	override func supportedEvents() -> [String]! {
		return ["close", "completed", "error"]
	}

	override func startObserving() {
		hasListeners = true
	}

	override func stopObserving() {
		hasListeners = false
	}

	func checkoutDidComplete() {
		if hasListeners {
			self.sendEvent(withName: "completed", body: nil)
		}
	}

	func checkoutDidFail(error checkoutError: ShopifyCheckoutKit.CheckoutError) {
		if hasListeners {
			let errorInfo: [String: Any] = [
				"message": checkoutError.localizedDescription
			]
			self.sendEvent(withName: "error", body: errorInfo)
		}
	}

	func checkoutDidCancel() {
		DispatchQueue.main.async {
			if self.hasListeners {
				self.sendEvent(withName: "close", body: nil)
			}
			self.rootViewController?.dismiss(animated: true)
		}
	}

	@objc override func constantsToExport() -> [AnyHashable: Any]! {
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

	@objc func setConfig(_ configuration: [AnyHashable: Any]) {
		let colorConfig = configuration["colors"] as? [AnyHashable: Any]
		let iosConfig = colorConfig?["ios"] as? [String: String]

		if let preloading = configuration["preloading"] as? Bool {
			ShopifyCheckoutKit.configuration.preloading.enabled = preloading
		}

		if let colorScheme = configuration["colorScheme"] as? String {
			ShopifyCheckoutKit.configuration.colorScheme = getColorScheme(colorScheme)
		}

		if let spinnerColorHex = iosConfig?["spinnerColor"] as? String {
			ShopifyCheckoutKit.configuration.spinnerColor = UIColor(hex: spinnerColorHex)
		}

		if let backgroundColorHex = iosConfig?["backgroundColor"] as? String {
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
}

extension UIColor {
	convenience init(hex: String) {
		let hexString: String = hex.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
		let start = hexString.index(hexString.startIndex, offsetBy: hexString.hasPrefix("#") ? 1 : 0)
		let hexColor = String(hexString[start...])

		let scanner = Scanner(string: hexColor)
		var hexNumber: UInt64 = 0

		if scanner.scanHexInt64(&hexNumber) {
			let red = (hexNumber & 0xff0000) >> 16
			let green = (hexNumber & 0x00ff00) >> 8
			let blue = hexNumber & 0x0000ff

			self.init(
				red: CGFloat(red) / 0xff,
				green: CGFloat(green) / 0xff,
				blue: CGFloat(blue) / 0xff,
				alpha: 1
			)
		} else {
			self.init(red: 0, green: 0, blue: 0, alpha: 1)
		}
	}
}
