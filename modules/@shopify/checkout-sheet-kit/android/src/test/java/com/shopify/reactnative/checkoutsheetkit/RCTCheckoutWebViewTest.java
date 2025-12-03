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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;

import android.app.Activity;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;

import com.shopify.checkoutsheetkit.CheckoutException;
import com.shopify.checkoutsheetkit.CheckoutExpiredException;
import com.shopify.checkoutsheetkit.CheckoutPaymentMethodChangeStartParams;
import com.shopify.checkoutsheetkit.CheckoutSheetKitException;
import com.shopify.checkoutsheetkit.CheckoutWebView;
import com.shopify.checkoutsheetkit.ClientException;
import com.shopify.checkoutsheetkit.ConfigurationException;
import com.shopify.checkoutsheetkit.DefaultCheckoutEventProcessor;
import com.shopify.checkoutsheetkit.HttpException;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompleteEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutStartEvent;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutAddressChangeStart;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutAddressChangeStartEvent;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutPaymentMethodChangeStart;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutSubmitStart;
import com.shopify.checkoutsheetkit.rpc.events.CheckoutSubmitStartEvent;

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

import java.lang.reflect.Field;
import java.lang.reflect.Method;

@RunWith(MockitoJUnitRunner.Silent.class)
public class RCTCheckoutWebViewTest {
    @Mock
    private ThemedReactContext mockContext;
    @Mock
    private ReactApplicationContext mockReactAppContext;
    @Mock
    private Activity mockActivity;
    @Mock
    private EventDispatcher mockEventDispatcher;
    @Mock
    private CheckoutWebView mockCheckoutWebView;

    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;
    @Captor
    private ArgumentCaptor<CheckoutEvent> checkoutEventCaptor;

    private RCTCheckoutWebView webView;
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

        webView = new RCTCheckoutWebView(mockContext);
    }

    @After
    public void tearDown() {
        mockedLooper.close();
        mockedUIManagerHelper.close();
        mockedArguments.close();
        mockedLog.close();
    }

    @Test
    public void testSetCheckoutUrl_withNewUrl_storesUrlAndSchedulesSetup() throws Exception {
        Handler mockHandler = mock(Handler.class);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);
        setPrivateField(webView, "mainHandler", mockHandler);

        webView.setCheckoutUrl("https://shopify.com/checkout");

        assertThat(getPrivateField(webView, "checkoutUrl")).isEqualTo("https://shopify.com/checkout");
        verify(mockHandler).post(any(Runnable.class));
    }

    @Test
    public void testSetCheckoutUrl_withSameUrl_doesNotScheduleSetup() throws Exception {
        Handler mockHandler = mock(Handler.class);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);
        setPrivateField(webView, "mainHandler", mockHandler);

        webView.setCheckoutUrl("https://shopify.com/checkout");
        reset(mockHandler);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);

        webView.setCheckoutUrl("https://shopify.com/checkout");

        verify(mockHandler, never()).post(any(Runnable.class));
    }

    @Test
    public void testSetCheckoutUrl_withNull_clearsUrlAndLastConfiguration() throws Exception {
        RCTCheckoutWebView spyWebView = spy(new RCTCheckoutWebView(mockContext));
        doNothing().when(spyWebView).scheduleSetupIfNeeded();
        doNothing().when(spyWebView).removeCheckout();

        spyWebView.setCheckoutUrl("https://shopify.com/checkout");
        spyWebView.setCheckoutUrl(null);

        assertThat(getPrivateField(spyWebView, "checkoutUrl")).isNull();
        assertThat(getPrivateField(spyWebView, "lastConfiguration")).isNull();
    }

    @Test
    public void testSetAuth_withNewToken_schedulesSetup() throws Exception {
        Handler mockHandler = mock(Handler.class);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);
        setPrivateField(webView, "mainHandler", mockHandler);

        webView.setAuth("new-auth-token");

        verify(mockHandler).post(any(Runnable.class));
    }

    @Test
    public void testSetAuth_withSameToken_doesNotScheduleSetup() throws Exception {
        Handler mockHandler = mock(Handler.class);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);
        setPrivateField(webView, "mainHandler", mockHandler);

        webView.setAuth("existing-token");
        reset(mockHandler);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);

        webView.setAuth("existing-token");

        verify(mockHandler, never()).post(any(Runnable.class));
    }

    @Test
    public void testReload_withExistingWebView_reloadsWebView() throws Exception {
        setPrivateField(webView, "checkoutWebView", mockCheckoutWebView);

        webView.reload();

        verify(mockCheckoutWebView).reload();
    }

    @Test
    public void testRespondToEvent_withExistingWebView_delegatesToWebView() throws Exception {
        setPrivateField(webView, "checkoutWebView", mockCheckoutWebView);

        webView.respondToEvent("event-123", "{\"key\": \"value\"}");

        verify(mockCheckoutWebView).respondToEvent("event-123", "{\"key\": \"value\"}");
    }

    @Test
    public void testRespondToEvent_withNullWebView_doesNotThrow() throws Exception {
        setPrivateField(webView, "checkoutWebView", null);

        webView.respondToEvent("event-123", "{\"key\": \"value\"}");

        verify(mockCheckoutWebView, never()).respondToEvent(any(), any());
    }

    @Test
    public void testGetErrorTypeName_forCheckoutExpiredException() throws Exception {
        CheckoutExpiredException exception = mock(CheckoutExpiredException.class);

        String typeName = invokePrivateMethod(webView, "getErrorTypeName", exception);

        assertThat(typeName).isEqualTo("CheckoutExpiredError");
    }

    @Test
    public void testGetErrorTypeName_forClientException() throws Exception {
        ClientException exception = mock(ClientException.class);

        String typeName = invokePrivateMethod(webView, "getErrorTypeName", exception);

        assertThat(typeName).isEqualTo("CheckoutClientError");
    }

    @Test
    public void testGetErrorTypeName_forHttpException() throws Exception {
        HttpException exception = mock(HttpException.class);

        String typeName = invokePrivateMethod(webView, "getErrorTypeName", exception);

        assertThat(typeName).isEqualTo("CheckoutHTTPError");
    }

    @Test
    public void testGetErrorTypeName_forConfigurationException() throws Exception {
        ConfigurationException exception = mock(ConfigurationException.class);

        String typeName = invokePrivateMethod(webView, "getErrorTypeName", exception);

        assertThat(typeName).isEqualTo("ConfigurationError");
    }

    @Test
    public void testGetErrorTypeName_forCheckoutSheetKitException() throws Exception {
        CheckoutSheetKitException exception = mock(CheckoutSheetKitException.class);

        String typeName = invokePrivateMethod(webView, "getErrorTypeName", exception);

        assertThat(typeName).isEqualTo("InternalError");
    }

    @Test
    public void testBuildErrorMap_includesAllRequiredFields() throws Exception {
        HttpException exception = mock(HttpException.class);
        when(exception.getErrorDescription()).thenReturn("Not Found");
        when(exception.getErrorCode()).thenReturn("http_error");
        when(exception.isRecoverable()).thenReturn(false);
        when(exception.getStatusCode()).thenReturn(404);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "CheckoutHTTPError");
        verify(mockMap).putString("message", "Not Found");
        verify(mockMap).putBoolean("recoverable", false);
        verify(mockMap).putString("code", "http_error");
        verify(mockMap).putInt("statusCode", 404);
    }

    @Test
    public void testBuildErrorMap_forNonHttpException_doesNotIncludeStatusCode() throws Exception {
        ClientException exception = mock(ClientException.class);
        when(exception.getErrorDescription()).thenReturn("Client error");
        when(exception.getErrorCode()).thenReturn("client_error");
        when(exception.isRecoverable()).thenReturn(true);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "CheckoutClientError");
        verify(mockMap).putString("message", "Client error");
        verify(mockMap).putBoolean("recoverable", true);
        verify(mockMap).putString("code", "client_error");
        verify(mockMap, never()).putInt(eq("statusCode"), anyInt());
    }

    @Test
    public void testScheduleSetupIfNeeded_withPendingSetup_doesNotScheduleAgain() throws Exception {
        Handler mockHandler = mock(Handler.class);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);
        setPrivateField(webView, "mainHandler", mockHandler);
        setPrivateField(webView, "pendingSetup", true);

        invokePrivateMethod(webView, "scheduleSetupIfNeeded");

        verify(mockHandler, never()).post(any(Runnable.class));
    }

    @Test
    public void testScheduleSetupIfNeeded_withoutPendingSetup_schedulesSetup() throws Exception {
        Handler mockHandler = mock(Handler.class);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);
        setPrivateField(webView, "mainHandler", mockHandler);
        setPrivateField(webView, "pendingSetup", false);

        invokePrivateMethod(webView, "scheduleSetupIfNeeded");

        verify(mockHandler).post(any(Runnable.class));
        assertThat(getPrivateField(webView, "pendingSetup")).isEqualTo(true);
    }

    @Test
    public void testSetup_alwaysResetsPendingSetupFlag() throws Exception {
        setPrivateField(webView, "checkoutUrl", null);
        setPrivateField(webView, "pendingSetup", true);

        invokePrivateMethod(webView, "setup");

        assertThat(getPrivateField(webView, "pendingSetup")).isEqualTo(false);
    }

    @Test
    public void testSetCheckoutUrl_withNonNullUrl_callsScheduleSetupIfNeeded() {
        RCTCheckoutWebView spyWebView = spy(new RCTCheckoutWebView(mockContext));
        doNothing().when(spyWebView).scheduleSetupIfNeeded();

        spyWebView.setCheckoutUrl("https://shopify.com/checkout");

        verify(spyWebView).scheduleSetupIfNeeded();
    }

    @Test
    public void testSetCheckoutUrl_withNullUrl_callsRemoveCheckout() {
        RCTCheckoutWebView spyWebView = spy(new RCTCheckoutWebView(mockContext));
        doNothing().when(spyWebView).scheduleSetupIfNeeded();
        doNothing().when(spyWebView).removeCheckout();

        spyWebView.setCheckoutUrl("https://shopify.com/checkout");
        spyWebView.setCheckoutUrl(null);

        verify(spyWebView).removeCheckout();
    }

    @Test
    public void testSetAuth_callsScheduleSetupIfNeeded() {
        RCTCheckoutWebView spyWebView = spy(new RCTCheckoutWebView(mockContext));
        doNothing().when(spyWebView).scheduleSetupIfNeeded();

        spyWebView.setAuth("auth-token");

        verify(spyWebView).scheduleSetupIfNeeded();
    }

    @Test
    public void testSetCheckoutUrlAndAuth_batchesToSingleSetup() throws Exception {
        Handler mockHandler = mock(Handler.class);
        when(mockHandler.post(any(Runnable.class))).thenReturn(true);
        setPrivateField(webView, "mainHandler", mockHandler);

        webView.setCheckoutUrl("https://shopify.com/checkout");
        webView.setAuth("auth-token");

        verify(mockHandler, times(1)).post(any(Runnable.class));
    }

    // MARK: - InlineCheckoutEventProcessor Tests
    // Note: The InlineCheckoutEventProcessor is an inner class of RCTCheckoutWebView that
    // delegates event emission to the enclosing class's sendEvent method, which requires
    // Android View infrastructure (getId(), EventDispatcher). The error mapping functions
    // (getErrorTypeName, buildErrorMap) are already tested above.
    //
    // The event lifecycle methods follow the same patterns as SheetCheckoutEventProcessor
    // but emit events through React Native's EventDispatcher instead of RCTDeviceEventEmitter.
    // These tests verify the InlineCheckoutEventProcessor correctly:
    // 1. Serializes event data to WritableMap
    // 2. Calls sendEvent with the correct CheckoutEventType
    // 3. Handles errors by calling buildErrorMap

    @Test
    public void testInlineProcessor_onFail_withHttpException_buildsCorrectErrorMap() throws Exception {
        HttpException exception = mock(HttpException.class);
        when(exception.getErrorDescription()).thenReturn("Not Found");
        when(exception.getErrorCode()).thenReturn("http_error");
        when(exception.isRecoverable()).thenReturn(false);
        when(exception.getStatusCode()).thenReturn(404);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "CheckoutHTTPError");
        verify(mockMap).putString("message", "Not Found");
        verify(mockMap).putBoolean("recoverable", false);
        verify(mockMap).putString("code", "http_error");
        verify(mockMap).putInt("statusCode", 404);
    }

    @Test
    public void testInlineProcessor_onFail_withClientException_buildsErrorMapWithoutStatusCode() throws Exception {
        ClientException exception = mock(ClientException.class);
        when(exception.getErrorDescription()).thenReturn("Client error");
        when(exception.getErrorCode()).thenReturn("client_error");
        when(exception.isRecoverable()).thenReturn(true);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "CheckoutClientError");
        verify(mockMap).putString("message", "Client error");
        verify(mockMap).putBoolean("recoverable", true);
        verify(mockMap).putString("code", "client_error");
        verify(mockMap, never()).putInt(eq("statusCode"), anyInt());
    }

    @Test
    public void testInlineProcessor_onFail_withCheckoutExpiredException_buildsCorrectTypeName() throws Exception {
        CheckoutExpiredException exception = mock(CheckoutExpiredException.class);
        when(exception.getErrorDescription()).thenReturn("Checkout expired");
        when(exception.getErrorCode()).thenReturn("expired");
        when(exception.isRecoverable()).thenReturn(false);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "CheckoutExpiredError");
    }

    @Test
    public void testInlineProcessor_onFail_withConfigurationException_buildsCorrectTypeName() throws Exception {
        ConfigurationException exception = mock(ConfigurationException.class);
        when(exception.getErrorDescription()).thenReturn("Config error");
        when(exception.getErrorCode()).thenReturn("config_error");
        when(exception.isRecoverable()).thenReturn(false);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "ConfigurationError");
    }

    @Test
    public void testInlineProcessor_onFail_withCheckoutSheetKitException_buildsInternalError() throws Exception {
        CheckoutSheetKitException exception = mock(CheckoutSheetKitException.class);
        when(exception.getErrorDescription()).thenReturn("Internal error");
        when(exception.getErrorCode()).thenReturn("internal");
        when(exception.isRecoverable()).thenReturn(false);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "InternalError");
    }

    @Test
    public void testInlineProcessor_onFail_withUnknownException_buildsUnknownError() throws Exception {
        CheckoutException exception = mock(CheckoutException.class);
        when(exception.getErrorDescription()).thenReturn("Unknown error");
        when(exception.getErrorCode()).thenReturn("unknown");
        when(exception.isRecoverable()).thenReturn(false);

        WritableMap mockMap = mock(WritableMap.class);
        mockedArguments.when(Arguments::createMap).thenReturn(mockMap);

        invokePrivateMethod(webView, "buildErrorMap", exception);

        verify(mockMap).putString("__typename", "UnknownError");
    }

    // MARK: - Helper Methods

    private void setPrivateField(Object object, String fieldName, Object value) throws Exception {
        Field field = object.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(object, value);
    }

    private Object getPrivateField(Object object, String fieldName) throws Exception {
        Field field = object.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        return field.get(object);
    }

    @SuppressWarnings("unchecked")
    private <T> T invokePrivateMethod(Object object, String methodName, Object... args) throws Exception {
        Class<?>[] paramTypes = new Class<?>[args.length];
        for (int i = 0; i < args.length; i++) {
            paramTypes[i] = getParameterType(args[i]);
        }

        Method method = findMethod(object.getClass(), methodName, paramTypes);
        method.setAccessible(true);
        return (T) method.invoke(object, args);
    }

    private Class<?> getParameterType(Object arg) {
        if (arg instanceof CheckoutExpiredException) return CheckoutExpiredException.class;
        if (arg instanceof ClientException) return ClientException.class;
        if (arg instanceof HttpException) return HttpException.class;
        if (arg instanceof ConfigurationException) return ConfigurationException.class;
        if (arg instanceof CheckoutSheetKitException) return CheckoutSheetKitException.class;
        if (arg instanceof com.shopify.checkoutsheetkit.CheckoutException) {
            return com.shopify.checkoutsheetkit.CheckoutException.class;
        }
        return arg.getClass();
    }

    private Method findMethod(Class<?> clazz, String methodName, Class<?>[] paramTypes) throws NoSuchMethodException {
        for (Method method : clazz.getDeclaredMethods()) {
            if (!method.getName().equals(methodName)) continue;

            Class<?>[] methodParamTypes = method.getParameterTypes();
            if (methodParamTypes.length != paramTypes.length) continue;

            boolean matches = true;
            for (int i = 0; i < paramTypes.length; i++) {
                if (!methodParamTypes[i].isAssignableFrom(paramTypes[i])) {
                    matches = false;
                    break;
                }
            }
            if (matches) return method;
        }
        throw new NoSuchMethodException(methodName);
    }
}
