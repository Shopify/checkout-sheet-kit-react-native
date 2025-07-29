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

import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import {ShopifyCheckout} from '@shopify/checkout-sheet-kit';
import type {ShopifyCheckoutRef} from '@shopify/checkout-sheet-kit';
import {useCart} from '../context/Cart';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isCheckout?: boolean;
}

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I'm your shopping assistant. I can help you browse products and complete your purchase. Try saying 'show me my cart' or 'help me checkout'!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [showInlineCheckout, setShowInlineCheckout] = useState(false);
  const {checkoutURL} = useCart();
  const checkoutRef = useRef<ShopifyCheckoutRef>(null);

  // Mock auth token - in a real app, this would come from your authentication system
  // Authentication is now optional for demo purposes
  // const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoibW9jay1hcGkta2V5IiwidmFyaWFudCI6Im1vY2stdmFyaWFudCIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk4ODAwfQ.mock-signature';

  const addMessage = (text: string, isUser: boolean, isCheckout = false) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      isCheckout,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) {
      return;
    }

    const userMessage = inputText.trim();
    addMessage(userMessage, true);
    setInputText('');

    // Simulate bot responses
    setTimeout(() => {
      handleBotResponse(userMessage.toLowerCase());
    }, 500);
  };

  const handleBotResponse = (userMessage: string) => {
    if (userMessage.includes('cart') || userMessage.includes('checkout')) {
      if (checkoutURL) {
        addMessage(
          "I can help you complete your purchase! Here's your checkout embedded right in our chat:",
          false,
        );
        setShowInlineCheckout(true);
        addMessage('', false, true); // Special checkout message
      } else {
        addMessage(
          'Your cart is empty. Add some products first, then I can help you checkout!',
          false,
        );
      }
    } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
      addMessage('Hello! How can I help you with your shopping today?', false);
    } else if (userMessage.includes('help')) {
      addMessage(
        'I can help you with:\n• Viewing your cart\n• Completing checkout\n• Finding products\n• Answering questions',
        false,
      );
    } else if (userMessage.includes('popup') || userMessage.includes('sheet')) {
      addMessage('Opening checkout in a popup window for you!', false);
      setTimeout(() => {
        if (checkoutURL) {
          checkoutRef.current?.open();
        }
      }, 500);
    } else {
      addMessage(
        "I understand you said: '" +
          userMessage +
          "'. Try asking about your cart or checkout!",
        false,
      );
    }
  };

  const handleCheckoutCompleted = (event: any) => {
    setShowInlineCheckout(false);
    addMessage(
      `🎉 Order completed successfully! Order #${event.orderDetails?.id || 'unknown'}`,
      false,
    );
    Alert.alert('Success', 'Your order has been completed!');
  };

  const handleCheckoutError = (error: any) => {
    // Handle authentication errors specifically
    if (error.message && error.message.toLowerCase().includes('unauthorized')) {
      addMessage(
        "🔐 Authentication failed with the demo token. This is expected when using mock authentication with real Shopify URLs. In production, you'd use a real JWT token from your authentication service.",
        false,
      );
      Alert.alert(
        'Demo Authentication',
        'This demonstrates WebView integration. Real auth tokens would be needed for production.',
      );
    } else {
      addMessage(
        `❌ Checkout encountered an error: ${error.message || 'Unknown error'}`,
        false,
      );
      Alert.alert('Error', 'There was a problem with your checkout.');
    }
  };

  const handleCheckoutClose = () => {
    setShowInlineCheckout(false);
    addMessage('Checkout was closed. Let me know if you need help!', false);
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.isCheckout && showInlineCheckout && checkoutURL) {
      return (
        <View key={message.id} style={styles.checkoutContainer}>
          <ShopifyCheckout
            url={checkoutURL}
            mode="inline"
            autoResizeHeight={true}
            style={styles.inlineCheckout}
            onCompleted={handleCheckoutCompleted}
            onError={handleCheckoutError}
            onClose={handleCheckoutClose}
            onResize={height => {
              console.log('Checkout resized to:', height);
            }}
          />
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessage : styles.botMessage,
        ]}>
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userMessageText : styles.botMessageText,
          ]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden popup checkout component */}
      <ShopifyCheckout
        url={checkoutURL}
        ref={checkoutRef}
        mode="popup"
        onCompleted={handleCheckoutCompleted}
        onError={handleCheckoutError}
        onClose={() => addMessage('Popup checkout was closed.', false)}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Assistant</Text>
        <Text style={styles.headerSubtitle}>
          Checkout Kit Demo - Inline & Popup
        </Text>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}>
        {messages.map(renderMessage)}

        {/* Demo instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Try these commands:</Text>
          <Text style={styles.instructionText}>
            • "show me my cart" - Shows inline checkout
          </Text>
          <Text style={styles.instructionText}>
            • "popup checkout" - Opens popup checkout
          </Text>
          <Text style={styles.instructionText}>
            • "help" - Shows available commands
          </Text>
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  checkoutContainer: {
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inlineCheckout: {
    minHeight: 400,
    borderRadius: 8,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    marginHorizontal: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ChatScreen;
