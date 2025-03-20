import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Card, Chip, Divider, Portal, Modal, Dialog } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingScreen from '../../../components/LoadingScreen';

type Job = {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  experience_level: number;
  employer_id: string;
  employer: {
    company_name: string;
    location: string;
  } | null;
};

type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected';

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  created_at: string;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    console.log('Job ID from params:', id); // Debug log
    fetchJobDetails();
    checkApplicationStatus();
    checkPermissions();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching job with ID:', id);

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          requirements,
          employer_id,
          experience_level,
          employer:employer_profiles (
            company_name,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (jobError) {
        console.error('Error fetching job:', jobError);
        throw jobError;
      }

      if (!jobData) {
        throw new Error('Job not found');
      }

      console.log('Job data:', jobData);
      
      // Transform the data to match the Job type
      const transformedJob: Job = {
        id: jobData.id,
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        employer_id: jobData.employer_id,
        experience_level: jobData.experience_level,
        employer: jobData.employer?.[0] || null
      };

      setJob(transformedJob);
    } catch (error) {
      console.error('Error in fetchJobDetails:', error);
      setError(error instanceof Error ? error.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      if (!session?.user?.id) return;

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile) return;

      // Check if user has already applied
      const { data: application, error: applicationError } = await supabase
        .from('applications')
        .select('status')
        .eq('job_id', id)
        .eq('applicant_profile_id', profile.id)
        .single();

      if (applicationError) return;

      if (application) {
        setHasApplied(true);
        setApplicationStatus(application.status);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error('Please login to apply');
      }

      // Get applicant profile with error logging
      const { data: applicantProfile, error: profileError } = await supabase
        .from('applicant_profiles')
        .select('id, full_name')
        .eq('user_id', session.user.id)
        .single();

      console.log('Applicant profile:', applicantProfile, 'Error:', profileError);

      if (profileError || !applicantProfile) {
        console.error('Profile error:', profileError);
        throw new Error('Please complete your profile before applying');
      }

      // Check for existing application with error logging
      const { data: existingApp, error: checkError } = await supabase
        .from('applications')
        .select('id, status')
        .eq('job_id', id)
        .eq('applicant_profile_id', applicantProfile.id)
        .maybeSingle();

      console.log('Existing application:', existingApp, 'Error:', checkError);

      if (checkError) {
        console.error('Check error:', checkError);
        throw new Error('Error checking application status');
      }

      if (existingApp) {
        // Instead of throwing an error, update the UI state
        setHasApplied(true);
        setApplicationStatus(existingApp.status);
        setError('You have already applied for this job. You can view the status in your applications.');
        return;
      }

      // Submit application with error logging
      const { data: newApplication, error: submitError } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          applicant_profile_id: applicantProfile.id,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('New application:', newApplication, 'Error:', submitError);

      if (submitError) {
        console.error('Submit error:', submitError);
        throw new Error(`Failed to submit application: ${submitError.message}`);
      }

      // Update local state
      setHasApplied(true);
      setApplicationStatus('pending');
      setConfirmDialog(true);
    } catch (error) {
      console.error('Application error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const getExperienceLevelText = (level: number) => {
    const levels = ['Entry', 'Junior', 'Mid', 'Senior', 'Expert'];
    return levels[level - 1] || 'Unknown';
  };

  // Add this function to help debug permission issues
  const checkPermissions = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Check if user has an applicant profile
      const { data: profile, error: profileError } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      console.log('Profile check:', { profile, error: profileError });

      // Check if user can read applications
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('id')
        .limit(1);
      
      console.log('Applications read check:', { apps, error: appsError });

      // Check if user can write to applications
      const { error: writeError } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          applicant_profile_id: profile?.id,
          status: 'pending'
        })
        .select()
        .single();
      
      console.log('Applications write check:', { error: writeError });
    } catch (error) {
      console.error('Permissions check error:', error);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!job) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.error}>
              {error || 'Job not found'}
            </Text>
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{job.title}</Text>
          {job.employer && (
            <>
              <Text variant="titleMedium" style={styles.company}>
                {job.employer.company_name}
              </Text>
              <Text variant="bodyMedium" style={styles.location}>
                {job.employer.location}
              </Text>
            </>
          )}
          
          {job.description && (
            <>
              <Text variant="titleMedium" style={styles.section}>
                Job Description
              </Text>
              <Text variant="bodyMedium">{job.description}</Text>
            </>
          )}
          
          {job.requirements && (
            <>
              <Text variant="titleMedium" style={styles.section}>
                Requirements
              </Text>
              <Text variant="bodyMedium">{job.requirements}</Text>
            </>
          )}

          <Text variant="titleMedium" style={styles.section}>
            Experience Level
          </Text>
          <Text variant="bodyMedium">
            {getExperienceLevelText(job.experience_level)}
          </Text>

          {error && (
            <Card style={[styles.card, styles.errorCard]}>
              <Card.Content>
                <Text style={styles.error}>{error}</Text>
              </Card.Content>
            </Card>
          )}

          {!hasApplied ? (
            <Button
              mode="contained"
              onPress={handleApply}
              loading={applying}
              disabled={applying}
              style={styles.applyButton}
            >
              Apply Now
            </Button>
          ) : (
            <View style={styles.appliedContainer}>
              <Text variant="bodyMedium" style={styles.appliedText}>
                You have already applied for this position
              </Text>
              <Chip mode="outlined" style={styles.statusChip}>
                Status: {applicationStatus || 'Pending'}
              </Chip>
            </View>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={confirmDialog}
          onDismiss={() => {
            setConfirmDialog(false);
            router.replace('/(app)/applications');
          }}
        >
          <Dialog.Title>Application Submitted</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your application has been successfully submitted. You can track its status in your applications.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setConfirmDialog(false);
                router.replace('/(app)/applications');
              }}
            >
              View My Applications
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
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  company: {
    marginTop: 8,
    color: '#666',
  },
  location: {
    marginTop: 4,
    color: '#888',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  applyButton: {
    marginTop: 24,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    marginTop: 16,
  },
  error: {
    color: '#d32f2f',
  },
  appliedContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  appliedText: {
    marginBottom: 8,
    color: '#666',
  },
  statusChip: {
    backgroundColor: '#f0f0f0',
  },
  button: {
    marginTop: 24,
  },
}); 