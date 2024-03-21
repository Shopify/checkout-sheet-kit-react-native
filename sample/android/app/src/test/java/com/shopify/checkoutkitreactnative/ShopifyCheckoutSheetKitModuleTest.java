package com.shopify.checkoutkitreactnative;

import androidx.activity.ComponentActivity;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
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

    System.out.print(stringCaptor.getValue());
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
}
