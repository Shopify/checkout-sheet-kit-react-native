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
import React
import ShopifyAcceleratedCheckouts
import SwiftUI
import UIKit

class AcceleratedCheckoutConfiguration {
    static let shared = AcceleratedCheckoutConfiguration()
    var configuration: ShopifyAcceleratedCheckouts.Configuration?

    private init() {}
}

@objc(RCTAcceleratedCheckoutButtonManager)
class RCTAcceleratedCheckoutButtonManager: RCTViewManager {
    override func view() -> UIView! {
        return RCTAcceleratedCheckoutButtonView()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func constantsToExport() -> [AnyHashable: Any]! {
        return [:]
    }
}

class RCTAcceleratedCheckoutButtonView: UIView {
    private var hostingController: UIHostingController<AnyView>?
    private var configuration: ShopifyAcceleratedCheckouts.Configuration?

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
        configuration = AcceleratedCheckoutConfiguration.shared.configuration
        updateView()
    }

    private func updateView() {
        guard let config = configuration else {
            return
        }

        let swiftUIView: AnyView

        if let cartId {
            swiftUIView = AnyView(
                AcceleratedCheckoutButton(
                    cartId: cartId,
                    configuration: config,
                    cornerRadius: CGFloat(cornerRadius.doubleValue)
                ) { result in
                    self.handleCheckoutResult(result)
                }
            )
        } else if let variantId {
            swiftUIView = AnyView(
                AcceleratedCheckoutButton(
                    variantId: variantId,
                    quantity: quantity.intValue,
                    configuration: config,
                    cornerRadius: CGFloat(cornerRadius.doubleValue)
                ) { result in
                    self.handleCheckoutResult(result)
                }
            )
        } else {
            // Empty view if no cart or variant ID is provided
            swiftUIView = AnyView(EmptyView())
        }

        if let hostingController {
            hostingController.rootView = swiftUIView
        } else {
            hostingController = UIHostingController(rootView: swiftUIView)
            hostingController?.view.backgroundColor = UIColor.clear

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
    }

    private func handleCheckoutResult(_ result: ShopifyAcceleratedCheckouts.CheckoutResult) {
        switch result {
        case .success:
            onCheckoutCompleted?([:])
        case let .failure(error):
            onError?([
                "message": error.localizedDescription
            ])
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        hostingController?.view.frame = bounds
    }
}
