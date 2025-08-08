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
import UIKit
import SwiftUI
import React
import ShopifyCheckoutSheetKit
import PassKit

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
	}
}

@objc(RCTAcceleratedCheckoutButtonsManager)
class RCTAcceleratedCheckoutButtonsManager: RCTViewManager {

	override func view() -> UIView! {
		if #available(iOS 17.0, *) {
			return RCTAcceleratedCheckoutButtonsView()
		}

		// Return an empty view for iOS < 17.0 (silent fallback)
		return UIView()
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
	@objc var onFail: RCTBubblingEventBlock?
	@objc var onComplete: RCTBubblingEventBlock?
	@objc var onCancel: RCTBubblingEventBlock?
	@objc var onRenderStateChange: RCTBubblingEventBlock?
	@objc var onShouldRecoverFromError: RCTDirectEventBlock?
	@objc var onWebPixelEvent: RCTBubblingEventBlock?
	@objc var onClickLink: RCTBubblingEventBlock?

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

	private func createCartButtons(
		cartId: String,
		wallets: [Wallet],
		config: ShopifyAcceleratedCheckouts.Configuration,
		applePayConfig: ShopifyAcceleratedCheckouts.ApplePayConfiguration
	) -> some View {
		AcceleratedCheckoutButtons(cartID: cartId)
			.wallets(wallets)
			.onComplete { [weak self] event in
				self?.handleCheckoutCompleted(event)
			}
			.onFail { [weak self] error in
				self?.handleCheckoutFailed(error)
			}
			.onCancel { [weak self] in
				self?.handleCheckoutCancelled()
			}
			.onRenderStateChange { [weak self] state in
				self?.handleRenderStateChange(state)
			}
			.onClickLink { [weak self] url in
				self?.handleClickLink(url)
			}
			.onWebPixelEvent { [weak self] event in
				self?.handleWebPixelEvent(event)
			}
			.cornerRadius(CGFloat(cornerRadius.doubleValue))
			.environment(config)
			.environment(applePayConfig)
	}

	private func createVariantButtons(
		variantId: String,
		quantity: Int,
		wallets: [Wallet],
		config: ShopifyAcceleratedCheckouts.Configuration,
		applePayConfig: ShopifyAcceleratedCheckouts.ApplePayConfiguration
	) -> some View {
		AcceleratedCheckoutButtons(variantID: variantId, quantity: quantity)
			.wallets(wallets)
			.onComplete { [weak self] event in
				self?.handleCheckoutCompleted(event)
			}
			.onFail { [weak self] error in
				self?.handleCheckoutFailed(error)
			}
			.onCancel { [weak self] in
				self?.handleCheckoutCancelled()
			}
			.onRenderStateChange { [weak self] state in
				self?.handleRenderStateChange(state)
			}
			.onClickLink { [weak self] url in
				self?.handleClickLink(url)
			}
			.onWebPixelEvent { [weak self] event in
				self?.handleWebPixelEvent(event)
			}
			.cornerRadius(CGFloat(cornerRadius.doubleValue))
			.environment(config)
			.environment(applePayConfig)
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

		// Create Apple Pay configuration
		let applePayConfig = ShopifyAcceleratedCheckouts.ApplePayConfiguration(
			merchantIdentifier: Bundle.main.object(forInfoDictionaryKey: "ApplePayMerchantID") as? String ?? "merchant.com.shopify",
			contactFields: [.email, .phone]
		)

		let swiftUIView: AnyView

		if let cartId = cartId {
			swiftUIView = AnyView(createCartButtons(
				cartId: cartId,
				wallets: shopifyWallets,
				config: config,
				applePayConfig: applePayConfig
			))
		} else if let variantId = variantId {
			swiftUIView = AnyView(createVariantButtons(
				variantId: variantId,
				quantity: quantity.intValue,
				wallets: shopifyWallets,
				config: config,
				applePayConfig: applePayConfig
			))
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
		onComplete?(ShopifyEventSerialization.serialize(checkoutCompletedEvent: event))
	}

	private func handleCheckoutFailed(_ error: CheckoutError) {
		onFail?(ShopifyEventSerialization.serialize(checkoutError: error))
	}

	private func handleCheckoutCancelled() {
		onCancel?([:])
	}

	private func handleRenderStateChange(_ state: RenderState) {
		onRenderStateChange?(["state": ShopifyEventSerialization.serialize(renderState: state)])
	}

	private func handleWebPixelEvent(_ event: PixelEvent) {
		onWebPixelEvent?(ShopifyEventSerialization.serialize(pixelEvent: event))
	}

	private func handleClickLink(_ url: URL) {
		onClickLink?([
			"url": url.absoluteString
		])
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
