import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome Back
      </Text>

      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          disabled={loading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          disabled={loading}
        />

        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>

        <Button
          mode="text"
          onPress={() => router.push('/(auth)/signup')}
          style={styles.button}
          disabled={loading}
        >
          Don't have an account? Sign Up
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    gap: 15,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
}); 