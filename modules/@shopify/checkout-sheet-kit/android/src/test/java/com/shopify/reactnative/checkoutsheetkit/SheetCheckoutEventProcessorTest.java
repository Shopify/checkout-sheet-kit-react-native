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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import android.webkit.GeolocationPermissions;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.shopify.checkoutsheetkit.CheckoutException;
import com.shopify.checkoutsheetkit.CheckoutExpiredException;
import com.shopify.checkoutsheetkit.CheckoutSheetKitException;
import com.shopify.checkoutsheetkit.ClientException;
import com.shopify.checkoutsheetkit.ConfigurationException;
import com.shopify.checkoutsheetkit.HttpException;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutCompleteEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutStartEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutAddressChangeStartEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutSubmitStartEvent;
import com.shopify.checkoutsheetkit.lifecycleevents.CheckoutPaymentMethodChangeStartEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

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

import java.io.IOException;
import java.lang.reflect.Field;

@RunWith(MockitoJUnitRunner.Silent.class)
public class SheetCheckoutEventProcessorTest {
    @Mock
    private Context mockContext;
    @Mock
    private ReactApplicationContext mockReactContext;
    @Mock
    private DeviceEventManagerModule.RCTDeviceEventEmitter mockEventEmitter;
    @Mock
    private GeolocationPermissions.Callback mockGeolocationCallback;

    @Captor
    private ArgumentCaptor<String> eventNameCaptor;
    @Captor
    private ArgumentCaptor<String> eventDataCaptor;

    private SheetCheckoutEventProcessor processor;
    private MockedStatic<Log> mockedLog;
    @Before
    public void setup() {
        mockedLog = Mockito.mockStatic(Log.class);
        mockedLog.when(() -> Log.d(any(), any())).thenReturn(0);
        mockedLog.when(() -> Log.e(any(), any())).thenReturn(0);
        mockedLog.when(() -> Log.e(any(), any(), any())).thenReturn(0);
        mockedLog.when(() -> Log.w(any(), any(String.class))).thenReturn(0);

        when(mockReactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class))
            .thenReturn(mockEventEmitter);

        processor = new SheetCheckoutEventProcessor(mockContext, mockReactContext);
    }
    @After
    public void tearDown() {
        mockedLog.close();
    }

    // MARK: - Geolocation Handling Tests
    @Test
    public void testInvokeGeolocationCallback_withAllow_invokesCallbackWithTrueAndClearsIt() throws Exception {
        setPrivateField(processor, "geolocationCallback", mockGeolocationCallback);
        setPrivateField(processor, "geolocationOrigin", "https://example.com");

        processor.invokeGeolocationCallback(true);

        verify(mockGeolocationCallback).invoke(eq("https://example.com"), eq(true), eq(false));
        assertThat(getPrivateField(processor, "geolocationCallback")).isNull();
    }

    @Test
    public void testInvokeGeolocationCallback_withDeny_invokesCallbackWithFalseAndClearsIt() throws Exception {
        setPrivateField(processor, "geolocationCallback", mockGeolocationCallback);
        setPrivateField(processor, "geolocationOrigin", "https://example.com");

        processor.invokeGeolocationCallback(false);

        verify(mockGeolocationCallback).invoke(eq("https://example.com"), eq(false), eq(false));
        assertThat(getPrivateField(processor, "geolocationCallback")).isNull();
    }

    @Test
    public void testInvokeGeolocationCallback_withNullCallback_doesNotThrow() {
        processor.invokeGeolocationCallback(true);

        verify(mockGeolocationCallback, never()).invoke(any(), anyBoolean(), anyBoolean());
    }

    @Test
    public void testOnGeolocationPermissionsShowPrompt_storesCallbackAndOrigin_emitsEvent() throws Exception {
        String origin = "https://shop.example.com";

        processor.onGeolocationPermissionsShowPrompt(origin, mockGeolocationCallback);

        assertThat(getPrivateField(processor, "geolocationCallback")).isEqualTo(mockGeolocationCallback);
        assertThat(getPrivateField(processor, "geolocationOrigin")).isEqualTo(origin);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("geolocationRequest");
        assertThat(eventDataCaptor.getValue()).contains("\"origin\":\"https://shop.example.com\"");
    }

    @Test
    public void testOnGeolocationPermissionsShowPrompt_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        processor.onGeolocationPermissionsShowPrompt("https://example.com", mockGeolocationCallback);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error emitting \"geolocationRequest\" event"), any(IOException.class)));
    }

    @Test
    public void testOnGeolocationPermissionsHidePrompt_clearsCallbackAndOrigin() throws Exception {
        setPrivateField(processor, "geolocationCallback", mockGeolocationCallback);
        setPrivateField(processor, "geolocationOrigin", "https://example.com");

        processor.onGeolocationPermissionsHidePrompt();

        assertThat(getPrivateField(processor, "geolocationCallback")).isNull();
        assertThat(getPrivateField(processor, "geolocationOrigin")).isNull();
    }

    // MARK: - onFail Tests

    @Test
    public void testOnFail_withHttpException_emitsErrorEventWithStatusCode() {
        HttpException exception = mock(HttpException.class);
        when(exception.getErrorDescription()).thenReturn("Not Found");
        when(exception.getErrorCode()).thenReturn("http_error");
        when(exception.isRecoverable()).thenReturn(false);
        when(exception.getStatusCode()).thenReturn(404);

        processor.onFail(exception);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("error");
        String eventData = eventDataCaptor.getValue();
        assertThat(eventData).contains("\"__typename\":\"CheckoutHTTPError\"");
        assertThat(eventData).contains("\"statusCode\":404");
        assertThat(eventData).contains("\"message\":\"Not Found\"");
        assertThat(eventData).contains("\"recoverable\":false");
    }

    @Test
    public void testOnFail_withClientException_emitsErrorEventWithoutStatusCode() {
        ClientException exception = mock(ClientException.class);
        when(exception.getErrorDescription()).thenReturn("Client error");
        when(exception.getErrorCode()).thenReturn("client_error");
        when(exception.isRecoverable()).thenReturn(true);

        processor.onFail(exception);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("error");
        String eventData = eventDataCaptor.getValue();
        assertThat(eventData).contains("\"__typename\":\"CheckoutClientError\"");
        assertThat(eventData).doesNotContain("statusCode");
    }

    @Test
    public void testOnFail_withCheckoutExpiredException_emitsCorrectTypeName() {
        CheckoutExpiredException exception = mock(CheckoutExpiredException.class);
        when(exception.getErrorDescription()).thenReturn("Checkout expired");
        when(exception.getErrorCode()).thenReturn("expired");
        when(exception.isRecoverable()).thenReturn(false);

        processor.onFail(exception);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventDataCaptor.getValue()).contains("\"__typename\":\"CheckoutExpiredError\"");
    }

    @Test
    public void testOnFail_withConfigurationException_emitsCorrectTypeName() {
        ConfigurationException exception = mock(ConfigurationException.class);
        when(exception.getErrorDescription()).thenReturn("Config error");
        when(exception.getErrorCode()).thenReturn("config_error");
        when(exception.isRecoverable()).thenReturn(false);

        processor.onFail(exception);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventDataCaptor.getValue()).contains("\"__typename\":\"ConfigurationError\"");
    }

    @Test
    public void testOnFail_withCheckoutSheetKitException_emitsInternalError() {
        CheckoutSheetKitException exception = mock(CheckoutSheetKitException.class);
        when(exception.getErrorDescription()).thenReturn("Internal error");
        when(exception.getErrorCode()).thenReturn("internal");
        when(exception.isRecoverable()).thenReturn(false);

        processor.onFail(exception);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventDataCaptor.getValue()).contains("\"__typename\":\"InternalError\"");
    }

    @Test
    public void testOnFail_withUnknownException_emitsUnknownError() {
        CheckoutException exception = mock(CheckoutException.class);
        when(exception.getErrorDescription()).thenReturn("Unknown error");
        when(exception.getErrorCode()).thenReturn("unknown");
        when(exception.isRecoverable()).thenReturn(false);

        processor.onFail(exception);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventDataCaptor.getValue()).contains("\"__typename\":\"UnknownError\"");
    }

    @Test
    public void testOnFail_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        CheckoutException exception = mock(CheckoutException.class);
        when(exception.getErrorDescription()).thenReturn("Some error");
        when(exception.getErrorCode()).thenReturn("error_code");
        when(exception.isRecoverable()).thenReturn(false);

        processor.onFail(exception);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error processing checkout failed event"), any(IOException.class)));
    }

    // MARK: - onCancel Tests

    @Test
    public void testOnCancel_emitsCloseEvent() {
        processor.onCancel();

        verify(mockEventEmitter).emit(eq("close"), eq(null));
    }

    // MARK: - onComplete Tests

    @Test
    public void testOnComplete_emitsCompleteEventWithSerializedData() {
        CheckoutCompleteEvent event = mock(CheckoutCompleteEvent.class);

        processor.onComplete(event);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("complete");
        assertThat(eventDataCaptor.getValue()).isNotNull();
    }

    @Test
    public void testOnComplete_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        CheckoutCompleteEvent event = mock(CheckoutCompleteEvent.class);
        processor.onComplete(event);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error processing complete event"), any(IOException.class)));
    }

    // MARK: - onStart Tests

    @Test
    public void testOnStart_emitsStartEventWithSerializedData() {
        CheckoutStartEvent event = mock(CheckoutStartEvent.class);

        processor.onStart(event);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("start");
        assertThat(eventDataCaptor.getValue()).isNotNull();
    }

    @Test
    public void testOnStart_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        CheckoutStartEvent event = mock(CheckoutStartEvent.class);
        processor.onStart(event);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error processing start event"), any(IOException.class)));
    }

    // MARK: - onAddressChangeStart Tests

    @Test
    public void testOnAddressChangeStart_emitsEventWithIdMethodAddressTypeAndCart() {
        CheckoutAddressChangeStartEvent event = mock(CheckoutAddressChangeStartEvent.class);

        when(event.getId()).thenReturn("address-event-123");
        when(event.getMethod()).thenReturn("checkout.addressChangeStart");
        when(event.getAddressType()).thenReturn("shipping");
        when(event.getCart()).thenReturn(null);

        processor.onAddressChangeStart(event);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("addressChangeStart");
        String eventData = eventDataCaptor.getValue();
        assertThat(eventData).contains("\"id\":\"address-event-123\"");
        assertThat(eventData).contains("\"method\":\"checkout.addressChangeStart\"");
        assertThat(eventData).contains("\"addressType\":\"shipping\"");
    }

    @Test
    public void testOnAddressChangeStart_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        CheckoutAddressChangeStartEvent event = mock(CheckoutAddressChangeStartEvent.class);

        processor.onAddressChangeStart(event);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error processing address change start event"), any(IOException.class)));
    }

    // MARK: - onPaymentMethodChangeStart Tests

    @Test
    public void testOnPaymentMethodChangeStart_emitsEventWithIdMethodAndCart() {
        CheckoutPaymentMethodChangeStartEvent event = mock(CheckoutPaymentMethodChangeStartEvent.class);

        when(event.getId()).thenReturn("payment-event-456");
        when(event.getMethod()).thenReturn("checkout.paymentMethodChangeStart");
        when(event.getCart()).thenReturn(null);

        processor.onPaymentMethodChangeStart(event);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("paymentMethodChangeStart");
        String eventData = eventDataCaptor.getValue();
        assertThat(eventData).contains("\"id\":\"payment-event-456\"");
        assertThat(eventData).contains("\"method\":\"checkout.paymentMethodChangeStart\"");
    }

    @Test
    public void testOnPaymentMethodChangeStart_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        CheckoutPaymentMethodChangeStartEvent event = mock(CheckoutPaymentMethodChangeStartEvent.class);

        processor.onPaymentMethodChangeStart(event);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error processing payment method change start event"), any(IOException.class)));
    }

    // MARK: - onSubmitStart Tests

    @Test
    public void testOnSubmitStart_emitsEventWithIdMethodCartAndCheckout() {
        CheckoutSubmitStartEvent event = mock(CheckoutSubmitStartEvent.class, RETURNS_DEEP_STUBS);

        when(event.getId()).thenReturn("submit-event-789");
        when(event.getMethod()).thenReturn("checkout.submitStart");
        when(event.getCart()).thenReturn(null);
        when(event.getSessionId()).thenReturn("checkout-123");

        processor.onSubmitStart(event);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("submitStart");
        String eventData = eventDataCaptor.getValue();
        assertThat(eventData).contains("\"id\":\"submit-event-789\"");
        assertThat(eventData).contains("\"method\":\"checkout.submitStart\"");
        assertThat(eventData).contains("\"sessionId\":\"checkout-123\"");
    }

    @Test
    public void testOnSubmitStart_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        CheckoutSubmitStartEvent event = mock(CheckoutSubmitStartEvent.class, RETURNS_DEEP_STUBS);
        when(event.getSessionId()).thenReturn("checkout-123");

        processor.onSubmitStart(event);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error processing submit start event"), any(IOException.class)));
    }

    // MARK: - onLinkClick Tests

    @Test
    public void testOnLinkClick_emitsLinkClickEventWithUrl() {
        Uri mockUri = mock(Uri.class);
        when(mockUri.toString()).thenReturn("https://example.com/terms");

        processor.onLinkClick(mockUri);

        verify(mockEventEmitter).emit(eventNameCaptor.capture(), eventDataCaptor.capture());
        assertThat(eventNameCaptor.getValue()).isEqualTo("linkClick");
        String eventData = eventDataCaptor.getValue();
        assertThat(eventData).contains("\"url\":\"https://example.com/terms\"");
    }

    @Test
    public void testOnLinkClick_withSerializationError_logsErrorAndDoesNotEmit() throws Exception {
        ObjectMapper mockMapper = mock(ObjectMapper.class);
        when(mockMapper.writeValueAsString(any())).thenThrow(new JsonProcessingException("Serialization failed") {});
        setPrivateField(processor, "mapper", mockMapper);

        Uri mockUri = mock(Uri.class);
        when(mockUri.toString()).thenReturn("https://example.com/terms");
        processor.onLinkClick(mockUri);

        verify(mockEventEmitter, never()).emit(anyString(), anyString());
        mockedLog.verify(() -> Log.e(eq("SheetCheckoutEventProcessor"), eq("Error processing link click event"), any(IOException.class)));
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
}
