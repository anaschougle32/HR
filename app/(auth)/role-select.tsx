import { StyleSheet, View } from 'react-native';
import { Button, Text, Card, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [roleSelectLoading, setRoleSelectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check session and refresh if needed
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
        router.replace('/(auth)/login');
        return;
      }
      if (!currentSession) {
        router.replace('/(auth)/login');
        return;
      }
    };
    checkSession();
  }, []);

  const handleRoleSelect = async (role: 'applicant' | 'employer') => {
    try {
      setRoleSelectLoading(true);
      setError(null);

      // Get current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !currentSession) {
        throw new Error('No active session found. Please login again.');
      }

      // Update user metadata with role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      });

      if (updateError) throw updateError;

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from(role === 'employer' ? 'employer_profiles' : 'applicant_profiles')
        .select('id')
        .eq('user_id', currentSession.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      // Only create profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from(role === 'employer' ? 'employer_profiles' : 'applicant_profiles')
          .insert({
            user_id: currentSession.user.id,
            ...(role === 'employer' ? {
              company_name: '',
              description: '',
              location: '',
            } : {
              full_name: '',
              phone: '',
              location: '',
            })
          });

        if (profileError) throw profileError;
      }

      // Redirect to appropriate profile setup
      router.replace(role === 'employer' ? '/employer/profile' : '/profile');
    } catch (err) {
      console.error('Role selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
      setRoleSelectLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Choose Your Role
      </Text>

      <Card style={styles.card} onPress={() => handleRoleSelect('applicant')}>
        <Card.Content>
          <Text variant="titleLarge">Job Seeker</Text>
          <Text variant="bodyMedium">
            Find your dream job and connect with top employers
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => handleRoleSelect('employer')}>
        <Card.Content>
          <Text variant="titleLarge">Employer</Text>
          <Text variant="bodyMedium">
            Post jobs and find the perfect candidates for your company
          </Text>
        </Card.Content>
      </Card>

      {error && <HelperText type="error">{error}</HelperText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    marginBottom: 20,
  },
}); 