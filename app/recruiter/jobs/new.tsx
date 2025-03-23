import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Chip, Portal, Dialog } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const JOB_CATEGORIES = [
  'Design',
  'Development',
  'Marketing',
  'Sales',
  'Finance',
  'HR',
  'Technology',
  'Other'
];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship'
];

const EXPERIENCE_LEVELS = [
  'Entry',
  'Junior',
  'Mid',
  'Senior',
  'Expert'
];

interface JobForm {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  category: string;
  employment_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
}

export default function NewJobScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof JobForm, string>>>({});
  
  const [form, setForm] = useState<JobForm>({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    category: '',
    employment_type: '',
    experience_level: '',
    salary_min: '',
    salary_max: ''
  });

  const validateForm = () => {
    const newErrors: Partial<Record<keyof JobForm, string>> = {};

    if (!form.title) newErrors.title = 'Job title is required';
    if (!form.company) newErrors.company = 'Company name is required';
    if (!form.location) newErrors.location = 'Location is required';
    if (!form.description) newErrors.description = 'Job description is required';
    if (!form.requirements) newErrors.requirements = 'Job requirements are required';
    if (!form.category) newErrors.category = 'Job category is required';
    if (!form.employment_type) newErrors.employment_type = 'Employment type is required';
    if (!form.experience_level) newErrors.experience_level = 'Experience level is required';
    
    if (form.salary_min && form.salary_max) {
      const min = parseInt(form.salary_min);
      const max = parseInt(form.salary_max);
      if (min > max) {
        newErrors.salary_min = 'Minimum salary cannot be greater than maximum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Get recruiter profile to get employer_id
      const { data: recruiter, error: recruiterError } = await supabase
        .from('recruiter_profiles')
        .select('employer_id')
        .eq('user_id', session?.user?.id)
        .single();

      if (recruiterError) throw recruiterError;

      // Create new job
      const { error: jobError } = await supabase
        .from('jobs')
        .insert({
          title: form.title,
          company: form.company,
          location: form.location,
          description: form.description,
          requirements: form.requirements,
          category: form.category,
          employment_type: form.employment_type,
          experience_level: form.experience_level,
          salary_min: parseInt(form.salary_min) || null,
          salary_max: parseInt(form.salary_max) || null,
          employer_id: recruiter.employer_id,
          status: 'active',
          posted_by: session?.user?.id
        });

      if (jobError) throw jobError;

      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>Post New Job</Text>
        
        <TextInput
          label="Job Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          style={styles.input}
          error={!!errors.title}
        />
        <HelperText type="error" visible={!!errors.title}>
          {errors.title}
        </HelperText>

        <TextInput
          label="Company"
          value={form.company}
          onChangeText={(text) => setForm({ ...form, company: text })}
          style={styles.input}
          error={!!errors.company}
        />
        <HelperText type="error" visible={!!errors.company}>
          {errors.company}
        </HelperText>

        <TextInput
          label="Location"
          value={form.location}
          onChangeText={(text) => setForm({ ...form, location: text })}
          style={styles.input}
          error={!!errors.location}
        />
        <HelperText type="error" visible={!!errors.location}>
          {errors.location}
        </HelperText>

        <Text variant="titleMedium" style={styles.sectionTitle}>Job Category</Text>
        <View style={styles.chipGroup}>
          {JOB_CATEGORIES.map((category) => (
            <Chip
              key={category}
              selected={form.category === category}
              onPress={() => setForm({ ...form, category })}
              style={styles.chip}
              showSelectedCheck
            >
              {category}
            </Chip>
          ))}
        </View>
        <HelperText type="error" visible={!!errors.category}>
          {errors.category}
        </HelperText>

        <Text variant="titleMedium" style={styles.sectionTitle}>Employment Type</Text>
        <View style={styles.chipGroup}>
          {EMPLOYMENT_TYPES.map((type) => (
            <Chip
              key={type}
              selected={form.employment_type === type}
              onPress={() => setForm({ ...form, employment_type: type })}
              style={styles.chip}
              showSelectedCheck
            >
              {type}
            </Chip>
          ))}
        </View>
        <HelperText type="error" visible={!!errors.employment_type}>
          {errors.employment_type}
        </HelperText>

        <Text variant="titleMedium" style={styles.sectionTitle}>Experience Level</Text>
        <View style={styles.chipGroup}>
          {EXPERIENCE_LEVELS.map((level) => (
            <Chip
              key={level}
              selected={form.experience_level === level}
              onPress={() => setForm({ ...form, experience_level: level })}
              style={styles.chip}
              showSelectedCheck
            >
              {level}
            </Chip>
          ))}
        </View>
        <HelperText type="error" visible={!!errors.experience_level}>
          {errors.experience_level}
        </HelperText>

        <View style={styles.salaryContainer}>
          <TextInput
            label="Minimum Salary"
            value={form.salary_min}
            onChangeText={(text) => setForm({ ...form, salary_min: text })}
            style={[styles.input, styles.salaryInput]}
            keyboardType="numeric"
            error={!!errors.salary_min}
          />
          <TextInput
            label="Maximum Salary"
            value={form.salary_max}
            onChangeText={(text) => setForm({ ...form, salary_max: text })}
            style={[styles.input, styles.salaryInput]}
            keyboardType="numeric"
            error={!!errors.salary_max}
          />
        </View>
        <HelperText type="error" visible={!!errors.salary_min}>
          {errors.salary_min}
        </HelperText>

        <TextInput
          label="Job Description"
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          style={styles.input}
          multiline
          numberOfLines={4}
          error={!!errors.description}
        />
        <HelperText type="error" visible={!!errors.description}>
          {errors.description}
        </HelperText>

        <TextInput
          label="Requirements"
          value={form.requirements}
          onChangeText={(text) => setForm({ ...form, requirements: text })}
          style={styles.input}
          multiline
          numberOfLines={4}
          error={!!errors.requirements}
        />
        <HelperText type="error" visible={!!errors.requirements}>
          {errors.requirements}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          disabled={loading}
        >
          Post Job
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showSuccess}
          onDismiss={() => {
            setShowSuccess(false);
            router.replace('/recruiter');
          }}
        >
          <Dialog.Title>Success</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your job has been posted successfully!
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setShowSuccess(false);
                router.replace('/recruiter');
              }}
            >
              Done
            </Button>
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
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  salaryContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  salaryInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: '#4a5eff',
  },
}); 