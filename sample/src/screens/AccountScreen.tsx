import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AccountStackParamList} from '../App';
import type {Colors} from '../context/Theme';
import {useTheme} from '../context/Theme';
import {useAuth} from '../context/Auth';

type Props = NativeStackScreenProps<AccountStackParamList, 'AccountHome'>;

function AccountScreen({navigation}: Props) {
  const {isAuthenticated, customerEmail, isLoading} = useAuth();
  const {colors} = useTheme();
  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedView email={customerEmail} styles={styles} />;
  }

  return (
    <UnauthenticatedView
      styles={styles}
      onSignIn={() => navigation.navigate('Login')}
    />
  );
}

function AuthenticatedView({
  email,
  styles,
}: {
  email: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  const {logout} = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Icon name="user" size={60} color="#81b0ff" />
        <Text style={styles.heading}>Signed In</Text>
        {email && <Text style={styles.email}>{email}</Text>}
        <Text style={styles.description}>
          Your checkout will be pre-filled with your account information.
        </Text>
        <Pressable style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function UnauthenticatedView({
  styles,
  onSignIn,
}: {
  styles: ReturnType<typeof createStyles>;
  onSignIn: () => void;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <Icon name="user" size={60} color="#bbc1d6" />
        <Text style={styles.heading}>Sign in to your account</Text>
        <Text style={styles.description}>
          Get faster checkout, order tracking, and more.
        </Text>
        <View style={styles.benefitsList}>
          <Text style={styles.benefitItem}>• Faster checkout experience</Text>
          <Text style={styles.benefitItem}>• Pre-filled shipping details</Text>
          <Text style={styles.benefitItem}>• Order history and tracking</Text>
        </View>
        <Pressable style={styles.button} onPress={onSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    heading: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    email: {
      fontSize: 16,
      color: colors.primary,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: colors.textSubdued,
      textAlign: 'center',
      marginBottom: 16,
    },
    benefitsList: {
      alignSelf: 'stretch',
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    benefitItem: {
      fontSize: 14,
      color: colors.textSubdued,
      paddingVertical: 4,
    },
    button: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 10,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.secondaryText,
    },
  });
}

export default AccountScreen;
