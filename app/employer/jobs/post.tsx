import { useState } from 'react';
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
  IconButton,
  Divider
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const JOB_CATEGORIES = [
  { value: 'Development', label: 'Development', icon: 'code-braces' },
  { value: 'Design', label: 'Design', icon: 'palette' },
  { value: 'Marketing', label: 'Marketing', icon: 'bullhorn' },
  { value: 'Sales', label: 'Sales', icon: 'cash' },
  { value: 'Finance', label: 'Finance', icon: 'bank' },
  { value: 'Technology', label: 'Technology', icon: 'laptop' },
  { value: 'Other', label: 'Other', icon: 'dots-horizontal' }
];

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time', icon: 'calendar' },
  { value: 'part-time', label: 'Part-time', icon: 'calendar-clock' },
  { value: 'contract', label: 'Contract', icon: 'file-sign' },
  { value: 'internship', label: 'Internship', icon: 'school' }
];

const EXPERIENCE_LEVELS = [
  { value: 1, label: 'Entry Level', icon: 'baby' },
  { value: 2, label: 'Junior', icon: 'account' },
  { value: 3, label: 'Mid Level', icon: 'account-tie' },
  { value: 4, label: 'Senior', icon: 'account-star' },
  { value: 5, label: 'Expert', icon: 'account-star-outline' }
];

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
}

export default function PostJobScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [posting, setPosting] = useState(false);
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
    salary_max: ''
  });

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!form.title) newErrors.push('Job title is required');
    if (!form.company) newErrors.push('Company name is required');
    if (!form.location) newErrors.push('Location is required');
    if (!form.description) newErrors.push('Job description is required');
    if (!form.requirements) newErrors.push('Job requirements are required');
    if (!form.salary_min || !form.salary_max) newErrors.push('Please specify salary range');

    const minSalary = parseInt(form.salary_min);
    const maxSalary = parseInt(form.salary_max);

    if (form.salary_min && form.salary_max) {
      if (isNaN(minSalary) || isNaN(maxSalary)) {
        newErrors.push('Please enter valid salary numbers');
      } else if (minSalary > maxSalary) {
        newErrors.push('Minimum salary cannot be greater than maximum salary');
      }
    }

    if (newErrors.length > 0) {
      setError(newErrors.join('\n'));
      return false;
    }

    setError(null);
    return true;
  };

  const handlePost = async () => {
    try {
      if (!validateForm()) return;
      if (!session?.user?.id) return;

      setPosting(true);
      setError(null);

      // Get employer profile
      const { data: employer, error: employerError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (employerError) throw employerError;

      // Create job post
      const { error: createError } = await supabase
        .from('jobs')
        .insert({
          employer_id: employer.id,
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
          status: 'pending_review'
        });

      if (createError) throw createError;

      router.back();
    } catch (error) {
      console.error('Error posting job:', error);
      setError('Failed to post job');
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => setShowDiscardDialog(true)}
            />
            <Text variant="headlineMedium" style={styles.title}>Post New Job</Text>
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={() => setShowDiscardDialog(true)}
          />
        </View>
      </Surface>

      <Surface style={styles.formContainer} elevation={1}>
        <View style={styles.form}>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
              label="Job Title"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="briefcase" />}
            />

            <TextInput
              label="Company"
              value={form.company}
              onChangeText={(text) => setForm({ ...form, company: text })}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="domain" />}
            />

            <TextInput
              label="Location"
              value={form.location}
              onChangeText={(text) => setForm({ ...form, location: text })}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="map-marker" />}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Salary Range</Text>
            <View style={styles.row}>
              <TextInput
                label="Minimum Salary"
                value={form.salary_min}
                onChangeText={(text) => setForm({ ...form, salary_min: text })}
                style={[styles.input, styles.flex1]}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="currency-usd" />}
              />
              <TextInput
                label="Maximum Salary"
                value={form.salary_max}
                onChangeText={(text) => setForm({ ...form, salary_max: text })}
                style={[styles.input, styles.flex1]}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="currency-usd" />}
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Job Details</Text>
            
            <Text variant="bodyMedium" style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {JOB_CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  mode={form.category === category.value ? "contained" : "outlined"}
                  onPress={() => setForm({ ...form, category: category.value })}
                  icon={category.icon}
                  style={[
                    styles.categoryButton,
                    form.category === category.value && styles.selectedButton
                  ]}
                  labelStyle={styles.categoryButtonLabel}
                >
                  {category.label}
                </Button>
              ))}
            </View>

            <Text variant="bodyMedium" style={styles.label}>Employment Type</Text>
            <View style={styles.buttonGroup}>
              {EMPLOYMENT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  mode={form.employment_type === type.value ? "contained" : "outlined"}
                  onPress={() => setForm({ ...form, employment_type: type.value })}
                  icon={type.icon}
                  style={[
                    styles.typeButton,
                    form.employment_type === type.value && styles.selectedButton
                  ]}
                >
                  {type.label}
                </Button>
              ))}
            </View>

            <Text variant="bodyMedium" style={styles.label}>Experience Level</Text>
            <View style={styles.buttonGroup}>
              {EXPERIENCE_LEVELS.map((level) => (
                <Button
                  key={level.value}
                  mode={form.experience_level === level.value ? "contained" : "outlined"}
                  onPress={() => setForm({ ...form, experience_level: level.value })}
                  icon={level.icon}
                  style={[
                    styles.levelButton,
                    form.experience_level === level.value && styles.selectedButton
                  ]}
                >
                  {level.label}
                </Button>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Job Description</Text>
            <TextInput
              label="Description"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              multiline
              numberOfLines={6}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="text-box-outline" />}
            />

            <TextInput
              label="Requirements"
              value={form.requirements}
              onChangeText={(text) => setForm({ ...form, requirements: text })}
              multiline
              numberOfLines={6}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="format-list-checks" />}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#dc3545" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handlePost}
            loading={posting}
            disabled={posting}
            style={styles.postButton}
            contentStyle={styles.postButtonContent}
            icon="check"
          >
            Post Job
          </Button>
        </View>
      </Surface>

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
  header: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    color: '#666',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    minWidth: '48%',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    minWidth: '48%',
    marginBottom: 8,
  },
  levelButton: {
    flex: 1,
    minWidth: '48%',
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#4a5eff',
  },
  categoryButtonLabel: {
    fontSize: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe3e3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc3545',
    marginLeft: 8,
    flex: 1,
  },
  postButton: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#4a5eff',
  },
  postButtonContent: {
    height: 48,
  },
}); 