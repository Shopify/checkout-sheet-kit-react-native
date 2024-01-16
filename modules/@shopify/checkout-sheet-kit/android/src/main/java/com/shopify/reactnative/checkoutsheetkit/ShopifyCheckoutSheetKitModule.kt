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

package com.shopify.reactnative.checkoutsheetkit

import android.app.Activity
import android.content.Context
import androidx.activity.ComponentActivity
import com.facebook.react.bridge.*
import com.shopify.checkoutsheetkit.*
import java.util.HashMap

class ShopifyCheckoutSheetKitModule(private val reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
    companion object {
        private const val MODULE_NAME = "ShopifyCheckoutSheetKit"
        var checkoutConfig = Configuration()
    }

    override fun getName(): String {
        return MODULE_NAME
    }

    override fun getConstants(): Map<String, Any> {
        val constants: MutableMap<String, Any> = HashMap()
        constants["version"] = ShopifyCheckoutSheetKit.version
        return constants
    }

  @ReactMethod
    fun addListener(eventName: String) {
        // No-op but required for RN to register module
    }

  @ReactMethod
    fun removeListeners(count: Int) {
        // No-op but required for RN to register module
    }

  @ReactMethod
    fun present(checkoutURL: String) {
        if (currentActivity is ComponentActivity) {
            val appContext: Context = reactApplicationContext
            val checkoutEventProcessor = CustomCheckoutEventProcessor(appContext, reactContext)
            currentActivity.runOnUiThread {
                ShopifyCheckoutSheetKit.present(checkoutURL, currentActivity, checkoutEventProcessor)
            }
        }
    }

  @ReactMethod
    fun preload(checkoutURL: String) {
        if (currentActivity is ComponentActivity) {
            ShopifyCheckoutSheetKit.preload(checkoutURL, currentActivity)
        }
    }

  private fun getColorScheme(colorScheme: String): ColorScheme {
        return when (colorScheme) {
            "web_default" -> ColorScheme.Web()
            "light" -> ColorScheme.Light()
            "dark" -> ColorScheme.Dark()
            "automatic", else -> ColorScheme.Automatic()
        }
    }

  private fun colorSchemeToString(colorScheme: ColorScheme): String {
        return colorScheme.id
    }

  private fun isValidColorConfig(config: ReadableMap?): Boolean {
        if (config == null) {
            return false
        }

        val colorKeys = arrayOf("backgroundColor", "spinnerColor", "headerTextColor", "headerBackgroundColor")

        for (key in colorKeys) {
            if (!config.hasKey(key) || config.getString(key) == null || parseColor(config.getString(key)) == null) {
                return false
            }
        }

        return true
    }

  private fun isValidColorScheme(colorScheme: ColorScheme, colorConfig: ReadableMap?): Boolean {
        if (colorConfig == null) {
            return false
        }

        if (colorScheme is ColorScheme.Automatic) {
            if (!colorConfig.hasKey("light") || !colorConfig.hasKey("dark")) {
                return false
            }

            val validLight = isValidColorConfig(colorConfig.getMap("light"))
            val validDark = isValidColorConfig(colorConfig.getMap("dark"))

            return validLight && validDark
        }

        return isValidColorConfig(colorConfig)
    }

  private fun parseColorFromConfig(config: ReadableMap, colorKey: String): Color? {
        return if (config.hasKey(colorKey)) {
            val colorStr = config.getString(colorKey)
            parseColor(colorStr)
        } else null
    }

  private fun createColorsFromConfig(config: ReadableMap?): Colors? {
        if (config == null) {
            return null
        }

        val webViewBackground = parseColorFromConfig(config, "backgroundColor")
        val headerBackground = parseColorFromConfig(config, "headerBackgroundColor")
        val headerFont = parseColorFromConfig(config, "headerTextColor")
        val spinnerColor = parseColorFromConfig(config, "spinnerColor")

        return if (webViewBackground != null && spinnerColor != null && headerFont != null && headerBackground != null) {
            Colors(webViewBackground, headerBackground, headerFont, spinnerColor)
        } else null
    }

  private fun getColors(colorScheme: ColorScheme, config: ReadableMap?): ColorScheme? {
        if (!isValidColorScheme(colorScheme, config)) {
            return null
        }

        if (colorScheme is ColorScheme.Automatic && isValidColorScheme(colorScheme, config)) {
            val lightColors = createColorsFromConfig(config.getMap("light"))
            val darkColors = createColorsFromConfig(config.getMap("dark"))

            if (lightColors != null && darkColors != null) {
                colorScheme.lightColors = lightColors
                colorScheme.darkColors = darkColors
                return colorScheme
            }
        }

                val colors = createColorsFromConfig(config)

        if (colors != null) {
            when (colorScheme) {
                is ColorScheme.Light -> colorScheme.colors = colors
                is ColorScheme.Dark -> colorScheme.colors = colors
                is ColorScheme.Web -> colorScheme.colors = colors
            }
            return colorScheme
        }

        return null
    }

    @ReactMethod
    fun setConfig(config: ReadableMap) {
        val context: Context = reactApplicationContext

        ShopifyCheckoutSheetKit.configure { configuration ->
            if (config.hasKey("preloading")) {
                configuration.preloading = Preloading(config.getBoolean("preloading"))
            }

            if (config.hasKey("colorScheme")) {
                val colorScheme = getColorScheme(config.getString("colorScheme"))
                val colorsConfig = if (config.hasKey("colors")) config.getMap("colors") else null
                var androidConfig: ReadableMap? = null

                if (colorsConfig != null && colorsConfig.hasKey("android")) {
                    androidConfig = colorsConfig.getMap("android")
                }

                if (androidConfig != null && isValidColorConfig(androidConfig)) {
                    val colorSchemeWithOverrides = getColors(colorScheme, androidConfig)
                    if (colorSchemeWithOverrides != null) {
                        configuration.colorScheme = colorSchemeWithOverrides
                        checkoutConfig = configuration
                        return@configure
                    }
                }

                configuration.colorScheme = colorScheme
            }

            checkoutConfig = configuration
        }
    }

    @ReactMethod
    fun getConfig(promise: Promise) {
        val resultConfig = WritableNativeMap()

        resultConfig.putBoolean("preloading", checkoutConfig.preloading.enabled)
        resultConfig.putString("colorScheme", colorSchemeToString(checkoutConfig.colorScheme))

        promise.resolve(resultConfig)
    }

    private fun parseColor(colorStr: String?): Color? {
        return try {
            var colorStr = colorStr?.replace("#", "")

            var color = colorStr?.toLong(16)

            if (colorStr?.length == 6) {
                // If alpha is not included, assume full opacity
                color = color?.or(0xFF000000)
            }

            Color.SRGB(color?.toInt() ?: 0)
        } catch (e: NumberFormatException) {
            println("Warning: Invalid color string. Default color will be used.")
            null
        }
    }
}
