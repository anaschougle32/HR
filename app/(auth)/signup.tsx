import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('applicant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Sign up the user with role in metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role // 'applicant' or 'employer'
          },
        }
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Create appropriate profile
      if (role === 'applicant') {
        const { error: profileError } = await supabase
          .from('applicant_profiles')
          .insert({
            user_id: data.user.id,
            full_name: '',
            phone: '',
            location: '',
            about: '',
            resume_url: ''
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }
      } else {
        // Handle employer profile creation
        const { error: profileError } = await supabase
          .from('employer_profiles')
          .insert({
            user_id: data.user.id,
            company_name: '',
            description: '',
            location: ''
          });

        if (profileError) throw profileError;
      }

      // Redirect to email verification
      router.replace('/(auth)/verify-email');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>

      <View style={styles.form}>
        <SegmentedButtons
          value={role}
          onValueChange={setRole}
          buttons={[
            { value: 'applicant', label: 'Job Seeker' },
            { value: 'employer', label: 'Employer' },
          ]}
          style={styles.roleSelector}
        />

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

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Sign Up
        </Button>

        <Button
          mode="text"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
          disabled={loading}
        >
          Already have an account? Login
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
  roleSelector: {
    marginBottom: 20,
  },
}); 