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
  private var currentURL: URL?

  private struct EventBus {
    typealias Event = CheckoutAddressChangeIntentEvent
    var events: [String: CheckoutAddressChangeIntentEvent] = [:]

    mutating func store(eventId: String, event: Event) { events[eventId] = event }

    mutating func remove(eventId: String) { events.removeValue(forKey: eventId) }

    func get(eventId: String) -> Event? { events[eventId] }

    mutating func cleanup() {
      events = events.compactMapValues { event in
        // TODO; ANY CLEANUP NEEDED?
        event
      }
    }
  }

  private var events: EventBus = .init()

  /// Public Properties
  @objc var checkoutUrl: String?
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
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
  }

  deinit {
    self.events.cleanup()
  }

  private func setup() {
    guard
      let urlString = checkoutUrl,
      let url = URL(string: urlString)
    else {
      removeCheckout()
      return
    }

    backgroundColor = UIColor.clear

    if url != currentURL {
      currentURL = url
      setupCheckoutWebViewController(with: url)
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    setup()
  }

  private func setupCheckoutWebViewController(with url: URL) {
    removeCheckout()

    guard let parentViewController else {
      print("[CheckoutWebView] ERROR: Could not find parent view controller")
      return
    }

    let webViewController = CheckoutWebViewController(checkoutURL: url, delegate: self)
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

    // Notify that the checkout has been presented - this is required for events to work
    webViewController.notifyPresented()
    // TODO; NEEDED?
    onViewAttached?([:])
    onLoad?(["url": url.absoluteString])
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

  @objc func respondToEvent(eventId: String, responseData: String) {
    print("[CheckoutWebView] Responding to event: \(eventId) with data: \(responseData)")

    // Look up the event in the global registry
    guard let event = self.events.get(eventId: eventId) else {
      print("[CheckoutWebView] Event not found in registry: \(eventId)")
      return
    }

    // Call the instance method on the correct webview
    self.handleEventResponse(eventId: eventId, event: event, responseData: responseData)
  }

  private func handleEventResponse(
    eventId: String,
    event: CheckoutAddressChangeIntentEvent,
    responseData: String
  ) {
    do {
      guard let data = responseData.data(using: .utf8) else {
        print("[CheckoutWebView] Failed to convert response data to UTF-8")
        return
      }
      let payload = try JSONDecoder().decode(DeliveryAddressChangePayload.self, from: data)
      event.respondWith(result: payload)
      print("[CheckoutWebView] Successfully responded to event: \(eventId)")

      self.events.remove(eventId: eventId)
    } catch {
      print("[CheckoutWebView] Error responding to event: \(error)")
    }
  }

  override func removeFromSuperview() {
    removeCheckout()
    super.removeFromSuperview()
    self.events.cleanup()
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

    self.events.store(eventId: event.id, event: event)
    print("[RCTCheckoutWebView] Stored event with ID: \(event.id) in global registry")

    onAddressChangeIntent?([
      "id": event.id,
      "type": "addressChangeIntent",
      "addressType": event.addressType,
    ])
  }
}

extension UIView {
  var parentViewController: UIViewController? {
    // Starts from next (As we know self is not a UIViewController).
    var parentResponder: UIResponder? = self.next
    while parentResponder != nil {
      if let viewController = parentResponder as? UIViewController {
        return viewController
      }
      parentResponder = parentResponder?.next
    }
    return nil
  }
}
