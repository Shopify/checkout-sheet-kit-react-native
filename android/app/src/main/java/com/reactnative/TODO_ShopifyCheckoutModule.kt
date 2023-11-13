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

package com.reactnative

import android.app.Activity
import android.content.Context
import androidx.activity.ComponentActivity
import com.facebook.react.bridge.*
import com.shopify.checkoutkit.*
import java.util.*

class ShopifyCheckoutModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE_NAME = "ShopifyCheckout"
        private val config = Configuration()
    }

    override fun getName(): String {
        return MODULE_NAME
    }

    override fun getConstants(): Map<String, Any> {
        return hashMapOf("version" to ShopifyCheckoutKit.version)
    }

    @ReactMethod
    fun present(checkoutURL: String) {
        val currentActivity = currentActivity
        if (currentActivity is ComponentActivity) {
            val appContext: Context = reactApplicationContext
            val checkoutEventProcessor = MyCheckoutEventProcessor(appContext)
            currentActivity.runOnUiThread {
                ShopifyCheckoutKit.present(checkoutURL, currentActivity, checkoutEventProcessor)
            }
        }
    }

    @ReactMethod
    fun preload(checkoutURL: String) {
        val currentActivity = currentActivity
        if (currentActivity is ComponentActivity) {
            ShopifyCheckoutKit.preload(checkoutURL, currentActivity)
        }
    }

    private fun getColorScheme(colorScheme: String): ColorScheme {
        return when (colorScheme) {
            "web_default" -> ColorScheme.Web()
            "automatic" -> ColorScheme.Automatic()
            "light" -> ColorScheme.Light()
            "dark" -> ColorScheme.Dark()
            else -> ColorScheme.Automatic()
        }
    }

    private fun colorSchemeToString(colorScheme: ColorScheme): String {
        return when (colorScheme) {
            is ColorScheme.Web -> "web_default"
            is ColorScheme.Automatic -> "automatic"
            is ColorScheme.Light -> "light"
            is ColorScheme.Dark -> "dark"
            else -> "automatic"
        }
    }

    @ReactMethod
    fun configure(configuration: ReadableMap) {
        val updatedConfig = ConfigurationUpdater { config ->
            // if (configuration.hasKey("preloading")) {
            //     configuration.setPreloading(configuration.getBoolean("preloading"))
            // }

            // if (configuration.hasKey("colorScheme")) {
            //     configuration.setPreloading(getBoolean("preloading"))
            // }
        }
        ShopifyCheckoutKit.configure(updatedConfig)
    }

    @ReactMethod
    fun getConfig(promise: Promise) {
        val resultConfig = WritableNativeMap()

        resultConfig.putBoolean("preloading", config.preloading.enabled)
        resultConfig.putString("colorScheme", colorSchemeToString(config.colorScheme))

        promise.resolve(resultConfig)
    }
}
