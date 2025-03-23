import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, useTheme, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [logoError, setLogoError] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate inputs
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user role from metadata
      const userRole = data.user?.user_metadata?.role;
      console.log('Login successful, user role:', userRole);

      // Verify profile exists
      if (userRole === 'applicant') {
        const { data: profile, error: profileError } = await supabase
          .from('applicant_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (profileError || !profile) {
          // Create profile if it doesn't exist
          const { error: createError } = await supabase
            .from('applicant_profiles')
            .insert({
              user_id: data.user.id,
              full_name: '',
              phone: '',
              location: ''
            });

          if (createError) throw createError;
        }
      }

      // Route based on role
      switch (userRole) {
        case 'recruiter':
          router.replace('/recruiter/');
          break;
        case 'employer':
          router.replace('/employer/');
          break;
        case 'applicant':
          router.replace('/(app)/');
          break;
        default:
          router.replace('/(auth)/role-select');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
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
          
          <View style={styles.headerContainer}>
            <Text variant="headlineLarge" style={styles.title}>Welcome Back</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Sign in to continue to your account
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
                placeholder="Enter your password"
              />
            </View>

            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            {error && (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Sign In
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

            <View style={styles.signupContainer}>
              <Text variant="bodyMedium" style={styles.signupText}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text variant="bodyMedium" style={styles.signupLink}>
                  Sign Up
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPassword: {
    color: '#4a5eff',
    fontWeight: '500',
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    color: '#757575',
  },
  signupLink: {
    color: '#4a5eff',
    fontWeight: 'bold',
    marginLeft: 4,
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
}); 