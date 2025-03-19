import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button, Text, HelperText, Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface InviteForm {
  email: string;
  full_name: string;
  title: string;
  permissions: {
    can_post_jobs: boolean;
    can_review_applications: boolean;
    can_interview: boolean;
  };
}

export default function InviteRecruiterScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<InviteForm>({
    email: '',
    full_name: '',
    title: '',
    permissions: {
      can_post_jobs: false,
      can_review_applications: false,
      can_interview: false,
    },
  });

  const handleInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get employer profile
      const { data: profile, error: profileError } = await supabase
        .from('employer_profiles')
        .select('id, company_name')
        .eq('user_id', session?.user.id)
        .single();

      if (profileError) throw profileError;

      // Create recruiter profile
      const { error: inviteError } = await supabase
        .from('recruiter_profiles')
        .insert({
          employer_id: profile.id,
          email: form.email,
          full_name: form.full_name,
          title: form.title,
          permissions: form.permissions,
        });

      if (inviteError) throw inviteError;

      // Send invitation email (you'll need to implement this)
      // This could be handled by a Supabase Edge Function or your backend

      router.back();
    } catch (err) {
      console.error('Error inviting recruiter:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite recruiter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Invite Recruiter
        </Text>

        <TextInput
          label="Full Name"
          value={form.full_name}
          onChangeText={(text) => setForm({ ...form, full_name: text })}
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          label="Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Permissions
        </Text>

        <Checkbox.Item
          label="Can post jobs"
          status={form.permissions.can_post_jobs ? 'checked' : 'unchecked'}
          onPress={() => 
            setForm({
              ...form,
              permissions: {
                ...form.permissions,
                can_post_jobs: !form.permissions.can_post_jobs,
              },
            })
          }
        />

        <Checkbox.Item
          label="Can review applications"
          status={form.permissions.can_review_applications ? 'checked' : 'unchecked'}
          onPress={() => 
            setForm({
              ...form,
              permissions: {
                ...form.permissions,
                can_review_applications: !form.permissions.can_review_applications,
              },
            })
          }
        />

        <Checkbox.Item
          label="Can conduct interviews"
          status={form.permissions.can_interview ? 'checked' : 'unchecked'}
          onPress={() => 
            setForm({
              ...form,
              permissions: {
                ...form.permissions,
                can_interview: !form.permissions.can_interview,
              },
            })
          }
        />

        {error && <HelperText type="error">{error}</HelperText>}

        <Button
          mode="contained"
          onPress={handleInvite}
          loading={loading}
          style={styles.button}
        >
          Send Invitation
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
  },
}); 