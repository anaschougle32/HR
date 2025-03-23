import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Button, 
  Surface,
  Chip,
  Portal,
  Dialog,
  IconButton,
  Card,
  ActivityIndicator,
  Divider
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0
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

      setJob(job);

      // Get application stats
      const { data: applications, error: statsError } = await supabase
        .from('applications')
        .select('status')
        .eq('job_id', id);

      if (statsError) throw statsError;

      const stats = applications.reduce((acc, curr) => {
        acc.total++;
        if (curr.status === 'pending') acc.pending++;
        else if (curr.status === 'shortlisted') acc.shortlisted++;
        else if (curr.status === 'rejected') acc.rejected++;
        else if (curr.status === 'hired') acc.hired++;
        return acc;
      }, {
        total: 0,
        pending: 0,
        shortlisted: 0,
        rejected: 0,
        hired: 0
      });

      setApplicationStats(stats);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id, session]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobDetails();
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleEdit = () => {
    router.push(`/employer/jobs/edit/${id}`);
  };

  const handleViewApplications = (filter?: string) => {
    if (filter) {
      router.push(`/employer/jobs/${id}/applications?status=${filter}`);
    } else {
      router.push(`/employer/jobs/${id}/applications`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text variant="headlineMedium" style={styles.title}>{job.title}</Text>
            <Chip 
              mode="outlined" 
              style={[styles.statusChip, { borderColor: getStatusColor(job.status) }]}
              textStyle={{ color: getStatusColor(job.status) }}
            >
              {job.status.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon="pencil"
              size={24}
              onPress={handleEdit}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={24}
              onPress={() => setShowDeleteDialog(true)}
              style={styles.actionButton}
            />
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Application Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{applicationStats.total}</Text>
                <Text variant="bodySmall">Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{applicationStats.pending}</Text>
                <Text variant="bodySmall">Pending</Text>
              </View>
              <TouchableOpacity 
                style={styles.statItem} 
                onPress={() => handleViewApplications('shortlisted')}
              >
                <Text variant="headlineMedium" style={styles.clickableStatNumber}>
                  {applicationStats.shortlisted}
                </Text>
                <Text variant="bodySmall" style={styles.clickableStatLabel}>
                  Shortlisted
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem} 
                onPress={() => handleViewApplications('hired')}
              >
                <Text variant="headlineMedium" style={styles.clickableStatNumber}>
                  {applicationStats.hired}
                </Text>
                <Text variant="bodySmall" style={styles.clickableStatLabel}>
                  Hired
                </Text>
              </TouchableOpacity>
            </View>
            <Button
              mode="contained"
              onPress={() => handleViewApplications()}
              style={styles.viewApplicationsButton}
            >
              View All Applications
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Job Details</Text>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="office-building" size={20} color="#666" />
              <Text variant="bodyMedium">{job.company}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
              <Text variant="bodyMedium">{job.location}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#666" />
              <Text variant="bodyMedium">
                {formatSalary(job.salary_min)} - {formatSalary(job.salary_max)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="briefcase" size={20} color="#666" />
              <Text variant="bodyMedium">{job.employment_type.replace('_', ' ').toUpperCase()}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-tie" size={20} color="#666" />
              <Text variant="bodyMedium">{getExperienceLabel(job.experience_level)}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={20} color="#666" />
              <Text variant="bodyMedium">{job.category}</Text>
            </View>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Description</Text>
            <Text variant="bodyMedium" style={styles.description}>{job.description}</Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>Requirements</Text>
            <Text variant="bodyMedium" style={styles.description}>{job.requirements}</Text>
          </Card.Content>
        </Card>
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
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  actionButton: {
    margin: -8,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
  },
  detailsCard: {
    backgroundColor: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  clickableStatNumber: {
    color: '#4a5eff',
  },
  clickableStatLabel: {
    color: '#4a5eff',
  },
  viewApplicationsButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  description: {
    lineHeight: 20,
    marginBottom: 16,
  },
}); 