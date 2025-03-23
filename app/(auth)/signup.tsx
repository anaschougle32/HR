import { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, useTheme, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';

export default function SignUpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Add a delay to ensure the session is established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to verify email screen instead of role selection
      router.replace('/(auth)/verify-email');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const toggleSecureConfirmEntry = () => {
    setSecureConfirmTextEntry(!secureConfirmTextEntry);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.headerContainer}>
            <Text variant="headlineLarge" style={styles.title}>Create Account</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Sign up to start your journey
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.inputLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                disabled={loading}
                mode="outlined"
                outlineColor="#E0E0E0"
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="email-outline" color="#757575" />}
                placeholder="Enter your email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.inputLabel}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                style={styles.input}
                disabled={loading}
                mode="outlined"
                outlineColor="#E0E0E0"
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-outline" color="#757575" />}
                right={
                  <TextInput.Icon 
                    icon={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                    onPress={toggleSecureEntry}
                    color="#757575"
                  />
                }
                placeholder="Create a password"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secureConfirmTextEntry}
                style={styles.input}
                disabled={loading}
                mode="outlined"
                outlineColor="#E0E0E0"
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-check-outline" color="#757575" />}
                right={
                  <TextInput.Icon 
                    icon={secureConfirmTextEntry ? "eye-outline" : "eye-off-outline"} 
                    onPress={toggleSecureConfirmEntry}
                    color="#757575"
                  />
                }
                placeholder="Confirm your password"
              />
            </View>

            {error && (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Create Account
            </Button>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <IconButton
                icon="google"
                mode="outlined"
                size={24}
                style={styles.socialButton}
                onPress={() => {}}
              />
              <IconButton
                icon="facebook"
                mode="outlined"
                size={24}
                style={styles.socialButton}
                onPress={() => {}}
              />
              <IconButton
                icon="apple"
                mode="outlined"
                size={24}
                style={styles.socialButton}
                onPress={() => {}}
              />
            </View>

            <View style={styles.loginContainer}>
              <Text variant="bodyMedium" style={styles.loginText}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text variant="bodyMedium" style={styles.loginLink}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
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
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    color: '#757575',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'transparent',
    height: 56,
  },
  errorText: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    elevation: 0,
    backgroundColor: '#4a5eff',
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#757575',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialButton: {
    marginHorizontal: 8,
    borderColor: '#E0E0E0',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#757575',
  },
  loginLink: {
    color: '#4a5eff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
}); 