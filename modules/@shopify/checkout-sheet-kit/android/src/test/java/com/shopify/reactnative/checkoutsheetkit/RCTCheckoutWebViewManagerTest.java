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

package com.shopify.reactnative.checkoutsheetkit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

import android.app.Activity;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;

import java.util.Map;

@RunWith(MockitoJUnitRunner.Silent.class)
public class RCTCheckoutWebViewManagerTest {
    @Mock
    private ThemedReactContext mockContext;
    @Mock
    private ReactApplicationContext mockReactAppContext;
    @Mock
    private Activity mockActivity;
    @Mock
    private RCTCheckoutWebView mockView;
    @Mock
    private ReadableArray mockArgs;
    @Mock
    private EventDispatcher mockEventDispatcher;

    private RCTCheckoutWebViewManager manager;
    private MockedStatic<Looper> mockedLooper;
    private MockedStatic<UIManagerHelper> mockedUIManagerHelper;
    private MockedStatic<Arguments> mockedArguments;
    private MockedStatic<Log> mockedLog;

    @Before
    public void setup() {
        mockedLooper = Mockito.mockStatic(Looper.class);
        Looper mockMainLooper = mock(Looper.class);
        mockedLooper.when(Looper::getMainLooper).thenReturn(mockMainLooper);

        mockedUIManagerHelper = Mockito.mockStatic(UIManagerHelper.class);
        mockedUIManagerHelper.when(() -> UIManagerHelper.getEventDispatcherForReactTag(any(), anyInt()))
            .thenReturn(mockEventDispatcher);
        mockedUIManagerHelper.when(() -> UIManagerHelper.getSurfaceId(any(ReactApplicationContext.class)))
            .thenReturn(1);

        mockedArguments = Mockito.mockStatic(Arguments.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mock(WritableMap.class));

        mockedLog = Mockito.mockStatic(Log.class);
        mockedLog.when(() -> Log.d(any(), any())).thenReturn(0);
        mockedLog.when(() -> Log.e(any(), any())).thenReturn(0);
        mockedLog.when(() -> Log.e(any(), any(), any())).thenReturn(0);
        mockedLog.when(() -> Log.w(any(), any(String.class))).thenReturn(0);

        when(mockContext.getCurrentActivity()).thenReturn(mockActivity);
        when(mockContext.getReactApplicationContext()).thenReturn(mockReactAppContext);

        manager = new RCTCheckoutWebViewManager();
    }

    @After
    public void tearDown() {
        mockedLooper.close();
        mockedUIManagerHelper.close();
        mockedArguments.close();
        mockedLog.close();
    }

    // MARK: - Basic Operations Tests

    @Test
    public void testGetName_returnsRCTCheckoutWebView() {
        String name = manager.getName();

        assertThat(name).isEqualTo("RCTCheckoutWebView");
    }

    @Test
    public void testCreateViewInstance_returnsNewRCTCheckoutWebView() {
        try (MockedConstruction<RCTCheckoutWebView> mocked = mockConstruction(RCTCheckoutWebView.class)) {
            RCTCheckoutWebView view = manager.createViewInstance(mockContext);

            assertThat(view).isNotNull();
            assertThat(mocked.constructed()).hasSize(1);
        }
    }

    // MARK: - Props Tests

    @Test
    public void testSetCheckoutUrl_delegatesToView() {
        String url = "https://shop.example.com/checkout";

        manager.setCheckoutUrl(mockView, url);

        verify(mockView).setCheckoutUrl(url);
    }

    @Test
    public void testSetCheckoutUrl_withNull_delegatesToView() {
        manager.setCheckoutUrl(mockView, null);

        verify(mockView).setCheckoutUrl(null);
    }

    @Test
    public void testSetAuth_delegatesToView() {
        String authToken = "auth-token-123";

        manager.setAuth(mockView, authToken);

        verify(mockView).setAuth(authToken);
    }

    @Test
    public void testSetAuth_withNull_delegatesToView() {
        manager.setAuth(mockView, null);

        verify(mockView).setAuth(null);
    }

    // MARK: - Commands Tests

    @Test
    public void testReceiveCommand_reload_callsViewReload() {
        manager.receiveCommand(mockView, "reload", null);

        verify(mockView).reload();
    }

    @Test
    public void testReceiveCommand_respondToEvent_withValidArgs_delegatesToView() {
        when(mockArgs.size()).thenReturn(2);
        when(mockArgs.getString(0)).thenReturn("event-123");
        when(mockArgs.getString(1)).thenReturn("{\"key\": \"value\"}");

        manager.receiveCommand(mockView, "respondToEvent", mockArgs);

        verify(mockView).respondToEvent("event-123", "{\"key\": \"value\"}");
    }

    @Test
    public void testReceiveCommand_respondToEvent_withNullArgs_logsError() {
        manager.receiveCommand(mockView, "respondToEvent", null);

        verify(mockView, never()).respondToEvent(any(), any());
        mockedLog.verify(() -> Log.e(any(), eq("respondToEvent command requires eventId and responseData arguments")));
    }

    @Test
    public void testReceiveCommand_respondToEvent_withInsufficientArgs_logsError() {
        when(mockArgs.size()).thenReturn(1);

        manager.receiveCommand(mockView, "respondToEvent", mockArgs);

        verify(mockView, never()).respondToEvent(any(), any());
        mockedLog.verify(() -> Log.e(any(), eq("respondToEvent command requires eventId and responseData arguments")));
    }

    @Test
    public void testReceiveCommand_unknownCommand_logsError() {
        manager.receiveCommand(mockView, "unknownCommand", null);

        mockedLog.verify(() -> Log.e(any(), eq("Unsupported command: unknownCommand")));
    }

    // MARK: - Event Export Tests

    @Test
    public void testGetExportedCustomDirectEventTypeConstants_includesAllEventTypes() {
        Map<String, Object> events = manager.getExportedCustomDirectEventTypeConstants();

        assertThat(events)
            .isNotNull()
            .containsKeys(
                "onStart",
                "onComplete",
                "onFail",
                "onCancel",
                "onLinkClick",
                "onAddressChangeStart",
                "onPaymentMethodChangeStart",
                "onSubmitStart"
            );
    }

    @Test
    public void testGetExportedCustomDirectEventTypeConstants_hasCorrectRegistrationNames() {
        Map<String, Object> events = manager.getExportedCustomDirectEventTypeConstants();

        @SuppressWarnings("unchecked")
        Map<String, String> onStartEvent = (Map<String, String>) events.get("onStart");
        assertThat(onStartEvent).containsEntry("registrationName", "onStart");

        @SuppressWarnings("unchecked")
        Map<String, String> onCompleteEvent = (Map<String, String>) events.get("onComplete");
        assertThat(onCompleteEvent).containsEntry("registrationName", "onComplete");
    }

    // MARK: - Lifecycle Tests

    @Test
    public void testOnDropViewInstance_setsCheckoutUrlToNull() {
        manager.onDropViewInstance(mockView);

        verify(mockView).setCheckoutUrl(null);
    }
}
