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
    /// Internal property used in tests to simulate legacy devices
    internal var supported: Bool = true

    override func view() -> UIView! {
        if supported {
            if #available(iOS 16.0, *) {
                return RCTAcceleratedCheckoutButtonsView()
            }
        }

        // Return an empty view for iOS < 16.0 (silent fallback)
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
    internal var instance: AcceleratedCheckoutButtons?

    @objc var onSizeChange: RCTDirectEventBlock?

    // MARK: - Props

    /// Note that prop values are intentionally nil so that the kit defaults are used

    /**
     * Accepts either { cartId } or { variantId, quantity }.
     */
    @objc var checkoutIdentifier: NSDictionary? {
        didSet {
            updateView()
        }
    }

    @objc var cornerRadius: NSNumber? {
        didSet {
            updateView()
        }
    }

    @objc var wallets: [String]? {
        didSet {
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

    @objc var onFail: RCTBubblingEventBlock?
    @objc var onComplete: RCTBubblingEventBlock?
    @objc var onCancel: RCTBubblingEventBlock?
    @objc var onRenderStateChange: RCTBubblingEventBlock?
    @objc var onShouldRecoverFromError: RCTDirectEventBlock?
    @objc var onClickLink: RCTBubblingEventBlock?

    // MARK: - Private

    /// Compute the wallets to render based on the `wallets` prop.
    /// If `wallets` is provided and empty, render nothing. No fallback here; SDK provides defaults.
    private var shopifyWallets: [Wallet] {
        guard let providedWallets = wallets else { return [] }
        do {
            return try convertToShopifyWallets(providedWallets)
        } catch {
            return []
        }
    }

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
        /// Configuration will be set via a static method from the main module
        configuration = AcceleratedCheckoutConfiguration.shared.configuration

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

        /// Fire initial size change event
        resizeWallets()
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

    private func attachModifiers(to buttons: AcceleratedCheckoutButtons, wallets: [Wallet]?, applePayLabel: PayWithApplePayButtonLabel?) -> AcceleratedCheckoutButtons {
        var modifiedButtons = buttons

        if let wallets {
            modifiedButtons = modifiedButtons.wallets(wallets)
        }

        if let applePayLabel {
            modifiedButtons = modifiedButtons.applePayLabel(applePayLabel)
        }

        if let cornerRadius {
            modifiedButtons = modifiedButtons.cornerRadius(CGFloat(cornerRadius.doubleValue))
        }

        return modifiedButtons
    }

    private func attachEventListeners(to buttons: AcceleratedCheckoutButtons) -> AcceleratedCheckoutButtons {
        return buttons
            .onComplete { [weak self] event in
                self?.handleCheckoutComplete(event)
            }
            .onFail { [weak self] error in
                self?.handleCheckoutFail(error)
            }
            .onCancel { [weak self] in
                self?.handleCheckoutCancel()
            }
            .onRenderStateChange { [weak self] state in
                self?.handleRenderStateChange(state)
            }
            .onClickLink { [weak self] url in
                self?.handleClickLink(url)
            }
    }

    private func updateView() {
        let walletsEmpty = wallets != nil && shopifyWallets.isEmpty

        guard
            let config = configuration,
            let checkoutIdentifierDictionary = checkoutIdentifier as? [String: Any],
            !walletsEmpty
        else {
            renderEmptyView()
            return
        }

        /// Map wallets if provided; otherwise let the kit decide the defaults
        let shopifyWallets: [Wallet]? = wallets != nil ? shopifyWallets : nil

        var buttons: AcceleratedCheckoutButtons

        if let cartIdentifier = extractCartIdentifier(from: checkoutIdentifierDictionary) {
            buttons = AcceleratedCheckoutButtons(cartID: cartIdentifier)
        } else if let productIdentifier = extractProductIdentifier(from: checkoutIdentifierDictionary) {
            buttons = AcceleratedCheckoutButtons(
                variantID: productIdentifier.variantId,
                quantity: productIdentifier.quantity
            )
        } else {
            renderEmptyView()
            return
        }

        /// Attach modifiers (wallets, applePayLabel, cornerRadius)
        buttons = attachModifiers(to: buttons, wallets: shopifyWallets, applePayLabel: PayWithApplePayButtonLabel.from(applePayLabel))
        /// Attach event handlers
        buttons = attachEventListeners(to: buttons)

        var view: AnyView

        /// Attach config (and Apple Pay config if available)
        if let applePayConfig = AcceleratedCheckoutConfiguration.shared.applePayConfiguration {
            view = AnyView(buttons.environmentObject(config).environmentObject(applePayConfig))
        } else {
            view = AnyView(buttons.environmentObject(config))
        }

        if let hostingController {
            hostingController.rootView = view
        } else {
            hostingController = UIHostingController(rootView: view)
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

        instance = buttons

        /// Fire size change event
        resizeWallets()
    }

    // MARK: - Event Handlers

    private func handleCheckoutComplete(_ event: CheckoutCompleteEvent) {
        onComplete?(ShopifyEventSerialization.serialize(checkoutCompleteEvent: event))
    }

    private func handleCheckoutFail(_ error: CheckoutError) {
        onFail?(ShopifyEventSerialization.serialize(checkoutError: error))
    }

    private func handleCheckoutCancel() {
        onCancel?([:])
    }

    private func handleRenderStateChange(_ state: RenderState) {
        onRenderStateChange?(ShopifyEventSerialization.serialize(renderState: state))
    }

    private func handleClickLink(_ url: URL) {
        onClickLink?(ShopifyEventSerialization.serialize(clickEvent: url))
    }

    // MARK: - Helper Methods

    /// Parses `cartId` from `checkoutIdentifier` NSDictionary
    private func extractCartIdentifier(from dictionary: [String: Any]) -> String? {
        guard let rawCartId = dictionary["cartId"] as? String else { return nil }
        let trimmedCartId = rawCartId.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedCartId.isEmpty ? nil : trimmedCartId
    }

    /// Parses `variantId` and `quantity` from `checkoutIdentifier` NSDictionary
    private func extractProductIdentifier(from dictionary: [String: Any]) -> (variantId: String, quantity: Int)? {
        guard let rawVariantId = dictionary["variantId"] as? String else { return nil }
        guard let rawQuantity = dictionary["quantity"] as? NSNumber else { return nil }

        let trimmedVariantId = rawVariantId.trimmingCharacters(in: .whitespacesAndNewlines)
        let quantityValue = rawQuantity.intValue

        guard !trimmedVariantId.isEmpty, quantityValue > 0 else { return nil }
        return (variantId: trimmedVariantId, quantity: quantityValue)
    }

    private func renderEmptyView() {
        instance = nil
        hostingController?.rootView = AnyView(EmptyView())
        onSizeChange?(["height": 0])
    }

    /// Cases for returning 0 height
    /// - No buttons instance available
    /// - Wallets is explicitly an empty array
    /// - OR wallets is provided and maps to empty
    private func calculateRequiredHeight() -> CGFloat {
        guard
            let instance,
            wallets?.isEmpty != true,
            !(wallets != nil && shopifyWallets.isEmpty)
        else {
            return 0
        }

        let numberOfWallets = shopifyWallets.isEmpty
            ? instance.wallets.count
            : max(shopifyWallets.count, 1)

        let buttonHeight: CGFloat = 48
        let gapHeight: CGFloat = 8
        return (CGFloat(numberOfWallets) * buttonHeight) + (CGFloat(numberOfWallets - 1) * gapHeight)
    }

    private func resizeWallets() {
        DispatchQueue.main.async { [weak self] in
            guard let self else {
                return
            }

            let height = self.calculateRequiredHeight()
            self.onSizeChange?(["height": height])
        }
    }

    private func convertToShopifyWallets(_ walletStrings: [String]) throws -> [Wallet] {
        return try walletStrings.compactMap { walletString in
            guard let wallet = Wallet(rawValue: walletString), wallet != nil else {
                let message = "Unknown wallet option: \(String(describing: walletString))"
                print("[ShopifyAcceleratedCheckouts] \(message)")
                throw NSError(domain: "ShopifyAcceleratedCheckouts", code: 1, userInfo: ["message": message])
            }

            return wallet
        }
    }
}
