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
import com.shopify.checkoutsheetkit.pixelevents.*;
import com.shopify.checkoutsheetkit.lifecycleevents.*;
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.*;

import android.content.Context;

import java.util.ArrayList;

@RunWith(MockitoJUnitRunner.class)
public class ShopifyCheckoutSheetKitModuleTest {
  @Mock
  private Context context;

  @Mock
  private ReactApplicationContext mockReactContext;

  @Mock
  private ComponentActivity mockComponentActivity;

  @Captor
  ArgumentCaptor<Runnable> runnableCaptor;

  private ShopifyCheckoutSheetKitModule shopifyCheckoutSheetKitModule;

  @Mock
  private DeviceEventManagerModule.RCTDeviceEventEmitter mockEventEmitter;

  @Mock
  private PixelEvent mockPixelEvent;

  private CustomCheckoutEventProcessor customCheckoutEventProcessor;

  @Captor
  private ArgumentCaptor<String> stringCaptor;

  @Mock
  private CheckoutExpiredException mockCheckoutExpiredException;
  @Mock
  private ClientException mockClientException;
  @Mock
  private HttpException mockHttpException;
  @Mock
  private ConfigurationException mockConfigurationException;
  @Mock
  private CheckoutSheetKitException mockCheckoutSheetKitException;
  @Mock
  private CheckoutException mockCheckoutException;

  @Before
  public void setup() {
    when(mockReactContext.getCurrentActivity()).thenReturn(mockComponentActivity);
    when(mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)).thenReturn(mockEventEmitter);
    shopifyCheckoutSheetKitModule = new ShopifyCheckoutSheetKitModule(mockReactContext);
    customCheckoutEventProcessor = new CustomCheckoutEventProcessor(context, mockReactContext);
  }

  @Test
  public void callsPresentWithCheckoutURL() {
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
  public void callsPreloadWithCheckoutURL() {
    try (MockedStatic<ShopifyCheckoutSheetKit> mockedShopifyCheckoutSheetKit = Mockito
        .mockStatic(ShopifyCheckoutSheetKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutSheetKitModule.preload(checkoutUrl);

      mockedShopifyCheckoutSheetKit.verify(() -> {
        ShopifyCheckoutSheetKit.preload(eq(checkoutUrl), any());
      });
    }
  }

  @Test
  public void setsInternalConfig() {
    assertTrue(ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading().getEnabled());

    JavaOnlyMap updatedConfig = new JavaOnlyMap();
    updatedConfig.putBoolean("preloading", false);
    updatedConfig.putString("colorScheme", "dark");
    shopifyCheckoutSheetKitModule.setConfig(updatedConfig);

    boolean preloadingEnabled = ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading().getEnabled();
    String colorScheme = ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId();

    assertFalse(preloadingEnabled);
    assertEquals(colorScheme, "dark");
  }

  @Test
  public void sendsStandardPixelEventOnWebPixelEvent() {
    PixelEvent event = new StandardPixelEvent(
      "test",
      "page_viewed",
      "timestamp",
      EventType.STANDARD,
      null,
      null
    );

    customCheckoutEventProcessor.onWebPixelEvent(event);

    verify(mockEventEmitter).emit(eq("pixel"), stringCaptor.capture());

    assertTrue(stringCaptor.getValue().contains("{\"id\":\"test\",\"name\":\"page_viewed\",\"timestamp\":\"timestamp\",\"type\":\"STANDARD\",\"context\":null,\"data\":null}"));
  }

  @Test
  public void sendsCustomPixelEventOnWebPixelEvent() {
    PixelEvent event = new CustomPixelEvent(
      "test",
      "custom",
      "timestamp",
      EventType.CUSTOM,
      null,
      "\\{\"customAttribute\":123\\}"
    );

    customCheckoutEventProcessor.onWebPixelEvent(event);

    verify(mockEventEmitter).emit(eq("pixel"), stringCaptor.capture());

    assertTrue(stringCaptor.getValue().contains("\"id\":\"test\",\"name\":\"custom\",\"timestamp\":\"timestamp\",\"type\":\"CUSTOM\",\"context\":null,\"customData\":\"\\\\{\\\"customAttribute\\\":123\\\\}\""));
  }

  @Test
  public void sendsCompletedEvent() {
    CheckoutCompletedEvent event = new CheckoutCompletedEvent(
        new OrderDetails(
          null,
          new CartInfo(new ArrayList<>(), new Price(), ""),
          new ArrayList<>(),
          null,
          "test",
          new ArrayList<>(),
          null
        )
      );

    customCheckoutEventProcessor.onCheckoutCompleted(event);

    verify(mockEventEmitter).emit(eq("completed"), stringCaptor.capture());

    assertTrue(stringCaptor.getValue().contains("{\"orderDetails\":{\"billingAddress\":null,\"cart\":{\"lines\":[],\"price\":{\"discounts\":[],\"shipping\":null,\"subtotal\":null,\"taxes\":null,\"total\":null},\"token\":\"\"},\"deliveries\":[],\"email\":null,\"id\":\"test\",\"paymentMethods\":[],\"phone\":null}}"));
  }

  @Test
  public void sendsCheckoutExpiredErrorEventOnCheckoutFailed() {
    when(mockCheckoutExpiredException.getErrorDescription()).thenReturn("Cart expired");
    when(mockCheckoutExpiredException.getErrorCode()).thenReturn("cart_expired");
    when(mockCheckoutExpiredException.isRecoverable()).thenReturn(false);

    customCheckoutEventProcessor.onCheckoutFailed(mockCheckoutExpiredException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    String capturedString = stringCaptor.getValue();

    assertTrue(capturedString.contains("\"__typename\":\"CheckoutExpiredError\""));
    assertTrue(capturedString.contains("\"message\":\"Cart expired\""));
    assertTrue(capturedString.contains("\"code\":\"cart_expired\""));
    assertTrue(capturedString.contains("\"recoverable\":false"));
  }

  @Test
  public void sendsClientErrorEventOnCheckoutFailed() {
    when(mockClientException.getErrorDescription()).thenReturn("Client Error");
    when(mockClientException.getErrorCode()).thenReturn("customer_account_required");
    when(mockClientException.isRecoverable()).thenReturn(true);

    customCheckoutEventProcessor.onCheckoutFailed(mockClientException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());
    String capturedString = stringCaptor.getValue();
    assertTrue(capturedString.contains("\"__typename\":\"CheckoutClientError\""));
    assertTrue(capturedString.contains("\"message\":\"Client Error\""));
    assertTrue(capturedString.contains("\"code\":\"customer_account_required\""));
    assertTrue(capturedString.contains("\"recoverable\":true"));
  }

  @Test
  public void sendsHttpErrorEventOnCheckoutFailed() {
    when(mockHttpException.getErrorDescription()).thenReturn("Not Found");
    when(mockHttpException.isRecoverable()).thenReturn(false);
    when(mockHttpException.getStatusCode()).thenReturn(404);
    when(mockHttpException.getErrorCode()).thenReturn("http_error");

    customCheckoutEventProcessor.onCheckoutFailed(mockHttpException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    String capturedString = stringCaptor.getValue();

    System.out.println(capturedString);

    assertTrue(capturedString.contains("\"__typename\":\"CheckoutHTTPError\""));
    assertTrue(capturedString.contains("\"message\":\"Not Found\""));
    assertTrue(capturedString.contains("\"code\":\"http_error\""));
    assertTrue(capturedString.contains("\"statusCode\":404"));
    assertTrue(capturedString.contains("\"recoverable\":false"));
  }

  @Test
  public void sendsConfigurationErrorEventOnCheckoutFailed() {
    when(mockConfigurationException.getErrorDescription()).thenReturn("Invalid Configuration");
    when(mockConfigurationException.getErrorCode()).thenReturn("storefront_password_required");
    when(mockConfigurationException.isRecoverable()).thenReturn(false);

    customCheckoutEventProcessor.onCheckoutFailed(mockConfigurationException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    String capturedString = stringCaptor.getValue();

    assertTrue(capturedString.contains("\"__typename\":\"ConfigurationError\""));
    assertTrue(capturedString.contains("\"message\":\"Invalid Configuration\""));
    assertTrue(capturedString.contains("\"code\":\"storefront_password_required\""));
    assertTrue(capturedString.contains("\"recoverable\":false"));
  }

  @Test
  public void sendsInternalErrorEventOnCheckoutFailed() {
    when(mockCheckoutSheetKitException.getErrorDescription()).thenReturn("Internal SDK Error");
    when(mockCheckoutSheetKitException.getErrorCode()).thenReturn("render_process_gone");
    when(mockCheckoutSheetKitException.isRecoverable()).thenReturn(true);

    customCheckoutEventProcessor.onCheckoutFailed(mockCheckoutSheetKitException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    String capturedString = stringCaptor.getValue();

    assertTrue(capturedString.contains("\"__typename\":\"InternalError\""));
    assertTrue(capturedString.contains("\"message\":\"Internal SDK Error\""));
    assertTrue(capturedString.contains("\"code\":\"render_process_gone\""));
    assertTrue(capturedString.contains("\"recoverable\":true"));
  }

  @Test
  public void sendsGeneralErrorEventOnCheckoutFailed() {
    when(mockCheckoutException.getErrorDescription()).thenReturn("General Checkout Error");
    when(mockCheckoutException.getErrorCode()).thenReturn("unknown");
    when(mockCheckoutException.isRecoverable()).thenReturn(true);

    customCheckoutEventProcessor.onCheckoutFailed(mockCheckoutException);

    verify(mockEventEmitter).emit(eq("error"), stringCaptor.capture());

    String capturedString = stringCaptor.getValue();

    assertTrue(capturedString.contains("\"__typename\":\"UnknownError\""));
    assertTrue(capturedString.contains("\"message\":\"General Checkout Error\""));
    assertTrue(capturedString.contains("\"code\":\"unknown\""));
    assertTrue(capturedString.contains("\"recoverable\":true"));
  }
}
