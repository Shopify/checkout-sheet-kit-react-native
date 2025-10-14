package com.shopify.checkoutkitreactnative;

import androidx.activity.ComponentActivity;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.shopify.checkoutsheetkit.CheckoutException;
import com.shopify.checkoutsheetkit.CheckoutExpiredException;
import com.shopify.checkoutsheetkit.CheckoutSheetKitException;
import com.shopify.checkoutsheetkit.ClientException;
import com.shopify.checkoutsheetkit.ConfigurationException;
import com.shopify.checkoutsheetkit.HttpException;
import com.shopify.checkoutsheetkit.ShopifyCheckoutSheetKit;
import com.shopify.checkoutsheetkit.pixelevents.PixelEvent;
import com.shopify.checkoutsheetkit.pixelevents.StandardPixelEvent;
import com.shopify.checkoutsheetkit.pixelevents.CustomPixelEvent;
import com.shopify.checkoutsheetkit.pixelevents.EventType;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompletedEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.OrderDetails;
import com.shopify.checkoutsheetkit.lifecycleevents.CartInfo;
import com.shopify.checkoutsheetkit.lifecycleevents.Price;
import com.shopify.reactnative.checkoutsheetkit.ShopifyCheckoutSheetKitModule;
import com.shopify.reactnative.checkoutsheetkit.CustomCheckoutEventProcessor;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import android.content.Context;

import java.util.ArrayList;
import java.util.List;

@RunWith(MockitoJUnitRunner.class)
public class ShopifyCheckoutSheetKitModuleTest {
  @Mock
  private ReactApplicationContext mockReactContext;
  @Mock
  private ComponentActivity mockComponentActivity;
  @Mock
  private DeviceEventManagerModule.RCTDeviceEventEmitter mockEventEmitter;
  @Mock
  private Context mockContext;

  @Captor
  ArgumentCaptor<Runnable> runnableCaptor;
  @Captor
  private ArgumentCaptor<String> stringCaptor;

  private ShopifyCheckoutSheetKitModule shopifyCheckoutSheetKitModule;

  // Test constants for color configuration
  private static final String BACKGROUND_COLOR = "#FFFFFF";
  private static final String PROGRESS_INDICATOR = "#000000";
  private static final String HEADER_BACKGROUND_COLOR = "#FFFFFF";
  private static final String HEADER_TEXT_COLOR = "#000000";

  // Dark theme colors
  private static final String DARK_BACKGROUND_COLOR = "#000000";
  private static final String DARK_PROGRESS_INDICATOR = "#FFFFFF";
  private static final String DARK_HEADER_BACKGROUND_COLOR = "#000000";
  private static final String DARK_HEADER_TEXT_COLOR = "#FFFFFF";

  @Before
  public void setup() {
    when(mockReactContext.getCurrentActivity()).thenReturn(mockComponentActivity);
    when(mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class))
        .thenReturn(mockEventEmitter);
    shopifyCheckoutSheetKitModule = new ShopifyCheckoutSheetKitModule(mockReactContext);
  }

  /**
   * Core Methods
   */

  @Test
  public void testCanPresentCheckout() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutSheetKitModule.present(checkoutUrl);

      verify(mockComponentActivity).runOnUiThread(runnableCaptor.capture());
      runnableCaptor.getValue().run();

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.present(eq(checkoutUrl), any(), any());
      });
    }
  }

  @Test
  public void testCanPreloadCheckout() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutSheetKitModule.preload(checkoutUrl);

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.preload(eq(checkoutUrl), any());
      });
    }
  }

  /**
   * Module name and version
   */

  @Test
  public void testModuleName() {
    assertThat(shopifyCheckoutSheetKitModule.getName())
        .isEqualTo("ShopifyCheckoutSheetKit");
  }

  @Test
  public void testConstants() {
    assertThat(shopifyCheckoutSheetKitModule.getConstants())
        .isNotNull()
        .containsKey("version");
  }

  /**
   * Configuration
   */

  @Test
  public void testHasCorrectDefaultConfiguration() {
    // Test that the module starts with sensible defaults
    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading().getEnabled())
        .isTrue();

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("automatic");
  }

  @Test
  public void testCanDisablePreloading() {
    JavaOnlyMap config = new JavaOnlyMap();
    config.putBoolean("preloading", false);

    shopifyCheckoutSheetKitModule.setConfig(config);

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading().getEnabled())
        .isFalse();
  }

  @Test
  public void testCanSetDarkColorScheme() {
    JavaOnlyMap config = new JavaOnlyMap();
    config.putString("colorScheme", "dark");

    shopifyCheckoutSheetKitModule.setConfig(config);

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("dark");
  }

  @Test
  public void testCanConfigureLightColorSchemeWithValidColors() {
    JavaOnlyMap androidColors = createValidLightColors();
    JavaOnlyMap config = createConfigWithAndroidColors("light", androidColors);

    shopifyCheckoutSheetKitModule.setConfig(config);

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("light");
  }

  @Test
  public void testCanConfigureDarkColorSchemeWithValidColors() {
    JavaOnlyMap androidColors = createValidDarkColors();
    JavaOnlyMap config = createConfigWithAndroidColors("dark", androidColors);

    shopifyCheckoutSheetKitModule.setConfig(config);

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("dark");
  }

  @Test
  public void testCanConfigureAutomaticColorSchemeWithLightAndDarkColors() {
    JavaOnlyMap lightColors = createValidLightColors();
    JavaOnlyMap darkColors = createValidDarkColors();

    JavaOnlyMap androidColors = new JavaOnlyMap();
    androidColors.putMap("light", lightColors);
    androidColors.putMap("dark", darkColors);

    JavaOnlyMap colorsConfig = new JavaOnlyMap();
    colorsConfig.putMap("android", androidColors);

    JavaOnlyMap config = new JavaOnlyMap();
    config.putString("colorScheme", "automatic");
    config.putMap("colors", colorsConfig);

    shopifyCheckoutSheetKitModule.setConfig(config);

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("automatic");
  }

  @Test
  public void testInvalidColorConfigurationFallsBackToBasicScheme() {
    JavaOnlyMap androidColors = new JavaOnlyMap();
    androidColors.putString("backgroundColor", "invalid-color");
    androidColors.putString("progressIndicator", PROGRESS_INDICATOR);
    androidColors.putString("headerBackgroundColor", HEADER_BACKGROUND_COLOR);
    androidColors.putString("headerTextColor", HEADER_TEXT_COLOR);

    JavaOnlyMap config = createConfigWithAndroidColors("light", androidColors);

    // Should not throw exception
    shopifyCheckoutSheetKitModule.setConfig(config);

    // Should fall back to basic light scheme without custom colors
    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("light");
  }

  @Test
  public void testPartialColorConfigurationIsRejected() {
    JavaOnlyMap androidColors = new JavaOnlyMap();
    androidColors.putString("backgroundColor", BACKGROUND_COLOR);
    // Missing other required colors

    JavaOnlyMap config = createConfigWithAndroidColors("light", androidColors);

    shopifyCheckoutSheetKitModule.setConfig(config);

    // Should fall back to basic scheme since colors are incomplete
    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("light");
  }

  @Test
  public void testCanSetConfigWithCloseButtonColor() {
    JavaOnlyMap androidColors = createValidLightColors();
    androidColors.putString("closeButtonColor", "#FF0000");

    JavaOnlyMap config = createConfigWithAndroidColors("light", androidColors);

    shopifyCheckoutSheetKitModule.setConfig(config);

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("light");
  }

  @Test
  public void testCanSetConfigWithMissingCloseButtonColor() {
    // Missing closeButtonColor - should not crash
    JavaOnlyMap androidColors = createValidLightColors();
    JavaOnlyMap config = createConfigWithAndroidColors("light", androidColors);

    shopifyCheckoutSheetKitModule.setConfig(config);

    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("light");
  }

  @Test
  public void testCanSetConfigWithInvalidCloseButtonColor() {
    JavaOnlyMap androidColors = createValidLightColors();
    androidColors.putString("closeButtonColor", "invalid-color");
    JavaOnlyMap config = createConfigWithAndroidColors("light", androidColors);

    // The method should not throw an exception when given invalid close button color
    shopifyCheckoutSheetKitModule.setConfig(config);

    // Verify the color scheme was set correctly despite invalid close button color
    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("light");
  }

  /**
   * Events
   */

  @Test
  public void testCanProcessStandardPixelEvents() {
    CustomCheckoutEventProcessor processor = new CustomCheckoutEventProcessor(mockContext, mockReactContext);

    PixelEvent standardEvent = new StandardPixelEvent(
        "test-id",
        "page_viewed",
        "2023-01-01T00:00:00Z",
        EventType.STANDARD,
        null,
        null
    );

    processor.onWebPixelEvent(standardEvent);

    verify(mockEventEmitter).emit(eq("pixel"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("test-id", "page_viewed", "STANDARD");
  }

  @Test
  public void testCanProcessCustomPixelEvents() {
    CustomCheckoutEventProcessor processor = new CustomCheckoutEventProcessor(mockContext, mockReactContext);

    PixelEvent customEvent = new CustomPixelEvent(
        "custom-id",
        "custom_event",
        "2023-01-01T00:00:00Z",
        EventType.CUSTOM,
        null,
        "{\"customAttribute\":\"value\"}"
    );

    processor.onWebPixelEvent(customEvent);

    verify(mockEventEmitter).emit(eq("pixel"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("custom-id", "custom_event", "CUSTOM", "customAttribute");
  }

  @Test
  public void testCanProcessCheckoutCompletedEvents() {
    CustomCheckoutEventProcessor processor = new CustomCheckoutEventProcessor(mockContext, mockReactContext);

    CartInfo cartInfo = new CartInfo(new ArrayList<>(), new Price(), "cart-token");
    OrderDetails orderDetails = new OrderDetails(
        null, // billingAddress
        cartInfo,
        new ArrayList<>(), // deliveries
        "test@example.com", // email
        "order-123", // id
        new ArrayList<>(), // paymentMethods
        "+1234567890" // phone
    );

    CheckoutCompletedEvent completedEvent = new CheckoutCompletedEvent(orderDetails);

    processor.onCheckoutCompleted(completedEvent);

    verify(mockEventEmitter).emit(eq("completed"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("order-123", "test@example.com", "cart-token");
  }

  /**
   * Errors
   */

  @Test
  public void testCanProcessCheckoutExpiredErrors() {
    CustomCheckoutEventProcessor processor = new CustomCheckoutEventProcessor(mockContext, mockReactContext);

    // Use minimal mocking - just enough to test the processing logic
    CheckoutExpiredException mockException = mock(CheckoutExpiredException.class);
    when(mockException.getErrorDescription()).thenReturn("Cart has expired");
    when(mockException.getErrorCode()).thenReturn("cart_expired");
    when(mockException.isRecoverable()).thenReturn(false);

    processor.onCheckoutFailed(mockException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("CheckoutExpiredError", "Cart has expired", "cart_expired", "\"recoverable\":false");
  }

  @Test
  public void testCanProcessClientErrors() {
    CustomCheckoutEventProcessor processor = new CustomCheckoutEventProcessor(mockContext, mockReactContext);

    ClientException mockException = mock(ClientException.class);
    when(mockException.getErrorDescription()).thenReturn("Customer account required");
    when(mockException.getErrorCode()).thenReturn("customer_account_required");
    when(mockException.isRecoverable()).thenReturn(true);

    processor.onCheckoutFailed(mockException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("CheckoutClientError", "Customer account required", "customer_account_required", "\"recoverable\":true");
  }

  @Test
  public void testCanProcessHttpErrors() {
    CustomCheckoutEventProcessor processor = new CustomCheckoutEventProcessor(mockContext, mockReactContext);

    HttpException mockException = mock(HttpException.class);
    when(mockException.getErrorDescription()).thenReturn("Not Found");
    when(mockException.getErrorCode()).thenReturn("http_error");
    when(mockException.isRecoverable()).thenReturn(false);
    when(mockException.getStatusCode()).thenReturn(404);

    processor.onCheckoutFailed(mockException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("CheckoutHTTPError", "Not Found", "http_error", "\"statusCode\":404", "\"recoverable\":false");
  }

  /**
   * Integration
   */

  @Test
  public void testCompleteConfigurationAndEventFlow() {
    // Set up configuration
    JavaOnlyMap config = new JavaOnlyMap();
    config.putBoolean("preloading", true);
    config.putString("colorScheme", "dark");

    shopifyCheckoutSheetKitModule.setConfig(config);

    // Verify configuration was applied
    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading().getEnabled())
        .isTrue();
    assertThat(ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId())
        .isEqualTo("dark");

    // Test event processing with the configured module
    CustomCheckoutEventProcessor processor = new CustomCheckoutEventProcessor(mockContext, mockReactContext);

    PixelEvent event = new StandardPixelEvent("test", "page_viewed", "timestamp", EventType.STANDARD, null, null);
    processor.onWebPixelEvent(event);

    verify(mockEventEmitter).emit(eq("pixel"), any(String.class));
  }

  /**
   * Helpers
   */

  private JavaOnlyMap createValidLightColors() {
    JavaOnlyMap colors = new JavaOnlyMap();
    colors.putString("backgroundColor", BACKGROUND_COLOR);
    colors.putString("progressIndicator", PROGRESS_INDICATOR);
    colors.putString("headerBackgroundColor", HEADER_BACKGROUND_COLOR);
    colors.putString("headerTextColor", HEADER_TEXT_COLOR);
    return colors;
  }

  private JavaOnlyMap createValidDarkColors() {
    JavaOnlyMap colors = new JavaOnlyMap();
    colors.putString("backgroundColor", DARK_BACKGROUND_COLOR);
    colors.putString("progressIndicator", DARK_PROGRESS_INDICATOR);
    colors.putString("headerBackgroundColor", DARK_HEADER_BACKGROUND_COLOR);
    colors.putString("headerTextColor", DARK_HEADER_TEXT_COLOR);
    return colors;
  }

  private JavaOnlyMap createConfigWithAndroidColors(String colorScheme, JavaOnlyMap androidColors) {
    JavaOnlyMap colorsConfig = new JavaOnlyMap();
    colorsConfig.putMap("android", androidColors);

    JavaOnlyMap config = new JavaOnlyMap();
    config.putString("colorScheme", colorScheme);
    config.putMap("colors", colorsConfig);
    return config;
  }
}
