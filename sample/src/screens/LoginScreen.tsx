import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {WebView} from 'react-native-webview';
import type {ShouldStartLoadRequest} from 'react-native-webview/lib/WebViewTypes';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AccountStackParamList} from '../App';
import {useAuth} from '../context/Auth';
import {getCallbackScheme} from '../auth/customerAccountManager';
import type {Colors} from '../context/Theme';
import {useTheme} from '../context/Theme';

type Props = NativeStackScreenProps<AccountStackParamList, 'Login'>;

function LoginScreen({navigation}: Props) {
  const {login, handleAuthCallback} = useAuth();
  const {colors} = useTheme();
  const styles = createStyles(colors);
  const [isProcessing, setIsProcessing] = useState(false);

  const authorizationURL = useMemo(() => login(), [login]);
  const callbackScheme = useMemo(() => getCallbackScheme(), []);

  const handleNavigationRequest = useCallback(
    (request: ShouldStartLoadRequest): boolean => {
      const {url} = request;

      if (url.startsWith(`${callbackScheme}://callback`)) {
        setIsProcessing(true);
        const urlParams = new URL(url);
        const code = urlParams.searchParams.get('code');
        const state = urlParams.searchParams.get('state');

        if (code && state) {
          handleAuthCallback(code, state)
            .then(() => navigation.goBack())
            .catch(() => {
              setIsProcessing(false);
              navigation.goBack();
            });
        } else {
          navigation.goBack();
        }

        return false;
      }

      return true;
    },
    [callbackScheme, handleAuthCallback, navigation],
  );

  if (isProcessing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{uri: authorizationURL}}
        onShouldStartLoadWithRequest={handleNavigationRequest}
        originWhitelist={['https://*', `${callbackScheme}://*`]}
        incognito={true}
        style={styles.webview}
      />
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    webview: {
      flex: 1,
    },
  });
}

export default LoginScreen;
