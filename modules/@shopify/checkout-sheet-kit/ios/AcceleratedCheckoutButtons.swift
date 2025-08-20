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
import PassKit
import React
import ShopifyCheckoutSheetKit
import SwiftUI
import UIKit

// MARK: - AcceleratedCheckout Components

@available(iOS 16.0, *)
class AcceleratedCheckoutConfiguration {
    static let shared = AcceleratedCheckoutConfiguration()
    var configuration: ShopifyAcceleratedCheckouts.Configuration?
    var applePayConfiguration: ShopifyAcceleratedCheckouts.ApplePayConfiguration?
    var wallets: [Wallet] = [Wallet.shopPay, Wallet.applePay]

    var available: Bool {
        if #available(iOS 16.0, *) {
            return configuration != nil
        } else {
            return false
        }
    }

    var applePayAvailable: Bool {
        if #available(iOS 16.0, *) {
            return applePayConfiguration != nil
        } else {
            return false
        }
    }
}

@objc(RCTAcceleratedCheckoutButtonsManager)
class RCTAcceleratedCheckoutButtonsManager: RCTViewManager {
    override func view() -> UIView! {
        if #available(iOS 16.0, *) {
            return RCTAcceleratedCheckoutButtonsView()
        }

        // Return an empty view for iOS < 17.0 (silent fallback)
        return UIView()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func constantsToExport() -> [AnyHashable: Any]! {
        return [:]
    }
}

@available(iOS 16.0, *)
class RCTAcceleratedCheckoutButtonsView: UIView {
    private var hostingController: UIHostingController<AnyView>?
    private var configuration: ShopifyAcceleratedCheckouts.Configuration?
    private weak var parentViewController: UIViewController?

    @objc var onSizeChange: RCTDirectEventBlock?

    // MARK: - Props

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
            let height = calculateRequiredHeight()
            onSizeChange?(["height": height])
            invalidateIntrinsicContentSize()
            setNeedsLayout()
            updateView()
        }
    }

    @objc var applePayLabel: String? {
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

    override func layoutSubviews() {
        super.layoutSubviews()
        hostingController?.view.frame = bounds
    }

    override var intrinsicContentSize: CGSize {
        let height = calculateRequiredHeight()
        return CGSize(width: UIView.noIntrinsicMetric, height: height)
    }

    private func setupView() {
        // Configuration will be set via a static method from the main module
        configuration = AcceleratedCheckoutConfiguration.shared.configuration

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

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(configurationUpdated),
            name: Notification.Name("CheckoutKitConfigurationUpdated"),
            object: nil
        )

        // Fire initial size change event
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let height = self.calculateRequiredHeight()
            self.onSizeChange?(["height": height])
        }
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
        configuration = AcceleratedCheckoutConfiguration.shared.configuration
        updateView()
    }

    private func createCartButtons(
        cartId: String,
        wallets: [Wallet],
        applePayLabel: PayWithApplePayButtonLabel?,
        config: ShopifyAcceleratedCheckouts.Configuration,
        applePayConfig: ShopifyAcceleratedCheckouts.ApplePayConfiguration?
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
            .applePayLabel(applePayLabel ?? .plain)
            .cornerRadius(CGFloat(cornerRadius.doubleValue))
            .environmentObject(config)
            .conditionalEnvironmentObject(applePayConfig)
    }

    private func createVariantButtons(
        variantId: String,
        quantity: Int,
        wallets: [Wallet],
        applePayLabel: PayWithApplePayButtonLabel?,
        config: ShopifyAcceleratedCheckouts.Configuration,
        applePayConfig: ShopifyAcceleratedCheckouts.ApplePayConfiguration?
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
            .applePayLabel(applePayLabel ?? .plain)
            .cornerRadius(CGFloat(cornerRadius.doubleValue))
            .environmentObject(config)
            .conditionalEnvironmentObject(applePayConfig)
    }

    private func updateView() {
        // Make sure we have a configuration before creating the view
        guard let config = configuration else {
            // If no configuration is set yet, show an empty view
            if let hostingController {
                hostingController.rootView = AnyView(EmptyView())
            }
            return
        }

        // Use wallets from props, or fallback to default
        let shopifyWallets = wallets.map(convertToShopifyWallets) ?? AcceleratedCheckoutConfiguration.shared.wallets

        let swiftUIView: AnyView

        if let cartId {
            swiftUIView = AnyView(createCartButtons(
                cartId: cartId,
                wallets: shopifyWallets,
                applePayLabel: PayWithApplePayButtonLabel.from(applePayLabel),
                config: config,
                applePayConfig: AcceleratedCheckoutConfiguration.shared.applePayConfiguration
            ))
        } else if let variantId {
            swiftUIView = AnyView(createVariantButtons(
                variantId: variantId,
                quantity: quantity.intValue,
                wallets: shopifyWallets,
                applePayLabel: PayWithApplePayButtonLabel.from(applePayLabel),
                config: config,
                applePayConfig: AcceleratedCheckoutConfiguration.shared.applePayConfiguration
            ))
        } else {
            // Empty view if no cart or variant ID is provided
            swiftUIView = AnyView(EmptyView())
        }

        if let hostingController {
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
        isUserInteractionEnabled = true
    }

    // MARK: - Event Handlers

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
        onRenderStateChange?(ShopifyEventSerialization.serialize(renderState: state))
    }

    private func handleWebPixelEvent(_ event: PixelEvent) {
        onWebPixelEvent?(ShopifyEventSerialization.serialize(pixelEvent: event))
    }

    private func handleClickLink(_ url: URL) {
        onClickLink?(ShopifyEventSerialization.serialize(clickEvent: url))
    }

    // MARK: - Helper Methods

    private func calculateRequiredHeight() -> CGFloat {
        let shopifyWallets = wallets.map(convertToShopifyWallets) ?? AcceleratedCheckoutConfiguration.shared.wallets
        let numberOfWallets = max(shopifyWallets.count, 1)
        let buttonHeight: CGFloat = 48
        let gapHeight: CGFloat = 8
        let totalHeight = (CGFloat(numberOfWallets) * buttonHeight) + (CGFloat(numberOfWallets - 1) * gapHeight)

        return totalHeight
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
}
