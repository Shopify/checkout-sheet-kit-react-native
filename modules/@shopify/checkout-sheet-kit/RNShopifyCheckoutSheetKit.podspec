require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

fabric_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'

Pod::Spec.new do |s|
  s.name         = "RNShopifyCheckoutSheetKit"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/Shopify/checkout-sheet-kit-react-native.git", :tag => "#{s.version}" }
  s.swift_version = '5.0'

  s.default_subspec = 'Core'

  s.subspec 'Core' do |ss|
    ss.source_files = "ios/ShopifyCheckoutSheetKit*.{h,m,mm,swift}"
    ss.dependency "React-Core"
    ss.dependency "ShopifyCheckoutSheetKit", "~> 3.4.0-rc.9"
  end

  s.subspec 'AcceleratedCheckouts' do |ss|
    ss.source_files = "ios/AcceleratedCheckout*.swift"
    ss.dependency "RNShopifyCheckoutSheetKit/Core"
    ss.dependency "ShopifyCheckoutSheetKit/AcceleratedCheckouts", "~> 3.4.0-rc.9"
    ss.pod_target_xcconfig = {
      'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) RN_SHOPIFY_CHECKOUT_ACCELERATED_CHECKOUTS=1'
    }
  end

  if fabric_enabled
		# Use React Native's helper if available, otherwise add dependencies directly
		if defined?(install_modules_dependencies)
			install_modules_dependencies(s)
		else
			# Fallback: manually specify dependencies for New Architecture
			s.dependency "React-Codegen"
			s.dependency "RCT-Folly", :modular_headers => true
			s.dependency "RCTRequired"
			s.dependency "RCTTypeSafety"
			s.dependency "ReactCommon/turbomodule/core"
		end

		s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"

		s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
		}
  end
end
