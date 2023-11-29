package com.reactnative;

import androidx.activity.ComponentActivity;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.shopify.checkoutkit.ShopifyCheckoutKit;
import com.shopify.reactnative.checkoutkit.ShopifyCheckoutKitModule;
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

    @Test
    public void callsPresentWithCheckoutURL() {
      when(mockReactContext.getCurrentActivity()).thenReturn(mockComponentActivity);
      shopifyCheckoutKitModule = new ShopifyCheckoutKitModule(mockReactContext);

      try (MockedStatic<ShopifyCheckoutKit> mockedShopifyCheckoutKit  = Mockito.mockStatic(ShopifyCheckoutKit.class)) {
        String checkoutUrl = "https://shopify.com";
        shopifyCheckoutKitModule.present(checkoutUrl);

        // run runOnUiThread function
        verify(mockComponentActivity).runOnUiThread(runnableCaptor.capture());
        runnableCaptor.getValue().run();

        // verify checkout kit was called
        mockedShopifyCheckoutKit.verify(() -> {
          ShopifyCheckoutKit.present(eq(checkoutUrl), any(), any());
        });
      }
    }

    @Test
    public void callsPreloadWithCheckoutURL() {
      when(mockReactContext.getCurrentActivity()).thenReturn(mockComponentActivity);
      shopifyCheckoutKitModule = new ShopifyCheckoutKitModule(mockReactContext);

      try (MockedStatic<ShopifyCheckoutKit> mockedShopifyCheckoutKit  = Mockito.mockStatic(ShopifyCheckoutKit.class)) {
        String checkoutUrl = "https://shopify.com";
        shopifyCheckoutKitModule.preload(checkoutUrl);

        // verify checkout kit was called
        mockedShopifyCheckoutKit.verify(() -> {
          ShopifyCheckoutKit.preload(eq(checkoutUrl), any());
        });
      }
    }

  @Test
  public void configuresInternalConfig() {
//    when(mockReactContext.getCurrentActivity()).thenReturn(mockComponentActivity);
    shopifyCheckoutKitModule = new ShopifyCheckoutKitModule(mockReactContext);

    assertFalse(ShopifyCheckoutKitModule.checkoutConfig.getPreloading().getEnabled());

    JavaOnlyMap updatedConfig = new JavaOnlyMap();
    updatedConfig.putBoolean("preloading", true);
    updatedConfig.putString("colorScheme", "dark");
    shopifyCheckoutKitModule.configure(updatedConfig);

    boolean preloadingEnabled = ShopifyCheckoutKitModule.checkoutConfig.getPreloading().getEnabled();
    String colorScheme = ShopifyCheckoutKitModule.checkoutConfig.getColorScheme().getId();

    assertTrue(preloadingEnabled);
    assertEquals(colorScheme, "dark");
  }
}
