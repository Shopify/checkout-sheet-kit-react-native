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
import ShopifyCheckoutSheetKit
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
		return ["close", "completed", "error", "pixel"]
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

	func checkoutDidFail(error checkoutError: ShopifyCheckoutSheetKit.CheckoutError) {
		if hasListeners {
			let errorInfo: [String: Any] = [
				"message": checkoutError.localizedDescription
			]
			self.sendEvent(withName: "error", body: errorInfo)
		}
	}

	func checkoutDidEmitWebPixelEvent(event: ShopifyCheckoutSheetKit.PixelEvent) {
		if hasListeners {
			var genericEvent: [String: Any]
			switch(event) {
				case .standardEvent(let standardEvent):
					genericEvent = mapToGenericEvent(standardEvent: standardEvent)
				case .customEvent(let customEvent):
					genericEvent = mapToGenericEvent(customEvent: customEvent)
			}
			print("[pixel]", genericEvent)
			self.sendEvent(withName: "pixel", body: genericEvent)
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
			"version": ShopifyCheckoutSheetKit.version
		]
	}

	@objc func present(_ checkoutURL: String) {
		DispatchQueue.main.async {
			let sharedDelegate = UIApplication.shared.delegate

			if let url = URL(string: checkoutURL), let rootViewController = sharedDelegate?.window??.rootViewController {
				ShopifyCheckoutSheetKit.present(checkout: url, from: rootViewController, delegate: self)
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

		if let preloading = configuration["preloading"] as? Bool {
			ShopifyCheckoutSheetKit.configuration.preloading.enabled = preloading
		}

		if let colorScheme = configuration["colorScheme"] as? String {
			ShopifyCheckoutSheetKit.configuration.colorScheme = getColorScheme(colorScheme)
		}

		if let spinnerColorHex = iosConfig?["spinnerColor"] as? String {
			ShopifyCheckoutSheetKit.configuration.spinnerColor = UIColor(hex: spinnerColorHex)
		}

		if let backgroundColorHex = iosConfig?["backgroundColor"] as? String {
			ShopifyCheckoutSheetKit.configuration.backgroundColor = UIColor(hex: backgroundColorHex)
    }
	}

	@objc func getConfig(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
		let config: [String: Any] = [
			"preloading": ShopifyCheckoutSheetKit.configuration.preloading.enabled,
			"colorScheme": ShopifyCheckoutSheetKit.configuration.colorScheme.rawValue,
			"spinnerColor": ShopifyCheckoutSheetKit.configuration.spinnerColor,
			"backgroundColor": ShopifyCheckoutSheetKit.configuration.backgroundColor
		]

		resolve(config)
	}

	/// MARK - Private

	private func stringToJSON(from value: String?) -> [String: Any]? {
		guard let data = value?.data(using: .utf8, allowLossyConversion: false) else { return [:] }
		do {
			let jsonObject = try? JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: Any]
			return jsonObject
		} catch {
			print("Failed to convert string to JSON: \(error)", value)
			return [:]
		}
	}

	private func encodeToJSON(from value: Codable) -> [String: Any] {
		let encoder = JSONEncoder()

		do {
			let jsonData = try encoder.encode(value)
			if let jsonObject = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] {
				return jsonObject
			}
		} catch {
			print("Error encoding to JSON object: \(error)")
		}
		return [:]
	}

	private func mapToGenericEvent(standardEvent: ShopifyCheckoutSheetKit.StandardEvent) -> [String: Any] {
		return encodeToJSON(from: standardEvent)
	}

	private func mapToGenericEvent(customEvent: CustomEvent) -> [String: Any] {
		do {
			return try decodeAndMap(event: customEvent)
		} catch {
			print("[debug] Failed to map custom event: \(error)")
		}

		return [:]
	}

	private func decodeAndMap(event: CustomEvent, decoder: JSONDecoder = JSONDecoder()) throws -> [String: Any] {
		let dictionary: [String: Any] = [
			"context": encodeToJSON(from: event.context),
			"customData": stringToJSON(from: event.customData),
			"id": event.id,
			"name": event.name,
			"timestamp": event.timestamp
		]

		return dictionary
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
