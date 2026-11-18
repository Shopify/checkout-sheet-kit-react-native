// swift-tools-version: 6.0

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
import PackageDescription

let moduleRoot = URL(fileURLWithPath: #filePath).resolvingSymlinksInPath()
    .deletingLastPathComponent().deletingLastPathComponent()

struct ModuleManifest: Decodable {
    struct CheckoutKit: Decodable {
        struct NativeSDKVersions: Decodable {
            let ios: String
        }

        let nativeSdkVersions: NativeSDKVersions
    }

    let checkoutKit: CheckoutKit
}

let manifest = try JSONDecoder().decode(
    ModuleManifest.self,
    from: Data(contentsOf: moduleRoot.appendingPathComponent("package.json"))
)

guard let sdkVersion = Version(manifest.checkoutKit.nativeSdkVersions.ios) else {
    fatalError("checkoutKit.nativeSdkVersions.ios must be a semantic version")
}

let reactNativeHeaders: [Target.Dependency] = [
    .product(name: "ReactHeaders", package: "ReactNative"),
    .product(name: "ReactNativeHeaders", package: "ReactNative"),
    .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
    .product(name: "ReactAppHeaders", package: "React-GeneratedCode")
]

let package = Package(
    name: "CheckoutSheetKitReactNative",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CheckoutSheetKitReactNative",
            targets: ["CheckoutSheetKitReactNativeSwift", "CheckoutSheetKitReactNativeObjC"]
        )
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
        .package(url: "https://github.com/Shopify/checkout-sheet-kit-swift", exact: sdkVersion)
    ],
    targets: [
        .target(
            name: "CheckoutSheetKitReactNativeSwift",
            dependencies: reactNativeHeaders + [
                .product(name: "ShopifyCheckoutSheetKit", package: "checkout-sheet-kit-swift"),
                .product(name: "ShopifyAcceleratedCheckouts", package: "checkout-sheet-kit-swift")
            ],
            path: ".",
            sources: [
                "AcceleratedCheckoutButtons+Extensions.swift",
                "AcceleratedCheckoutButtons.swift",
                "ShopifyCheckoutSheetKit+EventSerialization.swift",
                "ShopifyCheckoutSheetKit+Extensions.swift",
                "ShopifyCheckoutSheetKit.swift"
            ],
            swiftSettings: [.swiftLanguageMode(.v5)]
        ),
        .target(
            name: "CheckoutSheetKitReactNativeObjC",
            dependencies: reactNativeHeaders + [
                .product(name: "ReactCodegen", package: "React-GeneratedCode")
            ],
            path: ".",
            sources: ["ShopifyCheckoutSheetKit.mm"],
            publicHeadersPath: ".",
            cxxSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .define("FOLLY_CFG_NO_COROUTINES", to: "1"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release))
            ]
        )
    ],
    cxxLanguageStandard: .cxx20
)
