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

import UIKit
import ShopifyCheckoutSheetKit
import React

@objc(RCTCheckoutWebView)
class RCTCheckoutWebView: UIView {
    private var checkoutWebViewController: CheckoutWebViewController?
    private var currentURL: URL?
    private weak var parentViewController: UIViewController?

    @objc var checkoutUrl: String? {
        didSet {
            updateCheckout()
        }
    }

    @objc var onLoad: RCTDirectEventBlock?
    @objc var onError: RCTBubblingEventBlock?
    @objc var onComplete: RCTBubblingEventBlock?
    @objc var onCancel: RCTBubblingEventBlock?
    @objc var onPixelEvent: RCTBubblingEventBlock?
    @objc var onClickLink: RCTBubblingEventBlock?
    @objc var onViewAttached: RCTDirectEventBlock?
    @objc var onAddressChangeIntent: RCTBubblingEventBlock?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        backgroundColor = UIColor.clear
    }

    private func findParentViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while let next = responder?.next {
            if let viewController = next as? UIViewController {
                return viewController
            }
            responder = next
        }
        return nil
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        checkoutWebViewController?.view.frame = bounds
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil && checkoutWebViewController == nil && currentURL != nil {
            // Delay to ensure view hierarchy is fully established
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                self?.updateCheckout()
            }
        }
    }

    private func updateCheckout() {
        guard let urlString = checkoutUrl,
              let url = URL(string: urlString) else {
            removeCheckout()
            return
        }

        if url != currentURL {
            currentURL = url
            setupCheckoutWebViewController(with: url)
        }
    }

    private func setupCheckoutWebViewController(with url: URL) {
        removeCheckout()

        // Try to find parent VC, if not found, retry with delay
        guard let parentVC = findParentViewController() ?? self.window?.rootViewController else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                guard let self = self else { return }
                // Try one more time
                if let parentVC = self.findParentViewController() ?? self.window?.rootViewController {
                    self.createAndAttachWebView(with: url, to: parentVC)
                } else {
                    print("[CheckoutWebView] ERROR: Could not find parent view controller after retry")
                }
            }
            return
        }

        createAndAttachWebView(with: url, to: parentVC)
    }

    private func createAndAttachWebView(with url: URL, to parentVC: UIViewController) {
        let webViewController = CheckoutWebViewController(checkoutURL: url, delegate: self)
        print("[CheckoutWebView] Creating CheckoutWebViewController with delegate: \(String(describing: self))")

        parentVC.addChild(webViewController)

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

        webViewController.didMove(toParent: parentVC)
        parentViewController = parentVC
        checkoutWebViewController = webViewController

        print("[CheckoutWebView] CheckoutWebViewController stored, view attached")

        // Test if delegate is working by checking if we can call a method
        if let testDelegate = webViewController as? CheckoutWebViewController {
            print("[CheckoutWebView] WebViewController confirmed as CheckoutWebViewController")
        }

        // Notify that the checkout has been presented - this is required for events to work
        webViewController.notifyPresented()
        print("[CheckoutWebView] Called notifyPresented() to enable event handling")

        onViewAttached?([:])
        onLoad?(["url": url.absoluteString])
        print("[CheckoutWebView] Checkout URL loaded: \(url.absoluteString)")
    }

    private func removeCheckout() {
        checkoutWebViewController?.willMove(toParent: nil)
        checkoutWebViewController?.view.removeFromSuperview()
        checkoutWebViewController?.removeFromParent()
        checkoutWebViewController = nil
        currentURL = nil
    }

    @objc func reload() {
        if let url = currentURL {
            setupCheckoutWebViewController(with: url)
        }
    }

    override func removeFromSuperview() {
        removeCheckout()
        super.removeFromSuperview()
    }
}

extension RCTCheckoutWebView: CheckoutDelegate {
    func checkoutDidComplete(event: CheckoutCompletedEvent) {
      print("[RCTCheckoutWebView] checkoutDidComplete called with event: \(event)")
        onComplete?(ShopifyEventSerialization.serialize(checkoutCompletedEvent: event))
    }

    func checkoutDidCancel() {
        print("[RCTCheckoutWebView] checkoutDidCancel called")
        onCancel?([:])
    }

    func checkoutDidFail(error: ShopifyCheckoutSheetKit.CheckoutError) {
        print("[RCTCheckoutWebView] checkoutDidFail called with error: \(error)")
        onError?(ShopifyEventSerialization.serialize(checkoutError: error))
    }

    func checkoutDidEmitWebPixelEvent(event: ShopifyCheckoutSheetKit.PixelEvent) {
        print("[RCTCheckoutWebView] checkoutDidEmitWebPixelEvent called with event: \(event)")
        onPixelEvent?(ShopifyEventSerialization.serialize(pixelEvent: event))
    }

    func checkoutDidClickLink(url: URL) {
        print("[RCTCheckoutWebView] checkoutDidClickLink called with url: \(url)")
        onClickLink?(["url": url.absoluteString])
    }

    func shouldRecoverFromError(error: CheckoutError) -> Bool {
        return error.isRecoverable
    }

    func checkoutDidRequestAddressChange(event: CheckoutAddressChangeIntentEvent) {
        print("[RCTCheckoutWebView] checkoutDidRequestAddressChange called with addressType: \(event)")
        onAddressChangeIntent?([
          "id": event.id,
          "type": "addressChangeIntent",
          "addressType": event.addressType
        ])
    }
}
