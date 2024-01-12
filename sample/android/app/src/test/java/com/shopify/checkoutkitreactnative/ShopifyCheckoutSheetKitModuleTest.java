package com.shopify.checkoutkitreactnative;

import androidx.activity.ComponentActivity;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.shopify.checkoutsheetkit.ShopifyCheckoutSheetKit;
import com.shopify.reactnative.checkoutsheetkit.ShopifyCheckoutSheetKitModule;

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

@RunWith(MockitoJUnitRunner.class)
public class ShopifyCheckoutSheetKitModuleTest {
  @Mock
  private ReactApplicationContext mockReactContext;

  @Mock
  private ComponentActivity mockComponentActivity;

  @Captor
  ArgumentCaptor<Runnable> runnableCaptor;

  private ShopifyCheckoutSheetKitModule shopifyCheckoutSheetKitModule;

  @Before
  public void setup() {
    when(mockReactContext.getCurrentActivity()).thenReturn(mockComponentActivity);
    shopifyCheckoutSheetKitModule = new ShopifyCheckoutSheetKitModule(mockReactContext);
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
    assertFalse(ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading().getEnabled());

    JavaOnlyMap updatedConfig = new JavaOnlyMap();
    updatedConfig.putBoolean("preloading", true);
    updatedConfig.putString("colorScheme", "dark");
    shopifyCheckoutSheetKitModule.setConfig(updatedConfig);

    boolean preloadingEnabled = ShopifyCheckoutSheetKitModule.checkoutConfig.getPreloading().getEnabled();
    String colorScheme = ShopifyCheckoutSheetKitModule.checkoutConfig.getColorScheme().getId();

    assertTrue(preloadingEnabled);
    assertEquals(colorScheme, "dark");
  }
}
