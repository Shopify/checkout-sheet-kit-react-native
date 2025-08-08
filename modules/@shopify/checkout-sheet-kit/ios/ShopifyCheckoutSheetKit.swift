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
import SwiftUI
import PassKit

@objc(RCTShopifyCheckoutSheetKit)
class RCTShopifyCheckoutSheetKit: RCTEventEmitter, CheckoutDelegate {
	private var hasListeners = false

	internal var checkoutSheet: UIViewController?
	private var acceleratedCheckoutsConfiguration: Any?

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
			self.sendEvent(withName: "completed", body: encodeToJSON(from: event))
		}
	}

	func shouldRecoverFromError(error: CheckoutError) -> Bool {
		return error.isRecoverable
	}

	func checkoutDidFail(error: ShopifyCheckoutSheetKit.CheckoutError) {
		guard hasListeners else { return }

		if case .checkoutExpired(let message, let code, let recoverable) = error {
			self.sendEvent(withName: "error", body: [
				"__typename": "CheckoutExpiredError",
				"message": message,
				"code": code.rawValue,
				"recoverable": recoverable
			])
		} else if case .checkoutUnavailable(let message, let code, let recoverable) = error {
			switch code {
			case .clientError(let clientErrorCode):
				self.sendEvent(withName: "error", body: [
					"__typename": "CheckoutClientError",
					"message": message,
					"code": clientErrorCode.rawValue,
					"recoverable": recoverable
				])
			case .httpError(let statusCode):
				self.sendEvent(withName: "error", body: [
					"__typename": "CheckoutHTTPError",
					"message": message,
					"code": "http_error",
					"statusCode": statusCode,
					"recoverable": recoverable
				])
			}
		} else if case .configurationError(let message, let code, let recoverable) = error {
			self.sendEvent(withName: "error", body: [
				"__typename": "ConfigurationError",
				"message": message,
				"code": code.rawValue,
				"recoverable": recoverable
			])
		} else if case .sdkError(let underlying, let recoverable) = error {
			var errorMessage = "\(underlying.localizedDescription)"
			self.sendEvent(withName: "error", body: [
				"__typename": "InternalError",
				"code": "unknown",
				"message": errorMessage,
				"recoverable": recoverable
			])
		} else {
			self.sendEvent(withName: "error", body: [
				"__typename": "UnknownError",
				"code": "unknown",
				"message": error.localizedDescription,
				"recoverable": error.isRecoverable
			])
		}
	}

	func checkoutDidEmitWebPixelEvent(event: ShopifyCheckoutSheetKit.PixelEvent) {
		if hasListeners {
			var genericEvent: [String: Any]
			switch event {
				case .standardEvent(let standardEvent):
					genericEvent = mapToGenericEvent(standardEvent: standardEvent)
				case .customEvent(let customEvent):
					genericEvent = mapToGenericEvent(customEvent: customEvent)
			}
			self.sendEvent(withName: "pixel", body: genericEvent)
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
	}

	@objc func getConfig(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
		let config: [String: Any] = [
			"title": ShopifyCheckoutSheetKit.configuration.title,
			"preloading": ShopifyCheckoutSheetKit.configuration.preloading.enabled,
			"colorScheme": ShopifyCheckoutSheetKit.configuration.colorScheme.rawValue,
			"tintColor": ShopifyCheckoutSheetKit.configuration.tintColor,
			"backgroundColor": ShopifyCheckoutSheetKit.configuration.backgroundColor
		]

		resolve(config)
	}

	@objc func configureAcceleratedCheckouts(
		_ storefrontDomain: String,
		storefrontAccessToken: String,
		customerEmail: String?,
		customerPhoneNumber: String?,
		wallets: [String]
	) {
		if #available(iOS 17.0, *) {
			let customer = ShopifyAcceleratedCheckouts.Customer(
				email: customerEmail,
				phoneNumber: customerPhoneNumber
			)

			acceleratedCheckoutsConfiguration = ShopifyAcceleratedCheckouts.Configuration(
				storefrontDomain: storefrontDomain,
				storefrontAccessToken: storefrontAccessToken,
				customer: customer
			)

			// Update the shared configuration for the UI components
			AcceleratedCheckoutConfiguration.shared.configuration = acceleratedCheckoutsConfiguration as? ShopifyAcceleratedCheckouts.Configuration
			AcceleratedCheckoutConfiguration.shared.wallets = wallets

			// Notify all button views to update with the new configuration
			NotificationCenter.default.post(name: Notification.Name("AcceleratedCheckoutConfigurationUpdated"), object: nil)
		}
	}

	@objc func isAcceleratedCheckoutAvailable(
		_ cartId: String?,
		variantId: String?,
		quantity: NSNumber?,
		resolve: @escaping RCTPromiseResolveBlock,
		reject: @escaping RCTPromiseRejectBlock
	) {
		guard #available(iOS 17.0, *) else {
			reject("UNAVAILABLE", "AcceleratedCheckouts requires iOS 17.0+", nil)
			return
		}

		guard let config = acceleratedCheckoutsConfiguration as? ShopifyAcceleratedCheckouts.Configuration else {
			reject("CONFIG_ERROR", "AcceleratedCheckouts configuration not set", nil)
			return
		}

		Task {
			do {
				// For now, assume accelerated checkouts are available if configuration is set
				// Future enhancement: implement actual availability checking based on shop settings
				let available = true

				resolve(available)
			} catch {
				reject("AVAILABILITY_ERROR", error.localizedDescription, error)
			}
		}
	}

	// MARK: - Private

	private func stringToJSON(from value: String?) -> [String: Any]? {
		guard let data = value?.data(using: .utf8, allowLossyConversion: false) else { return [:] }
		do {
			return try? JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: Any]
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

	private func mapToGenericEvent(standardEvent: StandardEvent) -> [String: Any] {
		let encoded = encodeToJSON(from: standardEvent)
		return [
			"context": encoded["context"],
			"data": encoded["data"],
			"id": encoded["id"],
			"name": encoded["name"],
			"timestamp": encoded["timestamp"],
			"type": "STANDARD"
		] as [String: Any]
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
		return [
			"context": encodeToJSON(from: event.context),
			"customData": stringToJSON(from: event.customData),
			"id": event.id,
			"name": event.name,
			"timestamp": event.timestamp,
			"type": "CUSTOM"
		] as [String: Any]
	}
}

// MARK: - AcceleratedCheckout Components

@available(iOS 17.0, *)
class AcceleratedCheckoutConfiguration {
	static let shared = AcceleratedCheckoutConfiguration()
	var configuration: ShopifyAcceleratedCheckouts.Configuration?
	var wallets: [String] = ["shopPay", "applePay"]

	private init() {
		setupApplePay()
	}

	private func setupApplePay() {
		// Configure Apple Pay environment
		// This should be called during app initialization
		if let merchantID = Bundle.main.object(forInfoDictionaryKey: "ApplePayMerchantID") as? String {
			// Apple Pay is configured via merchant ID in Info.plist
			// The actual Apple Pay setup is handled by the ShopifyAcceleratedCheckouts framework
			print("✅ Apple Pay configured with Merchant ID: \(merchantID)")
		} else {
			print("⚠️ Apple Pay Merchant ID not found in Info.plist. Add 'ApplePayMerchantID' key to enable Apple Pay.")
		}

		// Check Apple Pay availability
		if PKPaymentAuthorizationViewController.canMakePayments() {
			print("✅ Apple Pay is available on this device")
		} else {
			print("⚠️ Apple Pay is not available on this device")
		}
	}

	func configureApplePayEnvironment() {
		// Additional Apple Pay environment configuration
		// This can be called from the React Native side if needed
		let supportedNetworks: [PKPaymentNetwork] = [.visa, .masterCard, .amex, .discover]

		if PKPaymentAuthorizationViewController.canMakePayments(usingNetworks: supportedNetworks) {
			print("✅ Apple Pay supports required payment networks")
		} else {
			print("⚠️ Apple Pay does not support required payment networks")
		}
	}
}

@objc(RCTAcceleratedCheckoutButtonsManager)
class RCTAcceleratedCheckoutButtonsManager: RCTViewManager {

	override func view() -> UIView! {
		if #available(iOS 17.0, *) {
			return RCTAcceleratedCheckoutButtonsView()
		}

    return nil
	}

	override static func requiresMainQueueSetup() -> Bool {
		return true
	}

	override func constantsToExport() -> [AnyHashable : Any]! {
		return [:]
	}
}

@available(iOS 17.0, *)
class RCTAcceleratedCheckoutButtonsView: UIView {
	private var hostingController: UIHostingController<AnyView>?
	private var configuration: ShopifyAcceleratedCheckouts.Configuration?
	private weak var parentViewController: UIViewController?

	@objc var cartId: String? {
		didSet {
			updateView()
		}
	}

	@objc var variantId: String? {
		didSet {
			updateView()
		}
	}

	@objc var quantity: NSNumber = 1 {
		didSet {
			updateView()
		}
	}

	@objc var cornerRadius: NSNumber = 8 {
		didSet {
			updateView()
		}
	}

	@objc var wallets: [String]? {
		didSet {
			updateView()
		}
	}

	@objc var onPress: RCTBubblingEventBlock?
	@objc var onError: RCTBubblingEventBlock?
	@objc var onCheckoutCompleted: RCTBubblingEventBlock?

	override init(frame: CGRect) {
		super.init(frame: frame)
		setupView()
	}

	required init?(coder: NSCoder) {
		super.init(coder: coder)
		setupView()
	}

	private func setupView() {
		// Configuration will be set via a static method from the main module
		self.configuration = AcceleratedCheckoutConfiguration.shared.configuration

		// Ensure Apple Pay environment is configured
		AcceleratedCheckoutConfiguration.shared.configureApplePayEnvironment()

		// Find the parent view controller
		DispatchQueue.main.async { [weak self] in
			self?.parentViewController = self?.findViewController()
		}

		updateView()

		// Listen for configuration updates
		NotificationCenter.default.addObserver(
			self,
			selector: #selector(configurationUpdated),
			name: Notification.Name("AcceleratedCheckoutConfigurationUpdated"),
			object: nil
		)
	}

	private func findViewController() -> UIViewController? {
		var responder: UIResponder? = self
		while let nextResponder = responder?.next {
			if let viewController = nextResponder as? UIViewController {
				return viewController
			}
			responder = nextResponder
		}
		return nil
	}

	@objc private func configurationUpdated() {
		self.configuration = AcceleratedCheckoutConfiguration.shared.configuration
		updateView()
	}

	private func updateView() {
		// Make sure we have a configuration before creating the view
		guard let config = configuration else {
			// If no configuration is set yet, show an empty view
			if let hostingController = hostingController {
				hostingController.rootView = AnyView(EmptyView())
			}
			return
		}

		// Use wallets from props, or fall back to shared configuration, or default to both
		let walletsToUse = wallets ?? AcceleratedCheckoutConfiguration.shared.wallets
		let shopifyWallets = convertToShopifyWallets(walletsToUse)

		let swiftUIView: AnyView

		// Create Apple Pay configuration
		let applePayConfig = ShopifyAcceleratedCheckouts.ApplePayConfiguration(
			merchantIdentifier: Bundle.main.object(forInfoDictionaryKey: "ApplePayMerchantID") as? String ?? "merchant.com.shopify",
			contactFields: [.email, .phone]
		)

		if let cartId = cartId {
			let buttonsView = AcceleratedCheckoutButtons(cartID: cartId)
				.wallets(shopifyWallets)
				.onComplete { [weak self] event in
					self?.handleCheckoutCompleted(event)
				}
				.onFail { [weak self] error in
					self?.handleCheckoutFailed(error)
				}
				.onCancel { [weak self] in
					self?.handleCheckoutCancelled()
				}
				.cornerRadius(CGFloat(cornerRadius.doubleValue))
				.environment(config)
				.environment(applePayConfig)
			swiftUIView = AnyView(buttonsView)
		} else if let variantId = variantId {
			let buttonsView = AcceleratedCheckoutButtons(variantID: variantId, quantity: quantity.intValue)
				.wallets(shopifyWallets)
				.onComplete { [weak self] event in
					self?.handleCheckoutCompleted(event)
				}
				.onFail { [weak self] error in
					self?.handleCheckoutFailed(error)
				}
				.onCancel { [weak self] in
					self?.handleCheckoutCancelled()
				}
				.cornerRadius(CGFloat(cornerRadius.doubleValue))
				.environment(config)
				.environment(applePayConfig)
			swiftUIView = AnyView(buttonsView)
		} else {
			// Empty view if no cart or variant ID is provided
			swiftUIView = AnyView(EmptyView())
		}

		if let hostingController = hostingController {
			hostingController.rootView = swiftUIView
		} else {
			hostingController = UIHostingController(rootView: swiftUIView)
			hostingController?.view.backgroundColor = UIColor.clear

			// Ensure the hosting view can receive touch events
			hostingController?.view.isUserInteractionEnabled = true

			if let hostingView = hostingController?.view {
				addSubview(hostingView)
				hostingView.translatesAutoresizingMaskIntoConstraints = false
				NSLayoutConstraint.activate([
					hostingView.topAnchor.constraint(equalTo: topAnchor),
					hostingView.leadingAnchor.constraint(equalTo: leadingAnchor),
					hostingView.trailingAnchor.constraint(equalTo: trailingAnchor),
					hostingView.bottomAnchor.constraint(equalTo: bottomAnchor)
				])
			}
		}

		// Ensure this view can also receive touch events
		self.isUserInteractionEnabled = true

		// Add a debug tap gesture to verify touch events are working
		let tapGesture = UITapGestureRecognizer(target: self, action: #selector(debugTap))
		tapGesture.cancelsTouchesInView = false // Allow touches to pass through
		self.addGestureRecognizer(tapGesture)
	}

	@objc private func debugTap(gesture: UITapGestureRecognizer) {
		let location = gesture.location(in: self)
		print("👆 Tap detected at location: \(location)")
	}

	private func convertToShopifyWallets(_ walletStrings: [String]) -> [Wallet] {
		return walletStrings.compactMap { walletString in
			switch walletString {
			case "shopPay":
				return .shopPay
			case "applePay":
				return .applePay
			default:
				return nil
			}
		}
	}

	private func handleCheckoutCompleted(_ event: CheckoutCompletedEvent) {
		print("✅ AcceleratedCheckout completed: \(event.orderDetails)")
		onCheckoutCompleted?([
			"orderDetails": event.orderDetails
		])
	}

	private func handleCheckoutFailed(_ error: CheckoutError) {
		print("❌ AcceleratedCheckout failed: \(error.localizedDescription)")
		onError?([
			"message": error.localizedDescription
		])
	}

	private func handleCheckoutCancelled() {
		print("🚫 AcceleratedCheckout cancelled")
		// Handle cancellation if needed
	}

	override func layoutSubviews() {
		super.layoutSubviews()
		hostingController?.view.frame = bounds
	}

	override var intrinsicContentSize: CGSize {
		// Provide a default size for the button
		return CGSize(width: UIView.noIntrinsicMetric, height: 50)
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
