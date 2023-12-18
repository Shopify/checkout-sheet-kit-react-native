package com.shopify.checkoutkitreactnative;

import androidx.activity.ComponentActivity;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.shopify.checkoutkit.ShopifyCheckoutKit;
import com.shopify.reactnative.checkoutkit.ShopifyCheckoutKitModule;

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
public class ShopifyCheckoutKitModuleTest {
  @Mock
  private ReactApplicationContext mockReactContext;

  @Mock
  private ComponentActivity mockComponentActivity;

  @Captor
  ArgumentCaptor<Runnable> runnableCaptor;

  private ShopifyCheckoutKitModule shopifyCheckoutKitModule;

  @Before
  public void setup() {
    when(mockReactContext.getCurrentActivity()).thenReturn(mockComponentActivity);
    shopifyCheckoutKitModule = new ShopifyCheckoutKitModule(mockReactContext);
  }

  @Test
  public void callsPresentWithCheckoutURL() {
    try (MockedStatic<ShopifyCheckoutKit> mockedShopifyCheckoutKit = Mockito.mockStatic(ShopifyCheckoutKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutKitModule.present(checkoutUrl);

      verify(mockComponentActivity).runOnUiThread(runnableCaptor.capture());
      runnableCaptor.getValue().run();

      mockedShopifyCheckoutKit.verify(() -> {
        ShopifyCheckoutKit.present(eq(checkoutUrl), any(), any());
      });
    }
  }

  @Test
  public void callsPreloadWithCheckoutURL() {
    try (MockedStatic<ShopifyCheckoutKit> mockedShopifyCheckoutKit = Mockito.mockStatic(ShopifyCheckoutKit.class)) {
      String checkoutUrl = "https://shopify.com";
      shopifyCheckoutKitModule.preload(checkoutUrl);

      mockedShopifyCheckoutKit.verify(() -> {
        ShopifyCheckoutKit.preload(eq(checkoutUrl), any());
      });
    }
  }

  @Test
  public void setsInternalConfig() {
    assertFalse(ShopifyCheckoutKitModule.checkoutConfig.getPreloading().getEnabled());

    JavaOnlyMap updatedConfig = new JavaOnlyMap();
    updatedConfig.putBoolean("preloading", true);
    updatedConfig.putString("colorScheme", "dark");
    shopifyCheckoutKitModule.setConfig(updatedConfig);

    boolean preloadingEnabled = ShopifyCheckoutKitModule.checkoutConfig.getPreloading().getEnabled();
    String colorScheme = ShopifyCheckoutKitModule.checkoutConfig.getColorScheme().getId();

    assertTrue(preloadingEnabled);
    assertEquals(colorScheme, "dark");
  }
}
