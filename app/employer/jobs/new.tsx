import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

interface JobPost {
  title: string;
  description: string;
  requirements: string;
  location: string;
  employment_type: EmploymentType;
  salary_min: string;
  salary_max: string;
  experience_level: number;
}

interface ValidationErrors {
  title?: string;
  location?: string;
  salary?: string;
  description?: string;
  requirements?: string;
}

export default function NewJobScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [job, setJob] = useState<JobPost>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    employment_type: 'full-time',
    salary_min: '',
    salary_max: '',
    experience_level: 1,
  });

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!job.title.trim()) {
      errors.title = 'Job title is required';
    }
    if (!job.location.trim()) {
      errors.location = 'Location is required';
    }
    if (!job.description.trim()) {
      errors.description = 'Job description is required';
    }
    if (!job.requirements.trim()) {
      errors.requirements = 'Requirements are required';
    }
    if (!job.salary_min || !job.salary_max) {
      errors.salary = 'Both salary fields are required';
    } else if (parseInt(job.salary_min) > parseInt(job.salary_max)) {
      errors.salary = 'Minimum salary cannot be greater than maximum salary';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePost = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setError(null);

      // Get employer profile id
      const { data: profile, error: profileError } = await supabase
        .from('employer_profiles')
        .select('id, company_name')
        .eq('user_id', session?.user.id)
        .single();

      if (profileError) {
        throw new Error('Please complete your employer profile first');
      }

      // Create job posting
      const { error: jobError } = await supabase
        .from('jobs')
        .insert({
          employer_id: profile.id,
          company: profile.company_name,
          title: job.title.trim(),
          location: job.location.trim(),
          description: job.description.trim(),
          requirements: job.requirements.trim(),
          employment_type: job.employment_type,
          salary_min: parseInt(job.salary_min),
          salary_max: parseInt(job.salary_max),
          experience_level: job.experience_level,
          status: 'active',
        });

      if (jobError) throw jobError;

      router.push('/employer');
    } catch (err) {
      console.error('Error posting job:', err);
      setError(err instanceof Error ? err.message : 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Post New Job
        </Text>

        <TextInput
          label="Job Title"
          value={job.title}
          onChangeText={(text) => setJob({ ...job, title: text })}
          error={!!validationErrors.title}
          style={styles.input}
        />
        {validationErrors.title && (
          <HelperText type="error">{validationErrors.title}</HelperText>
        )}

        <TextInput
          label="Location"
          value={job.location}
          onChangeText={(text) => setJob({ ...job, location: text })}
          error={!!validationErrors.location}
          style={styles.input}
        />
        {validationErrors.location && (
          <HelperText type="error">{validationErrors.location}</HelperText>
        )}

        <View style={styles.row}>
          <TextInput
            label="Min Salary"
            value={job.salary_min}
            onChangeText={(text) => setJob({ ...job, salary_min: text })}
            keyboardType="numeric"
            error={!!validationErrors.salary}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            label="Max Salary"
            value={job.salary_max}
            onChangeText={(text) => setJob({ ...job, salary_max: text })}
            keyboardType="numeric"
            error={!!validationErrors.salary}
            style={[styles.input, styles.halfInput]}
          />
        </View>
        {validationErrors.salary && (
          <HelperText type="error">{validationErrors.salary}</HelperText>
        )}

        <Text variant="bodyMedium" style={styles.label}>Employment Type</Text>
        <SegmentedButtons
          value={job.employment_type}
          onValueChange={(value) => 
            setJob({ ...job, employment_type: value as EmploymentType })
          }
          buttons={[
            { value: 'full-time', label: 'Full Time' },
            { value: 'part-time', label: 'Part Time' },
            { value: 'contract', label: 'Contract' },
          ]}
          style={styles.segmentedButton}
        />

        <TextInput
          label="Experience Level (1-5)"
          value={job.experience_level.toString()}
          onChangeText={(text) => {
            const level = parseInt(text) || 1;
            setJob({ ...job, experience_level: Math.min(Math.max(level, 1), 5) });
          }}
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Job Description"
          value={job.description}
          onChangeText={(text) => setJob({ ...job, description: text })}
          multiline
          numberOfLines={4}
          error={!!validationErrors.description}
          style={styles.input}
        />
        {validationErrors.description && (
          <HelperText type="error">{validationErrors.description}</HelperText>
        )}

        <TextInput
          label="Requirements"
          value={job.requirements}
          onChangeText={(text) => setJob({ ...job, requirements: text })}
          multiline
          numberOfLines={4}
          error={!!validationErrors.requirements}
          style={styles.input}
        />
        {validationErrors.requirements && (
          <HelperText type="error">{validationErrors.requirements}</HelperText>
        )}

        {error && <HelperText type="error">{error}</HelperText>}

        <Button
          mode="contained"
          onPress={handlePost}
          loading={loading}
          style={styles.button}
        >
          Post Job
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    marginBottom: 10,
  },
  segmentedButton: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
}); 