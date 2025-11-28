package com.shopify.checkoutkitreactnative;

import static com.shopify.checkoutkitreactnative.TestFixtures.createTestCart;

import androidx.activity.ComponentActivity;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.shopify.checkoutsheetkit.CheckoutExpiredException;
import com.shopify.checkoutsheetkit.ClientException;
import com.shopify.checkoutsheetkit.HttpException;
import com.shopify.checkoutsheetkit.ShopifyCheckoutSheetKit;
import com.shopify.checkoutsheetkit.Preloading;
import com.shopify.checkoutsheetkit.ColorScheme;
import com.shopify.checkoutsheetkit.Authentication;
import com.shopify.checkoutsheetkit.lifecycleevents.CartPaymentInstrument;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompleteEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutStartEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.Cart;
import com.shopify.checkoutsheetkit.lifecycleevents.CartCost;
import com.shopify.checkoutsheetkit.lifecycleevents.CartBuyerIdentity;
import com.shopify.checkoutsheetkit.lifecycleevents.CartDelivery;
import com.shopify.checkoutsheetkit.lifecycleevents.Money;
import com.shopify.checkoutsheetkit.lifecycleevents.OrderConfirmation;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutAddressChangeStart;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutAddressChangeStartEvent;
import com.shopify.reactnative.checkoutsheetkit.ShopifyCheckoutSheetKitModule;
import com.shopify.reactnative.checkoutsheetkit.SheetCheckoutEventProcessor;

import org.junit.After;
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
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;

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

  // Store initial configuration to restore after each test
  private Preloading initialPreloading;
  private ColorScheme initialColorScheme;

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

    // Capture initial configuration state to restore after each test
    initialPreloading = ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading();
    initialColorScheme = ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme();
  }

  @After
  public void tearDown() {
    // Reset configuration to initial state after each test
    ShopifyCheckoutSheetKit.configure(configuration -> {
      configuration.setPreloading(initialPreloading);
      configuration.setColorScheme(initialColorScheme);
      ShopifyCheckoutSheetKitModule.checkoutConfig = configuration;
    });
  }

  /**
   * Core Methods
   */

  @Test
  public void testCanPresentCheckout() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutSheetKitModule.present(checkoutUrl, null);

      verify(mockComponentActivity).runOnUiThread(runnableCaptor.capture());
      runnableCaptor.getValue().run();

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.present(eq(checkoutUrl), any(), any(), argThat(opt ->
          opt != null && opt.getAuthentication() instanceof Authentication.None
        ));
      });
    }
  }

  @Test
  public void testCanPreloadCheckout() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutSheetKitModule.preload(checkoutUrl, null);

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.preload(eq(checkoutUrl), any(), argThat(opt ->
          opt != null && opt.getAuthentication() instanceof Authentication.None
        ));
      });
    }
  }

  @Test
  public void testCanPresentCheckoutWithAuthenticationOptions() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";

      JavaOnlyMap authMap = new JavaOnlyMap();
      authMap.putString("token", "test-auth-token");

      JavaOnlyMap options = new JavaOnlyMap();
      options.putMap("authentication", authMap);

      shopifyCheckoutSheetKitModule.present(checkoutUrl, options);

      verify(mockComponentActivity).runOnUiThread(runnableCaptor.capture());
      runnableCaptor.getValue().run();

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.present(eq(checkoutUrl), any(), any(), argThat(opt ->
          opt != null && opt.getAuthentication() instanceof Authentication.Token &&
          ((Authentication.Token) opt.getAuthentication()).getValue().equals("test-auth-token")
        ));
      });
    }
  }

  @Test
  public void testCanPreloadCheckoutWithAuthenticationOptions() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";

      JavaOnlyMap authMap = new JavaOnlyMap();
      authMap.putString("token", "test-auth-token");

      JavaOnlyMap options = new JavaOnlyMap();
      options.putMap("authentication", authMap);

      shopifyCheckoutSheetKitModule.preload(checkoutUrl, options);

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.preload(eq(checkoutUrl), any(), argThat(opt ->
          opt != null && opt.getAuthentication() instanceof Authentication.Token &&
          ((Authentication.Token) opt.getAuthentication()).getValue().equals("test-auth-token")
        ));
      });
    }
  }

  @Test
  public void testCanPresentCheckoutWithNullOptions() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutSheetKitModule.present(checkoutUrl, null);

      verify(mockComponentActivity).runOnUiThread(runnableCaptor.capture());
      runnableCaptor.getValue().run();

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.present(eq(checkoutUrl), any(), any(), argThat(opt ->
          opt != null && opt.getAuthentication() instanceof Authentication.None
        ));
      });
    }
  }

  @Test
  public void testCanPreloadCheckoutWithNullOptions() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutSheetKitModule.preload(checkoutUrl, null);

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.preload(eq(checkoutUrl), any(), argThat(opt ->
          opt != null && opt.getAuthentication() instanceof Authentication.None
        ));
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
  public void testCanProcessCheckoutCompleteEvents() {
    SheetCheckoutEventProcessor processor = new SheetCheckoutEventProcessor(mockContext, mockReactContext);

    Cart cart = buildMinimalCart("cart-123", "100.00", "USD");

    OrderConfirmation orderConfirmation = new OrderConfirmation(
        null, // url
        new OrderConfirmation.Order("order-123"),
        "ORDER-123", // number
        false // isFirstOrder
    );

    CheckoutCompleteEvent completedEvent = new CheckoutCompleteEvent(orderConfirmation, cart);

    processor.onComplete(completedEvent);

    verify(mockEventEmitter).emit(eq("complete"), stringCaptor.capture());

    // Verify the JSON contains our test data
    assertThat(stringCaptor.getValue())
        .contains("order-123", "cart-123");
  }

  @Test
  public void testCanProcessCheckoutStartEvents() {
    SheetCheckoutEventProcessor processor = new SheetCheckoutEventProcessor(mockContext, mockReactContext);

    Cart cart = buildMinimalCart("cart-456", "75.00", "CAD");

    CheckoutStartEvent startedEvent = new CheckoutStartEvent(cart);

    processor.onStart(startedEvent);

    verify(mockEventEmitter).emit(eq("start"), stringCaptor.capture());

    // Verify the JSON contains our test data
    assertThat(stringCaptor.getValue())
        .contains("cart-456");
  }

  @Test
  public void testCanProcessCheckoutAddressChangeStartEvent() {
    SheetCheckoutEventProcessor processor = new SheetCheckoutEventProcessor(mockContext, mockReactContext);

    // Create a mock CheckoutAddressChangeStart event
    CheckoutAddressChangeStart addressChangeEvent = mock(CheckoutAddressChangeStart.class);
    when(addressChangeEvent.getId()).thenReturn("address-event-123");

    // Create a mock CheckoutAddressChangeStartEvent for params
    CheckoutAddressChangeStartEvent mockParams = mock(CheckoutAddressChangeStartEvent.class);
    when(mockParams.getAddressType()).thenReturn("shipping");

    when(addressChangeEvent.getParams()).thenReturn(mockParams);

    processor.onAddressChangeStart(addressChangeEvent);

    verify(mockEventEmitter).emit(eq("addressChangeStart"), stringCaptor.capture());

    // Verify the JSON contains expected fields
    String emittedJson = stringCaptor.getValue();
    assertThat(emittedJson)
        .contains("address-event-123")
        .contains("addressChangeStart")
        .contains("shipping");
  }

  /**
   * Errors
   */

  @Test
  public void testCanProcessCheckoutExpiredErrors() {
    SheetCheckoutEventProcessor processor = new SheetCheckoutEventProcessor(mockContext, mockReactContext);

    // Use minimal mocking - just enough to test the processing logic
    CheckoutExpiredException mockException = mock(CheckoutExpiredException.class);
    when(mockException.getErrorDescription()).thenReturn("Cart has expired");
    when(mockException.getErrorCode()).thenReturn("cart_expired");
    when(mockException.isRecoverable()).thenReturn(false);

    processor.onFail(mockException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("CheckoutExpiredError", "Cart has expired", "cart_expired", "\"recoverable\":false");
  }

  @Test
  public void testCanProcessClientErrors() {
    SheetCheckoutEventProcessor processor = new SheetCheckoutEventProcessor(mockContext, mockReactContext);

    ClientException mockException = mock(ClientException.class);
    when(mockException.getErrorDescription()).thenReturn("Customer account required");
    when(mockException.getErrorCode()).thenReturn("customer_account_required");
    when(mockException.isRecoverable()).thenReturn(true);

    processor.onFail(mockException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    assertThat(stringCaptor.getValue())
        .contains("CheckoutClientError", "Customer account required", "customer_account_required", "\"recoverable\":true");
  }

  @Test
  public void testCanProcessHttpErrors() {
    SheetCheckoutEventProcessor processor = new SheetCheckoutEventProcessor(mockContext, mockReactContext);

    HttpException mockException = mock(HttpException.class);
    when(mockException.getErrorDescription()).thenReturn("Not Found");
    when(mockException.getErrorCode()).thenReturn("http_error");
    when(mockException.isRecoverable()).thenReturn(false);
    when(mockException.getStatusCode()).thenReturn(404);

    processor.onFail(mockException);

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
  }

  /**
   * Helpers
   */

  private Cart buildMinimalCart(String cartId, String amount, String currencyCode) {
    return new Cart(
      cartId,
      new ArrayList<>(), // lines
      new CartCost(
        new Money(amount, currencyCode),
        new Money(amount, currencyCode)
      ),
      new CartBuyerIdentity(null, null, null, null),
      new ArrayList<>(), // deliveryGroups
      new ArrayList<>(), // discountCodes
      new ArrayList<>(), // appliedGiftCards
      new ArrayList<>(), // discountAllocations
      new CartDelivery(new ArrayList<>()),
      new ArrayList<>() { } // paymentInstruments
    );
  }

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
