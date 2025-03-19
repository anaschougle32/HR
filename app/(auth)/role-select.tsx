import { StyleSheet, View } from 'react-native';
import { Button, Text, Card, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = async (role: 'applicant' | 'employer') => {
    try {
      setLoading(true);
      setError(null);

      // Update user metadata with role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      });

      if (updateError) throw updateError;

      // Create appropriate profile
      const { error: profileError } = await supabase
        .from(role === 'employer' ? 'employer_profiles' : 'applicant_profiles')
        .insert({
          user_id: session?.user.id,
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

      // Redirect to appropriate profile setup
      router.replace(role === 'employer' ? '/employer/profile' : '/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
      setLoading(false);
    }
  };

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