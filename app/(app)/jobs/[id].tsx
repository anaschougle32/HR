import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import { Text, Button, Card, Chip, Divider, Portal, Modal, Dialog, Avatar, IconButton, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingScreen from '../../../components/LoadingScreen';
import { Ionicons } from '@expo/vector-icons';

type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  experience_level: number;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  employment_type: string;
  created_at: string;
  status: string;
}

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
}

export default function JobDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    const jobId = params.id;
    if (!jobId || jobId === 'index') {
      router.replace('/(app)/');
      return;
    }
    fetchJobDetails(jobId as string);
    if (session?.user) {
      checkApplicationStatus(jobId as string);
    }
  }, [params.id, session]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      console.log('Fetching job details for ID:', jobId);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          requirements,
          experience_level,
          company,
          location,
          salary_min,
          salary_max,
          employment_type,
          created_at,
          status
        `)
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Job not found');
      }

      console.log('Job details:', data);
      setJob(data);
    } catch (error) {
      console.error('Error in fetchJobDetails:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async (jobId: string) => {
    if (!session?.user?.id) return;

    try {
      // Get applicant profile
      const { data: profile, error: profileError } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      console.log('Profile check:', { profile, error: profileError });

      if (profileError) throw profileError;
      if (!profile) return;

      // Check if already applied
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('id, status, created_at')
        .eq('job_id', jobId)
        .eq('applicant_id', profile.id);

      console.log('Applications read check:', { apps: applications, error: appsError });

      if (appsError) throw appsError;
      if (applications && applications.length > 0) {
        setApplication(applications[0]);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    if (!session?.user?.id || !job) return;

    try {
      setApplying(true);
      setError(null);

      // Get applicant profile
      const { data: profile, error: profileError } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) {
        router.push('/profile');
        return;
      }

      // Create application
      const { data: newApplication, error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          applicant_id: profile.id,
          status: 'pending'
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      setApplication(newApplication);
      router.push('/applications');
    } catch (error) {
      console.error('Error applying for job:', error);
      setError('Failed to submit application');
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
          job_id: params.id,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a5eff" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorText}>
              {error || 'Job not found'}
            </Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
              Go Back
            </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
      <View style={styles.header}>
        <Avatar.Text 
              size={60} 
              label={job.company.charAt(0)} 
              style={styles.companyLogo}
            />
            <View style={styles.headerContent}>
              <Text variant="titleLarge" style={styles.title}>{job.title}</Text>
              <Text variant="titleMedium" style={styles.company}>{job.company}</Text>
            <Text variant="bodyMedium" style={styles.location}>
                <Ionicons name="location-outline" size={16} color="#666" /> {job.location}
            </Text>
          </View>
          </View>

          <View style={styles.tags}>
            <Chip style={styles.jobTypeChip}>
              {job.employment_type}
            </Chip>
            <Chip style={styles.experienceLevelChip}>
              {getExperienceLevelText(job.experience_level)}
            </Chip>
            {job.salary_min && job.salary_max && (
              <Chip style={styles.salaryChip}>
                ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}/year
              </Chip>
        )}
      </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
                  {job.description}
                </Text>
              </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Requirements</Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
                  {job.requirements}
                </Text>
              </View>
          </Card.Content>
        </Card>

      {session ? (
        <View style={styles.actions}>
          {application ? (
            <Card style={styles.applicationCard}>
          <Card.Content>
                <Text variant="titleMedium" style={styles.applicationStatus}>
                  Application Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Text>
                <Text variant="bodySmall" style={styles.applicationDate}>
                  Applied on: {new Date(application.created_at).toLocaleDateString()}
                </Text>
          </Card.Content>
        </Card>
          ) : (
          <Button
            mode="contained"
            onPress={handleApply}
            loading={applying}
            disabled={applying}
            style={styles.applyButton}
              contentStyle={styles.applyButtonContent}
          >
            Apply Now
          </Button>
          )}
        </View>
        ) : (
          <Button
            mode="contained"
          onPress={() => router.push('/(auth)/login')}
          style={styles.applyButton}
          contentStyle={styles.applyButtonContent}
        >
          Sign in to Apply
          </Button>
        )}
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    marginBottom: 16,
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#4a5eff',
  },
  card: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  companyLogo: {
    backgroundColor: '#e6e6fe',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  company: {
    color: '#666',
    marginBottom: 4,
  },
  location: {
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  jobTypeChip: {
    backgroundColor: '#e6f7ff',
  },
  experienceLevelChip: {
    backgroundColor: '#edf7ed',
  },
  salaryChip: {
    backgroundColor: '#e6e6fe',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionContent: {
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    paddingTop: 0,
  },
  applicationCard: {
    borderRadius: 12,
    backgroundColor: '#f5f7ff',
    marginBottom: 16,
  },
  applicationStatus: {
    color: '#4a5eff',
    marginBottom: 4,
  },
  applicationDate: {
    color: '#666',
  },
  applyButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#4a5eff',
  },
  applyButtonContent: {
    height: 48,
  },
}); 