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
import SwiftUI
@testable import RNShopifyCheckoutKit
@testable import ShopifyCheckoutSheetKit
import XCTest

struct WalletButtons {
  static let zero = Double(0)
  static let one = Double(48)
  static let two = Double(104)
}

@available(iOS 16.0, *)
class AcceleratedCheckouts_SupportedTests: XCTestCase {
    private var shopifyCheckoutKit: RCTShopifyCheckoutKit!

    override func setUp() {
        super.setUp()
        shopifyCheckoutKit = RCTShopifyCheckoutKit()
        resetSharedConfigurations()
        resetCheckoutKitDefaults()
    }

    override func tearDown() {
        resetSharedConfigurations()
        shopifyCheckoutKit = nil
        super.tearDown()
    }

    private func resetSharedConfigurations() {
        AcceleratedCheckoutConfiguration.shared.configuration = nil
        AcceleratedCheckoutConfiguration.shared.applePayConfiguration = nil
    }

    private func resetCheckoutKitDefaults() {
        ShopifyCheckoutSheetKit.configuration.preloading = Configuration.Preloading(enabled: true)
        ShopifyCheckoutSheetKit.configuration.colorScheme = .automatic
        ShopifyCheckoutSheetKit.configuration.closeButtonTintColor = nil
    }

    @discardableResult
    private func configureAcceleratedCheckouts(includeApplePay: Bool, customerAccessToken: String? = nil) -> Bool {
        let storefrontDomain = "example.myshopify.com"
        let accessToken = "shpat_test_token"
        let email = "buyer@example.com"
        let phone = "+12223334444"
        let merchantIdentifier: String? = includeApplePay ? "merchant.com.shopify.reactnative.tests" : nil
        let contactFields: [String]? = includeApplePay ? ["email", "phone"] : nil
        let supportedShippingCountries: [String]? = includeApplePay ? ["IE", "CA"] : nil

        return shopifyCheckoutKit.configureAcceleratedCheckouts(
            storefrontDomain,
            storefrontAccessToken: accessToken,
            customerEmail: email,
            customerPhoneNumber: phone,
            customerAccessToken: customerAccessToken,
            applePayMerchantIdentifier: merchantIdentifier,
            applyPayContactFields: contactFields,
            supportedShippingCountries: supportedShippingCountries
        ).boolValue
    }

    func testConfigureAcceleratedCheckoutsSetsSharedConfigsOnIOS16() throws {
        let notificationExpectation = expectation(forNotification: Notification.Name("AcceleratedCheckoutConfigurationUpdated"), object: nil, handler: nil)
        configureAcceleratedCheckouts(includeApplePay: true)
        wait(for: [notificationExpectation], timeout: 2)
        XCTAssertNotNil(AcceleratedCheckoutConfiguration.shared.configuration)
        XCTAssertNotNil(AcceleratedCheckoutConfiguration.shared.applePayConfiguration)
    }

    func testIsAcceleratedCheckoutAvailableBeforeAndAfterConfig() throws {
        XCTAssertEqual(shopifyCheckoutKit.isAcceleratedCheckoutAvailable().boolValue, false)

        configureAcceleratedCheckouts(includeApplePay: false)

        XCTAssertEqual(shopifyCheckoutKit.isAcceleratedCheckoutAvailable().boolValue, true)
    }

    func testIsApplePayAvailableRequiresApplePayConfig() throws {
        XCTAssertEqual(shopifyCheckoutKit.isApplePayAvailable().boolValue, false)

        configureAcceleratedCheckouts(includeApplePay: false)

        XCTAssertEqual(shopifyCheckoutKit.isApplePayAvailable().boolValue, false)

        configureAcceleratedCheckouts(includeApplePay: true)

        XCTAssertEqual(shopifyCheckoutKit.isApplePayAvailable().boolValue, true)
    }

    func testConfigureAcceleratedCheckoutsStoresCustomerAccessToken() throws {
        let token = "customer-access-token-123"
        configureAcceleratedCheckouts(includeApplePay: false, customerAccessToken: token)
        guard let config = AcceleratedCheckoutConfiguration.shared.configuration else {
          return XCTFail("configuration missing")
        }
        XCTAssertEqual(config.customer?.copy().customerAccessToken, token)
    }

    func testConfigureAcceleratedCheckoutsWithNilCustomerAccessToken() throws {
        configureAcceleratedCheckouts(includeApplePay: false, customerAccessToken: nil)
        guard let config = AcceleratedCheckoutConfiguration.shared.configuration else {
          return XCTFail("configuration missing")
        }
        XCTAssertNil(config.customer?.copy().customerAccessToken)
    }

    func testButtonsViewHeightZeroWhenWalletsExplicitEmpty() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let viewExpectation = expectation(description: "onSizeChange height 0 for empty wallets")

        let view = RCTAcceleratedCheckoutButtonsView()
        view.checkoutIdentifier = ["cartId": "gid://shopify/Cart/1"]
        view.onSizeChange = { payload in
            guard let payload = payload else { return }
            let height = (payload["height"] as? NSNumber)?.doubleValue ?? 0
            if height == WalletButtons.zero {
                viewExpectation.fulfill()
            }
        }
        view.wallets = []

        wait(for: [viewExpectation], timeout: 2)
    }

    func testButtonsViewHeightReflectsWalletCountWhenWalletsProvided() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let viewExpectation = expectation(description: "onSizeChange height for two wallets")
        var fulfilled = false

        let view = RCTAcceleratedCheckoutButtonsView()
        view.checkoutIdentifier = ["cartId": "gid://shopify/Cart/1"]
        view.onSizeChange = { payload in
            if fulfilled { return }
            guard let payload = payload else { return }

            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1

            if height == WalletButtons.two {
                fulfilled = true
                viewExpectation.fulfill()
            }
        }
        view.wallets = ["applePay", "shopPay"]

        wait(for: [viewExpectation], timeout: 2)
    }

    func testButtonsViewEmptyWhenContainingUnknownWallets() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let viewExpectation = expectation(description: "onSizeChange height 0 when contains unknown wallet")
        var fulfilled = false

        let view = RCTAcceleratedCheckoutButtonsView()
        view.checkoutIdentifier = ["cartId": "gid://shopify/Cart/1"]
        view.onSizeChange = { payload in
            if fulfilled { return }
            guard let payload = payload else { return }

            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1

            if height == WalletButtons.zero {
                fulfilled = true
                viewExpectation.fulfill()
            }
        }
        view.wallets = ["applePay", "bogus", "shopPay"]

        wait(for: [viewExpectation], timeout: 2)
        XCTAssertNil(view.instance)
    }

    func testButtonsViewEmptyWhenCheckoutIdentifierMissingOrInvalid() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let missingExpectation = expectation(description: "height 0 when identifier missing")
        let missing = RCTAcceleratedCheckoutButtonsView()
        missing.onSizeChange = { payload in
            guard let payload = payload else { return }
            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1
            if height == 0 { missingExpectation.fulfill() }
        }
        _ = missing
        NotificationCenter.default.post(name: Notification.Name("AcceleratedCheckoutConfigurationUpdated"), object: nil)

        wait(for: [missingExpectation], timeout: 2)

        let invalidExpectation = expectation(description: "height 0 when identifier invalid")
        let invalid = RCTAcceleratedCheckoutButtonsView()
        invalid.onSizeChange = { payload in
            guard let payload = payload else { return }
            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1
            if height == 0 {
                invalidExpectation.fulfill()
            }
        }
        invalid.checkoutIdentifier = ["variantId": "gid://shopify/ProductVariant/1", "quantity": 0]

        wait(for: [invalidExpectation], timeout: 2)
    }

    func testButtonsViewAcceptsCartIdWithWhitespace() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let viewExpectation = expectation(description: "trimmed cartId renders non-zero height")
        var fulfilledCart = false

        let view = RCTAcceleratedCheckoutButtonsView()
        view.wallets = ["applePay", "shopPay"]
        view.onSizeChange = { payload in
            if fulfilledCart { return }
            guard let payload = payload else { return }
            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1
            if height == WalletButtons.two {
                fulfilledCart = true
                viewExpectation.fulfill()
            }
        }
        view.checkoutIdentifier = ["cartId": "  gid://shopify/Cart/1  "]

        wait(for: [viewExpectation], timeout: 2)
        XCTAssertNotNil(view.instance)
    }

    func testButtonsViewAcceptsVariantAndQuantity_withDefaultWallets() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let viewExpectation = expectation(description: "variant + quantity renders non-zero height")
        var fulfilledVariant = false

        let view = RCTAcceleratedCheckoutButtonsView()
        view.onSizeChange = { payload in
            if fulfilledVariant { return }
            guard let payload = payload else { return }

            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1

            /// "Wallets" prop is nil, so default rendered (2 buttons)
            if height == WalletButtons.two {
                fulfilledVariant = true
                viewExpectation.fulfill()
            }
        }
        view.checkoutIdentifier = [
            "variantId": "gid://shopify/ProductVariant/123",
            "quantity": NSNumber(value: 2)
        ]

        wait(for: [viewExpectation], timeout: 2)
        XCTAssertNotNil(view.instance)
    }

    func testButtonsViewAcceptsVariantAndQuantity_withExplicitWallets() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let viewExpectation = expectation(description: "variant + quantity renders non-zero height")
        var fulfilledVariant = false

        let view = RCTAcceleratedCheckoutButtonsView()
        view.wallets = ["shopPay"]
        view.onSizeChange = { payload in
            if fulfilledVariant { return }
            guard let payload = payload else { return }

            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1

            /// Wallets prop is explicitly set, so must be respected
            if height == WalletButtons.one {
                fulfilledVariant = true
                viewExpectation.fulfill()
            }
        }
        view.checkoutIdentifier = [
            "variantId": "gid://shopify/ProductVariant/123",
            "quantity": NSNumber(value: 2)
        ]

        wait(for: [viewExpectation], timeout: 2)
        XCTAssertNotNil(view.instance)
    }

    func testButtonsViewRendersEmptyWhenWalletsArrayIsEmpty() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let viewExpectation = expectation(description: "variant + quantity renders non-zero height")
        var fulfilledVariant = false

        let view = RCTAcceleratedCheckoutButtonsView()
        view.wallets = []
        view.onSizeChange = { payload in
            if fulfilledVariant { return }
            guard let payload = payload else { return }

            let height = (payload["height"] as? NSNumber)?.doubleValue ?? -1

            /// Wallets prop is explicitly set, so must be respected
            if height == WalletButtons.zero {
                fulfilledVariant = true
                viewExpectation.fulfill()
            }
        }
        view.checkoutIdentifier = [
            "variantId": "gid://shopify/ProductVariant/123",
            "quantity": NSNumber(value: 2)
        ]

        wait(for: [viewExpectation], timeout: 2)
        XCTAssertNil(view.instance)
    }

    func testButtonsViewHeightZeroWhenWalletsMapToEmptyUnknowns() throws {
        configureAcceleratedCheckouts(includeApplePay: false)

        let view = RCTAcceleratedCheckoutButtonsView()
        view.wallets = ["bogus", "unknown", "invalid"]

        let height = view.intrinsicContentSize.height
        XCTAssertEqual(height, WalletButtons.zero)
        XCTAssertNil(view.instance)
    }

    func testApplePayLabelMapping_knownAndUnknownKeys() throws {
        XCTAssertTrue(PayWithApplePayButtonLabel.from("buy") == .buy)
        XCTAssertTrue(PayWithApplePayButtonLabel.from("checkout") == .checkout)
        XCTAssertTrue(PayWithApplePayButtonLabel.from("continue") == .continue)
        XCTAssertTrue(PayWithApplePayButtonLabel.from("plain") == .plain)
        XCTAssertTrue(PayWithApplePayButtonLabel.from("unknown") == .plain)
        XCTAssertTrue(PayWithApplePayButtonLabel.from("unknown", fallback: .buy) == .buy)
    }

    func testConfigureAcceleratedCheckoutsReturnsFalseForInvalidApplePayContactField() throws {
        let storefrontDomain = "example.myshopify.com"
        let accessToken = "shpat_test_token"

        let resolved = shopifyCheckoutKit.configureAcceleratedCheckouts(
            storefrontDomain,
            storefrontAccessToken: accessToken,
            customerEmail: nil,
            customerPhoneNumber: nil,
            customerAccessToken: nil,
            applePayMerchantIdentifier: "merchant.com.shopify.reactnative.tests",
            applyPayContactFields: ["email", "not_a_field"],
            supportedShippingCountries: []
        ).boolValue

        XCTAssertEqual(resolved, false)
    }
}

private extension BinaryInteger {
    var doubleValue: Double { Double(self) }
}
