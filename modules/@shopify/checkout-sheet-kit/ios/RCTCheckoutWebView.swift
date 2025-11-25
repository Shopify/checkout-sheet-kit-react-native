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

  private struct EventBus {
    typealias Event = any RPCRequest
    private var events: [String: Event] = [:]

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

  private var events: EventBus = .init()
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
  @objc var onLoad: RCTDirectEventBlock?
  @objc var onError: RCTBubblingEventBlock?
  @objc var onComplete: RCTBubblingEventBlock?
  @objc var onCancel: RCTBubblingEventBlock?
  @objc var onClickLink: RCTBubblingEventBlock?
  @objc var onAddressChangeIntent: RCTBubblingEventBlock?
  @objc var onPaymentMethodChangeStart: RCTBubblingEventBlock?

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
          let url = URL(string: urlString) else {
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
        view.bottomAnchor.constraint(equalTo: bottomAnchor),
      ])
    }

    webViewController.didMove(toParent: parentViewController)
    checkoutWebViewController = webViewController
    checkoutWebViewController?.view.frame = bounds

    webViewController.notifyPresented()
    onLoad?(["url": url.absoluteString])
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
          let url = URL(string: urlString) else {
      return
    }

    let configuration = CheckoutConfiguration(url: urlString, authToken: auth)
    _ = setupCheckoutWebViewController(with: url, configuration: configuration)
  }

  @objc func respondToEvent(eventId id: String, responseData: String) {
    print("[CheckoutWebView] Responding to event: \(id) with data: \(responseData)")

    guard let event = self.events.get(key: id) else {
      print("[CheckoutWebView] Event not found in registry: \(id)")
      return
    }

    handleEventResponse(for: event, with: responseData)
  }

  private func handleEventResponse(
    for event: any RPCRequest,
    with responseData: String
  ) {
    guard let id = event.id else { return }

    do {
      try event.respondWith(json: responseData)
      print("[CheckoutWebView] Successfully responded to event: \(id)")
      self.events.remove(key: id)
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
      case .decodingFailed(let details):
        errorMessage = "Failed to decode address response: \(details)"
        errorCode = "DECODING_ERROR"
      case .validationFailed(let details):
        errorMessage = "Invalid address data: \(details)"
        errorCode = "VALIDATION_ERROR"
      }
    } else {
      errorMessage = error.localizedDescription
      errorCode = "UNKNOWN_ERROR"
    }

    onError?([
      "error": errorMessage,
      "eventId": id,
      "code": errorCode,
    ])

    self.events.remove(key: id)
  }

  override func removeFromSuperview() {
    removeCheckout()
    super.removeFromSuperview()
    self.events.removeAll()
  }

}

extension RCTCheckoutWebView: CheckoutDelegate {
  func checkoutDidComplete(event: CheckoutCompleteEvent) {
    onComplete?(ShopifyEventSerialization.serialize(checkoutCompleteEvent: event))
  }

  func checkoutDidCancel() {
    onCancel?([:])
  }

  func checkoutDidFail(error: ShopifyCheckoutSheetKit.CheckoutError) {
    onError?(ShopifyEventSerialization.serialize(checkoutError: error))
  }

  func checkoutDidClickLink(url: URL) {
    onClickLink?(["url": url.absoluteString])
  }

  func shouldRecoverFromError(error: CheckoutError) -> Bool {
    error.isRecoverable
  }

  func checkoutDidRequestAddressChange(event: AddressChangeRequested) {
    guard let id = event.id else { return }

    self.events.set(key: id, event: event)

    onAddressChangeIntent?([
      "id": event.id,
      "type": "addressChangeIntent",
      "addressType": event.params.addressType,
    ])
  }

  func checkoutDidStartPaymentMethodChange(event: CheckoutPaymentMethodChangeStart) {
    guard let id = event.id else { return }

    self.events.set(key: id, event: event)

    var eventData: [String: Any] = [
      "id": event.id,
      "type": "paymentMethodChangeStart",
    ]

    // Include cart payment instruments if available
    if let paymentInstruments = event.params.cart?.paymentInstruments {
      var instruments: [[String: Any]] = []
      for instrument in paymentInstruments {
        var instrumentData: [String: Any] = ["type": instrument.type]
        if let details = instrument.details {
          instrumentData["details"] = details
        }
        instruments.append(instrumentData)
      }
      eventData["cart"] = ["paymentInstruments": instruments]
    }

    onPaymentMethodChangeStart?(eventData)
  }
}
