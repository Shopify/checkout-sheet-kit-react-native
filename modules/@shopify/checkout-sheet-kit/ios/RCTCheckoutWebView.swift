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

import React
import ShopifyCheckoutSheetKit
import UIKit

@objc(RCTCheckoutWebView)
class RCTCheckoutWebView: UIView {
    private var checkoutWebViewController: CheckoutWebViewController?

    internal struct EventBus {
        typealias Event = any CheckoutRequest
        private var events: [String: Event] = [:]

        var count: Int {
            events.count
        }

        func get(key: String) -> Event? {
            events[key]
        }

        mutating func set(key: String, event: Event) {
            events[key] = event
        }

        mutating func remove(key: String) {
            events.removeValue(forKey: key)
        }

        mutating func removeAll() {
            events.removeAll()
        }
    }

    internal var events: EventBus = .init()
    private var pendingSetup = false
    internal var setupScheduler: (@escaping () -> Void) -> Void = { work in
        DispatchQueue.main.async(execute: work)
    }

    struct CheckoutConfiguration: Equatable {
        let url: String
        let authToken: String?
    }

    internal var lastConfiguration: CheckoutConfiguration?

    /// Public Properties
    @objc var checkoutUrl: String? {
        didSet {
            guard checkoutUrl != oldValue else { return }
            if checkoutUrl == nil {
                removeCheckout()
            } else {
                scheduleSetupIfNeeded()
            }
        }
    }

    @objc var auth: String? {
        didSet {
            guard auth != oldValue else { return }
            scheduleSetupIfNeeded()
        }
    }

    @objc var onStart: RCTBubblingEventBlock?
    @objc var onFail: RCTBubblingEventBlock?
    @objc var onComplete: RCTBubblingEventBlock?
    @objc var onCancel: RCTBubblingEventBlock?
    @objc var onLinkClick: RCTBubblingEventBlock?
    @objc var onAddressChangeStart: RCTBubblingEventBlock?
    @objc var onPaymentMethodChangeStart: RCTBubblingEventBlock?
    @objc var onSubmitStart: RCTBubblingEventBlock?

    override init(frame: CGRect) {
        super.init(frame: frame)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    deinit {
        self.events.removeAll()
        removeCheckout()
    }

    func setup() {
        pendingSetup = false
        guard let urlString = checkoutUrl,
              let url = URL(string: urlString)
        else {
            // Clear any existing checkout if URL is not available
            removeCheckout()
            return
        }

        backgroundColor = UIColor.clear

        let newConfiguration = CheckoutConfiguration(url: urlString, authToken: auth)
        guard newConfiguration != lastConfiguration else {
            return
        }

        _ = setupCheckoutWebViewController(with: url, configuration: newConfiguration)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        setup()
    }

    @discardableResult
    func setupCheckoutWebViewController(with url: URL, configuration: CheckoutConfiguration? = nil) -> Bool {
        removeCheckout()

        guard let parentViewController else {
            print("[CheckoutWebView] ERROR: Could not find parent view controller")
            return false
        }

        let options = auth.map { CheckoutOptions(authentication: .token($0)) }
        let webViewController = CheckoutWebViewController(checkoutURL: url, delegate: self, options: options)
        parentViewController.addChild(webViewController)

        if let view = webViewController.view {
            view.translatesAutoresizingMaskIntoConstraints = false
            addSubview(view)

            NSLayoutConstraint.activate([
                view.topAnchor.constraint(equalTo: topAnchor),
                view.leadingAnchor.constraint(equalTo: leadingAnchor),
                view.trailingAnchor.constraint(equalTo: trailingAnchor),
                view.bottomAnchor.constraint(equalTo: bottomAnchor)
            ])
        }

        webViewController.didMove(toParent: parentViewController)
        checkoutWebViewController = webViewController
        checkoutWebViewController?.view.frame = bounds

        webViewController.notifyPresented()
        if let configuration {
            lastConfiguration = configuration
        }
        return true
    }

    func removeCheckout() {
        ShopifyCheckoutSheetKit.invalidate()
        checkoutWebViewController?.willMove(toParent: nil)
        checkoutWebViewController?.view.removeFromSuperview()
        checkoutWebViewController?.removeFromParent()
        checkoutWebViewController = nil
        lastConfiguration = nil
    }

    private func scheduleSetupIfNeeded() {
        guard !pendingSetup else { return }
        pendingSetup = true

        setupScheduler { [weak self] in
            self?.setup()
        }
    }

    @objc func reload() {
        guard let urlString = checkoutUrl,
              let url = URL(string: urlString)
        else {
            return
        }

        let configuration = CheckoutConfiguration(url: urlString, authToken: auth)
        _ = setupCheckoutWebViewController(with: url, configuration: configuration)
    }

    @objc func respondToEvent(eventId id: String, responseData: String) {
        print("[CheckoutWebView] Responding to event: \(id) with data: \(responseData)")

        guard let event = events.get(key: id) else {
            print("[CheckoutWebView] Event not found in registry: \(id)")
            return
        }

        handleEventResponse(for: event, with: responseData)
    }

    private func handleEventResponse(
        for event: any CheckoutRequest,
        with responseData: String
    ) {
        let id = event.id

        do {
            try event.respondWith(json: responseData)
            print("[CheckoutWebView] Successfully responded to event: \(id)")
            events.remove(key: id)
        } catch let error as CheckoutEventResponseError {
            print("[CheckoutWebView] Event response error: \(error)")
            handleEventError(eventId: id, error: error)
        } catch {
            print("[CheckoutWebView] Unexpected error responding to event: \(error)")
            handleEventError(eventId: id, error: error)
        }
    }

    private func handleEventError(eventId id: String, error: Error) {
        let errorMessage: String
        let errorCode: String

        if let eventError = error as? CheckoutEventResponseError {
            switch eventError {
            case .invalidEncoding:
                errorMessage = "Invalid response data encoding"
                errorCode = "ENCODING_ERROR"
            case let .decodingFailed(details):
                errorMessage = "Failed to decode response: \(details)"
                errorCode = "DECODING_ERROR"
            }
        } else {
            errorMessage = error.localizedDescription
            errorCode = "UNKNOWN_ERROR"
        }

        onFail?([
            "error": errorMessage,
            "eventId": id,
            "code": errorCode
        ])

        events.remove(key: id)
    }

    override func removeFromSuperview() {
        removeCheckout()
        super.removeFromSuperview()
        events.removeAll()
    }
}

extension RCTCheckoutWebView: CheckoutDelegate {
    func checkoutDidStart(event: CheckoutStartEvent) {
        onStart?(ShopifyEventSerialization.serialize(checkoutStartEvent: event))
    }

    func checkoutDidComplete(event: CheckoutCompleteEvent) {
        onComplete?(ShopifyEventSerialization.serialize(checkoutCompleteEvent: event))
    }

    func checkoutDidCancel() {
        onCancel?([:])
    }

    func checkoutDidFail(error: ShopifyCheckoutSheetKit.CheckoutError) {
        onFail?(ShopifyEventSerialization.serialize(checkoutError: error))
    }

    func checkoutDidClickLink(url: URL) {
        onLinkClick?(["url": url.absoluteString])
    }

    func shouldRecoverFromError(error: CheckoutError) -> Bool {
        error.isRecoverable
    }

    /// Called when checkout starts an address change flow.
    ///
    /// This event is only emitted when native address selection is enabled
    /// for the authenticated app.
    ///
    /// - Parameter event: The address change start event containing:
    ///   - id: Unique identifier for responding to the event
    ///   - addressType: Type of address being changed ("shipping" or "billing")
    ///   - cart: Current cart state
    func checkoutDidStartAddressChange(event: CheckoutAddressChangeStartEvent) {
        events.set(key: event.id, event: event)
        onAddressChangeStart?(ShopifyEventSerialization.serialize(checkoutAddressChangeStartEvent: event))
    }

    /// Called when checkout starts a payment method change flow.
    ///
    /// This event is only emitted when native payment method selection is enabled
    /// for the authenticated app.
    ///
    /// - Parameter event: The payment method change start event containing:
    ///   - id: Unique identifier for responding to the event
    ///   - cart: Current cart state
    func checkoutDidStartPaymentMethodChange(event: CheckoutPaymentMethodChangeStartEvent) {
        events.set(key: event.id, event: event)
        onPaymentMethodChangeStart?(ShopifyEventSerialization.serialize(checkoutPaymentMethodChangeStartEvent: event))
    }

    /// Called when the buyer attempts to submit the checkout.
    ///
    /// This event is only emitted when native payment delegation is configured
    /// for the authenticated app.
    ///
    /// - Parameter event: The submit start event containing:
    ///   - id: Unique identifier for responding to the event
    ///   - cart: Current cart state
    ///   - checkout: Checkout session information
    func checkoutDidStartSubmit(event: CheckoutSubmitStartEvent) {
        events.set(key: event.id, event: event)
        onSubmitStart?(ShopifyEventSerialization.serialize(checkoutSubmitStartEvent: event))
    }
}
