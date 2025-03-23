import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  HelperText, 
  Surface,
  SegmentedButtons,
  Portal,
  Dialog,
  IconButton
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface JobForm {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  category: string;
  employment_type: string;
  experience_level: number;
  salary_min: string;
  salary_max: string;
  status: 'active' | 'closed';
}

export default function EditJobScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<JobForm>({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    category: 'Development',
    employment_type: 'full-time',
    experience_level: 1,
    salary_min: '',
    salary_max: '',
    status: 'active'
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
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('employer_id', employer.id)
        .single();

      if (jobError) throw jobError;

      setForm({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        category: job.category,
        employment_type: job.employment_type,
        experience_level: job.experience_level,
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        status: job.status === 'closed' ? 'closed' : 'active'
      });
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id, session]);

  const validateForm = () => {
    if (!form.title || !form.company || !form.location || !form.description || !form.requirements) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!form.salary_min || !form.salary_max) {
      setError('Please specify salary range');
      return false;
    }

    const minSalary = parseInt(form.salary_min);
    const maxSalary = parseInt(form.salary_max);

    if (isNaN(minSalary) || isNaN(maxSalary)) {
      setError('Please enter valid salary numbers');
      return false;
    }

    if (minSalary > maxSalary) {
      setError('Minimum salary cannot be greater than maximum salary');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) return;

      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          title: form.title,
          company: form.company,
          location: form.location,
          description: form.description,
          requirements: form.requirements,
          category: form.category,
          employment_type: form.employment_type,
          experience_level: form.experience_level,
          salary_min: parseInt(form.salary_min),
          salary_max: parseInt(form.salary_max),
          status: form.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      router.back();
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.title}>Edit Job</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={() => setShowDiscardDialog(true)}
            style={styles.closeButton}
          />
        </View>
      </Surface>

      <View style={styles.form}>
        <TextInput
          label="Job Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Company"
          value={form.company}
          onChangeText={(text) => setForm({ ...form, company: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Location"
          value={form.location}
          onChangeText={(text) => setForm({ ...form, location: text })}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="map-marker" />}
        />

        <View style={styles.row}>
          <TextInput
            label="Min Salary"
            value={form.salary_min}
            onChangeText={(text) => setForm({ ...form, salary_min: text })}
            style={[styles.input, styles.flex1]}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Icon icon="currency-usd" />}
          />
          <TextInput
            label="Max Salary"
            value={form.salary_max}
            onChangeText={(text) => setForm({ ...form, salary_max: text })}
            style={[styles.input, styles.flex1]}
            mode="outlined"
            keyboardType="numeric"
            left={<TextInput.Icon icon="currency-usd" />}
          />
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>Job Category</Text>
        <SegmentedButtons
          value={form.category}
          onValueChange={(value) => setForm({ ...form, category: value })}
          buttons={[
            { value: 'Development', label: 'Dev' },
            { value: 'Design', label: 'Design' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Sales', label: 'Sales' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>Employment Type</Text>
        <SegmentedButtons
          value={form.employment_type}
          onValueChange={(value) => setForm({ ...form, employment_type: value })}
          buttons={[
            { value: 'full-time', label: 'Full-time' },
            { value: 'part-time', label: 'Part-time' },
            { value: 'contract', label: 'Contract' },
            { value: 'internship', label: 'Intern' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>Experience Level</Text>
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

        <TextInput
          label="Description"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          multiline
          numberOfLines={6}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Requirements"
          value={form.requirements}
          onChangeText={(text) => setForm({ ...form, requirements: text })}
          multiline
          numberOfLines={6}
          style={styles.input}
          mode="outlined"
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>Job Status</Text>
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
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Save Changes
        </Button>
      </View>

      <Portal>
        <Dialog visible={showDiscardDialog} onDismiss={() => setShowDiscardDialog(false)}>
          <Dialog.Title>Discard Changes?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to discard your changes? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDiscardDialog(false)}>Keep Editing</Button>
            <Button onPress={() => router.back()} textColor="#dc3545">Discard</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    margin: -8,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  saveButtonContent: {
    height: 48,
  },
}); 