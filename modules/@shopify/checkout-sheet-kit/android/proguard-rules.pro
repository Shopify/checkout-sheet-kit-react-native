# Keep the ObjectMapper and its methods
-keep class com.fasterxml.jackson.databind.ObjectMapper { *; }

# Keep Checkout Sheet Kit classes
-keep class com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompletedEvent { *; }
-keep class com.shopify.checkoutsheetkit.pixelevents.PixelEvent { *; }
-keep class com.shopify.checkoutsheetkit.CheckoutException { *; }
-keep class com.shopify.checkoutsheetkit.CheckoutExpiredException { *; }
-keep class com.shopify.checkoutsheetkit.ClientException { *; }
-keep class com.shopify.checkoutsheetkit.HttpException { *; }
-keep class com.shopify.checkoutsheetkit.ConfigurationException { *; }
-keep class com.shopify.checkoutsheetkit.CheckoutSheetKitException { *; }
