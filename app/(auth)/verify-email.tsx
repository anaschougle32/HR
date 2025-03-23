import { StyleSheet, View, Image } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [logoError, setLogoError] = useState(false);
  const [emailIconError, setEmailIconError] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.logoContainer}>
        {logoError ? (
          <View style={[styles.logo, styles.placeholderLogo]}>
            <Text style={styles.placeholderText}>JobHR</Text>
          </View>
        ) : (
          <Image 
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            onError={() => setLogoError(true)}
          />
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text variant="headlineLarge" style={styles.title}>
          Verify Your Email
        </Text>
        
        <Text variant="bodyLarge" style={styles.message}>
          We've sent you an email with a verification link. Please check your inbox and click the link to verify your account.
        </Text>

        <View style={styles.iconContainer}>
          {emailIconError ? (
            <View style={styles.placeholderEmailIcon}>
              <Text style={styles.placeholderEmailText}>📧</Text>
            </View>
          ) : (
            <Image 
              source={require('../../assets/email-sent.png')} 
              style={styles.emailIcon}
              resizeMode="contain"
              onError={() => setEmailIconError(true)}
            />
          )}
        </View>

        <Button
          mode="contained"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Return to Login
        </Button>

        <Button
          mode="text"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.resendButton}
        >
          Didn't receive an email? Resend
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#757575',
    lineHeight: 24,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  emailIcon: {
    width: 150,
    height: 150,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#4a5eff',
    elevation: 0,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 8,
  },
  placeholderLogo: {
    backgroundColor: '#4a5eff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholderEmailIcon: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 75,
  },
  placeholderEmailText: {
    fontSize: 50,
  },
}); 