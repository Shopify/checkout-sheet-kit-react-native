import com.shopify.example.ReactNative
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ShopifyCheckoutModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "RCTShopifyCheckout"
  }

  fun constantsToExport(): Map<String, Any> {
    return mapOf(
      "preloading" to ShopifyCheckout.configuration.preloading.enabled,
      "prefill" to true,
      "colorScheme" to ShopifyCheckout.configuration.colorScheme,
      "backgroundColor" to ShopifyCheckout.configuration.backgroundColor,
      "spinnerColor" to ShopifyCheckout.configuration.spinnerColor
    )
  }

  @ReactMethod
  fun present(checkoutURL: String) {
    runOnUiThread {
      val url = Uri.parse(checkoutURL)
      ShopifyCheckout.present(checkout = url, from = this, delegate = this)
    }
  }

  @ReactMethod
  fun preload(checkoutURL: String) {
     runOnUiThread {
        val url = Uri.parse(checkoutURL)
        ShopifyCheckout.preload(checkout = url)
      }
  }

  companion object {
    fun requiresMainQueueSetup(): Boolean {
      return true
    }
  }
}
