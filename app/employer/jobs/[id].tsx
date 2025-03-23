import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  TextInput, 
  SegmentedButtons, 
  Chip, 
  Portal, 
  Dialog, 
  HelperText,
  IconButton,
  Surface
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface JobDetails {
  id: string;
  title: string;
  description: string;
  requirements: string;
  experience_level: number;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  category: string;
  company: string;
  location: string;
  salary_min: number;
  salary_max: number;
  created_at: string;
  status: 'pending_review' | 'active' | 'rejected' | 'closed';
}

interface ApplicationStats {
  total: number;
  pending: number;
  shortlisted: number;
  rejected: number;
  hired: number;
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

      // Get application stats
      const { data: applications, error: statsError } = await supabase
        .from('applications')
        .select('status')
        .eq('job_id', id);

      if (statsError) throw statsError;

      const applicationStats = applications?.reduce((acc, curr) => {
        acc.total++;
        if (curr.status === 'pending') acc.pending++;
        if (curr.status === 'shortlisted') acc.shortlisted++;
        if (curr.status === 'rejected') acc.rejected++;
        if (curr.status === 'hired') acc.hired++;
        return acc;
      }, {
        total: 0,
        pending: 0,
        shortlisted: 0,
        rejected: 0,
        hired: 0
      } as ApplicationStats);

      setJob(jobData);
      setStats(applicationStats);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchJobDetails();
  }, [id, session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobDetails();
    setRefreshing(false);
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job?.id);

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
    } finally {
      setSaving(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text variant="headlineMedium" style={styles.title}>{job.title}</Text>
            <Text variant="titleMedium" style={styles.company}>{job.company}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              <Text variant="bodyMedium" style={styles.location}>{job.location}</Text>
            </View>
          </View>
          <View style={styles.statusSection}>
            <Chip 
              mode="flat" 
              style={[styles.statusChip, { 
                backgroundColor: job.status === 'active' ? '#e3f2fd' : 
                               job.status === 'pending_review' ? '#fff3e0' :
                               job.status === 'rejected' ? '#ffebee' : '#f5f5f5'
              }]}
            >
              {job.status}
            </Chip>
            <Text variant="bodySmall" style={styles.date}>
              Posted on {new Date(job.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Surface>

      <View style={styles.statsContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Application Statistics</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
          <Card.Content>
              <Text variant="headlineMedium" style={styles.statNumber}>{stats.total}</Text>
              <Text variant="bodyMedium">Total Applications</Text>
          </Card.Content>
        </Card>
          <Card style={styles.statCard}>
          <Card.Content>
              <Text variant="headlineMedium" style={styles.statNumber}>{stats.shortlisted}</Text>
              <Text variant="bodyMedium">Shortlisted</Text>
          </Card.Content>
        </Card>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="headlineMedium" style={styles.statNumber}>{stats.hired}</Text>
              <Text variant="bodyMedium">Hired</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      <Card style={styles.detailsCard}>
          <Card.Content>
          <View style={styles.tagsContainer}>
            <Chip style={styles.tag} icon="briefcase-outline">{job.employment_type}</Chip>
            <Chip style={styles.tag} icon="folder-outline">{job.category}</Chip>
            <Chip style={styles.tag} icon="star-outline">Level {job.experience_level}</Chip>
          </View>

          <View style={styles.salarySection}>
            <MaterialCommunityIcons name="currency-usd" size={20} color="#666" />
            <Text variant="titleMedium" style={styles.salary}>
              {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} / year
            </Text>
          </View>

          <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>

          <Text variant="titleMedium" style={styles.sectionTitle}>Requirements</Text>
          <Text style={styles.description}>{job.requirements}</Text>
          </Card.Content>
        </Card>

      <View style={styles.actions}>
        <Button 
          mode="contained" 
          onPress={() => router.push(`/employer/jobs/edit/${job.id}`)}
          style={styles.editButton}
          icon="pencil"
        >
          Edit Job
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => setShowDeleteDialog(true)}
          style={styles.deleteButton}
          textColor="#dc3545"
          icon="delete"
        >
          Delete Job
        </Button>
      </View>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Job</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this job posting? This action cannot be undone.
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
    gap: 8,
  },
  titleSection: {
    gap: 4,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  company: {
    color: '#4a5eff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: '#666',
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusChip: {
    borderRadius: 16,
  },
  date: {
    color: '#666',
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#4a5eff',
    marginBottom: 4,
  },
  detailsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f2ff',
  },
  salarySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  salary: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  description: {
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  editButton: {
    borderRadius: 8,
  },
  deleteButton: {
    borderRadius: 8,
    borderColor: '#dc3545',
  },
}); 