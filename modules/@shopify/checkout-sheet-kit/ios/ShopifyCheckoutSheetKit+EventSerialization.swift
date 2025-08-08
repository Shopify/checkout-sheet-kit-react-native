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

/**
 * Shared event serialization utilities for converting ShopifyCheckoutSheetKit events
 * to React Native compatible dictionaries.
 */
class ShopifyEventSerialization {

	/**
	 * Encodes a Codable object to a JSON dictionary for React Native bridge.
	 */
	static func encodeToJSON(from value: Codable) -> [String: Any] {
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

	/**
	 * Converts a JSON string to a dictionary.
	 */
	static func stringToJSON(from value: String?) -> [String: Any]? {
		guard let data = value?.data(using: .utf8, allowLossyConversion: false) else { return [:] }
		do {
			return try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: Any]
		} catch {
			print("Failed to convert string to JSON: \(error)", value ?? "nil")
			return [:]
		}
	}

	/**
	 * Converts a CheckoutCompletedEvent to a React Native compatible dictionary.
	 */
	static func serialize(checkoutCompletedEvent event: CheckoutCompletedEvent) -> [String: Any] {
		return encodeToJSON(from: event)
	}

	/**
	 * Converts a PixelEvent to a React Native compatible dictionary.
	 */
	static func serialize(pixelEvent event: PixelEvent) -> [String: Any] {
		switch event {
		case .standardEvent(let standardEvent):
			let encoded = encodeToJSON(from: standardEvent)
			return [
				"context": encoded["context"] ?? NSNull(),
				"data": encoded["data"] ?? NSNull(),
				"id": encoded["id"] ?? NSNull(),
				"name": encoded["name"] ?? NSNull(),
				"timestamp": encoded["timestamp"] ?? NSNull(),
				"type": "STANDARD"
			]

		case .customEvent(let customEvent):
			return [
				"context": encodeToJSON(from: customEvent.context),
				"customData": stringToJSON(from: customEvent.customData) ?? NSNull(),
				"id": customEvent.id,
				"name": customEvent.name,
				"timestamp": customEvent.timestamp,
				"type": "CUSTOM"
			]
		}
	}

	/**
	 * Converts a CheckoutError to a React Native compatible dictionary.
	 * Handles all specific error types with proper type information.
	 */
	static func serialize(checkoutError error: CheckoutError) -> [String: Any] {
		switch error {
		case .checkoutExpired(let message, let code, let recoverable):
			return [
				"__typename": "CheckoutExpiredError",
				"message": message,
				"code": code.rawValue,
				"recoverable": recoverable
			]

		case .checkoutUnavailable(let message, let code, let recoverable):
			switch code {
			case .clientError(let clientErrorCode):
				return [
					"__typename": "CheckoutClientError",
					"message": message,
					"code": clientErrorCode.rawValue,
					"recoverable": recoverable
				]
			case .httpError(let statusCode):
				return [
					"__typename": "CheckoutHTTPError",
					"message": message,
					"code": "http_error",
					"statusCode": statusCode,
					"recoverable": recoverable
				]
			}

		case .configurationError(let message, let code, let recoverable):
			return [
				"__typename": "ConfigurationError",
				"message": message,
				"code": code.rawValue,
				"recoverable": recoverable
			]

		case .sdkError(let underlying, let recoverable):
			return [
				"__typename": "InternalError",
				"code": "unknown",
				"message": underlying.localizedDescription,
				"recoverable": recoverable
			]

		@unknown default:
			return [
				"__typename": "UnknownError",
				"code": "unknown",
				"message": error.localizedDescription,
				"recoverable": error.isRecoverable
			]
		}
	}

	/**
	 * Converts a RenderState enum to a string for React Native.
	 */
	static func serialize(renderState state: RenderState) -> String {
		switch state {
		case .loading:
			return "loading"
		case .rendered:
			return "rendered"
		case .error:
			return "error"
		@unknown default:
			return "unknown"
		}
	}
}
