require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

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

  s.dependency "React-Core"
  s.dependency "ShopifyCheckoutSheetKit", "~> 3.8.0"
  s.dependency "ShopifyCheckoutSheetKit/AcceleratedCheckouts", "~> 3.8.0"

  install_modules_dependencies(s)
end
