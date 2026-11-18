require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
ios_sdk_version = package.fetch("checkoutKit").fetch("nativeSdkVersions").fetch("ios")

new_arch_enabled = ENV["RCT_NEW_ARCH_ENABLED"] == "1"

Pod::Spec.new do |s|
  s.name         = "RNShopifyCheckoutSheetKit"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/Shopify/checkout-sheet-kit-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/*.{h,m,mm,swift}"
  s.exclude_files = "ios/Package.swift"

  s.dependency "React-Core"
  s.dependency "ShopifyCheckoutSheetKit", "= #{ios_sdk_version}"
  s.dependency "ShopifyCheckoutSheetKit/AcceleratedCheckouts", "= #{ios_sdk_version}"

  install_modules_dependencies(s) if new_arch_enabled
end
