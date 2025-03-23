import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Searchbar, 
  Chip, 
  IconButton, 
  ActivityIndicator, 
  Surface,
  Portal,
  Dialog
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  category: string;
  employment_type: string;
  experience_level: number;
  salary_min: number;
  salary_max: number;
  status: 'pending_review' | 'active' | 'rejected' | 'closed';
  created_at: string;
  applications_count: number;
}

export default function EmployerJobsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    try {
      if (!session?.user?.id) return;

      // Get employer profile
      const { data: employer, error: employerError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (employerError) throw employerError;

      // Get all jobs with application counts
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*, applications:applications(count)')
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Transform the data to include applications_count
      const transformedJobs = jobs.map(job => ({
        ...job,
        applications_count: job.applications?.[0]?.count || 0
      }));

      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [session]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleDelete = async () => {
    if (!selectedJob) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', selectedJob.id);

      if (error) throw error;

      setJobs(jobs.filter(job => job.id !== selectedJob.id));
      setShowDeleteDialog(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const confirmDelete = (job: Job) => {
    setSelectedJob(job);
    setShowDeleteDialog(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#28a745';
      case 'pending_review': return '#ffc107';
      case 'rejected': return '#dc3545';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getExperienceLabel = (level: number) => {
    switch (level) {
      case 1: return 'Entry Level';
      case 2: return 'Junior';
      case 3: return 'Mid Level';
      case 4: return 'Senior';
      case 5: return 'Expert';
      default: return 'Not Specified';
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a5eff" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.title}>Posted Jobs</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/employer/jobs/post')}
            style={styles.postButton}
            icon="plus"
          >
            Post New Job
          </Button>
        </View>
      </Surface>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search jobs"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.content}>
        {filteredJobs.map(job => (
          <Card key={job.id} style={styles.jobCard}>
            <Card.Content>
              <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                  <Text variant="titleLarge" style={styles.jobTitle}>{job.title}</Text>
                  <Text variant="bodyLarge">{job.company}</Text>
                  <View style={styles.locationRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.locationText}>{job.location}</Text>
                  </View>
                </View>
                <Chip 
                  mode="outlined" 
                  style={[styles.statusChip, { borderColor: getStatusColor(job.status) }]}
                  textStyle={{ color: getStatusColor(job.status) }}
                >
                  {job.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>

              <View style={styles.detailsRow}>
                <Chip icon="briefcase" style={styles.chip}>
                  {job.employment_type.replace('_', ' ').toUpperCase()}
                </Chip>
                <Chip icon="account-tie" style={styles.chip}>
                  {getExperienceLabel(job.experience_level)}
                </Chip>
                <Chip icon="tag" style={styles.chip}>
                  {job.category}
                </Chip>
              </View>

              <View style={styles.salaryRow}>
                <MaterialCommunityIcons name="currency-usd" size={16} color="#666" />
                <Text variant="bodyMedium" style={styles.salaryText}>
                  {formatSalary(job.salary_min)} - {formatSalary(job.salary_max)}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <Text variant="bodyMedium" style={styles.applicationsText}>
                  {job.applications_count} Applications
                </Text>
                <View style={styles.actions}>
                  <IconButton
                    icon="pencil"
                    mode="outlined"
                    size={20}
                    onPress={() => router.push(`/employer/jobs/edit/${job.id}`)}
                  />
                  <IconButton
                    icon="delete"
                    mode="outlined"
                    size={20}
                    onPress={() => confirmDelete(job)}
                    style={styles.deleteButton}
                  />
                  <Button
                    mode="contained-tonal"
                    onPress={() => router.push(`/employer/jobs/details/${job.id}`)}
                  >
                    View Details
                  </Button>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Job Post?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this job post? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#dc3545">Delete</Button>
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
  postButton: {
    borderRadius: 8,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchbar: {
    elevation: 2,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  jobCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
    marginRight: 16,
  },
  jobTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    marginLeft: 4,
    color: '#666',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#f0f2ff',
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  salaryText: {
    marginLeft: 4,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  applicationsText: {
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    marginRight: 8,
  },
}); 