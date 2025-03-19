import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, Title, Paragraph, Divider, TextInput, Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import LoadingScreen from '../../../components/LoadingScreen';
import { useAuth } from '../../../contexts/AuthContext';

interface JobDetails {
  id: string;
  title: string;
  description: string;
  requirements: string;
  experience_level: number;
  created_at: string;
  status: string;
  employer_id: string;
}

interface ApplicationStats {
  total: number;
  pending: number;
  shortlisted: number;
  rejected: number;
}

interface Application {
  id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  created_at: string;
  updated_at: string;
  applicant: {
    id: string;
    full_name: string;
    title: string | null;
    location: string | null;
    resume_url: string | null;
  };
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  experience_level: number;
  status: 'active' | 'closed';
  created_at: string;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    experience_level: 1,
    status: 'active' as 'active' | 'closed'
  });

  const fetchJobDetails = async () => {
    try {
      if (!session?.user?.id) return;

      // Get employer profile
      const { data: employer, error: employerError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (employerError) throw employerError;

      // Get job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('employer_id', employer.id)
        .single();

      if (jobError) throw jobError;

      if (jobData) {
        setJob(jobData);
        setForm({
          title: jobData.title,
          description: jobData.description,
          requirements: jobData.requirements,
          experience_level: jobData.experience_level,
          status: jobData.status
        });
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!job) return;

      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          title: form.title,
          description: form.description,
          requirements: form.requirements,
          experience_level: form.experience_level,
          status: form.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) throw updateError;

      router.back();
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job details');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id, session]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Edit Job Details</Title>

      <View style={styles.form}>
        <TextInput
          label="Job Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <TextInput
          label="Requirements"
          value={form.requirements}
          onChangeText={(text) => setForm({ ...form, requirements: text })}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <Text>Experience Level</Text>
        <SegmentedButtons
          value={form.experience_level.toString()}
          onValueChange={(value) => setForm({ ...form, experience_level: parseInt(value) })}
          buttons={[
            { value: '1', label: 'Entry' },
            { value: '2', label: 'Junior' },
            { value: '3', label: 'Mid' },
            { value: '4', label: 'Senior' },
            { value: '5', label: 'Expert' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text>Status</Text>
        <SegmentedButtons
          value={form.status}
          onValueChange={(value) => setForm({ ...form, status: value as 'active' | 'closed' })}
          buttons={[
            { value: 'active', label: 'Active' },
            { value: 'closed', label: 'Closed' },
          ]}
          style={styles.segmentedButtons}
        />

        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.button}
        >
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
}); 