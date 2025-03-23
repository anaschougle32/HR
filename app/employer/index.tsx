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
  Portal, 
  Dialog,
  Surface
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NotificationButton from '../../components/NotificationButton';

interface JobStats {
  total_jobs: number;
  total_applications: number;
  total_shortlisted: number;
  total_hired: number;
  pending_review_jobs: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
  applications_count: number;
  shortlisted_count: number;
}

export default function EmployerDashboardScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<JobStats>({
    total_jobs: 0,
    total_applications: 0,
    total_shortlisted: 0,
    total_hired: 0,
    pending_review_jobs: 0
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get employer profile
      const { data: employer, error: employerError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (employerError) throw employerError;

      // Get stats from the view
      const { data: statsData, error: statsError } = await supabase
        .from('employer_job_stats')
        .select('*')
        .eq('employer_id', employer.id)
        .single();

      if (statsError) throw statsError;

      // Get recent jobs with application counts
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          created_at,
          applications:applications(count),
          shortlisted:applications(count)
        `)
        .eq('employer_id', employer.id)
        .eq('applications.status', 'shortlisted')
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) throw jobsError;

      const transformedJobs: RecentJob[] = jobs.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        created_at: job.created_at,
        applications_count: job.applications?.length || 0,
        shortlisted_count: job.shortlisted?.length || 0
      }));

      setStats(statsData);
      setRecentJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a5eff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>
          <View style={styles.headerRight}>
            <NotificationButton />
            <IconButton
              icon="logout"
              size={24}
              onPress={() => setConfirmSignOut(true)}
            />
          </View>
        </View>
      </Surface>

      <View style={styles.statsGrid}>
        <Card style={[styles.statsCard, { backgroundColor: '#4a5eff' }]}>
          <Card.Content>
            <MaterialCommunityIcons name="briefcase-outline" size={24} color="#fff" />
            <Text variant="headlineMedium" style={styles.statNumber}>{stats.total_jobs}</Text>
            <Text style={styles.statLabel}>Jobs Posted</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statsCard, { backgroundColor: '#00c853' }]}>
          <Card.Content>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#fff" />
            <Text variant="headlineMedium" style={styles.statNumber}>{stats.total_applications}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </Card.Content>
        </Card>

        <Card 
          style={[styles.statsCard, { backgroundColor: '#ff9d4a' }]}
          onPress={() => router.push('/employer/applications/shortlisted')}
        >
          <Card.Content>
            <MaterialCommunityIcons name="account-check-outline" size={24} color="#fff" />
            <Text variant="headlineMedium" style={styles.statNumber}>{stats.total_shortlisted}</Text>
            <Text style={styles.statLabel}>Shortlisted</Text>
          </Card.Content>
        </Card>

        <Card 
          style={[styles.statsCard, { backgroundColor: '#757575' }]}
          onPress={() => router.push('/employer/jobs/pending')}
        >
          <Card.Content>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#fff" />
            <Text variant="headlineMedium" style={styles.statNumber}>{stats.pending_review_jobs}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => router.push('/employer/jobs/post')}
          style={[styles.actionButton, { backgroundColor: '#4a5eff' }]}
          icon="plus"
        >
          Post New Job
        </Button>
        <Button
          mode="contained"
          onPress={() => router.push('/employer/applications/shortlisted')}
          style={[styles.actionButton, { backgroundColor: '#00c853' }]}
          icon="account-check"
        >
          Review Shortlisted
        </Button>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Recent Job Posts</Text>
          <Button 
            mode="text" 
            onPress={() => router.push('/employer/jobs')}
            textColor="#4a5eff"
          >
            View All
          </Button>
        </View>

        {recentJobs.map(job => (
          <Card 
            key={job.id}
            style={styles.jobCard}
            onPress={() => router.push(`/employer/jobs/${job.id}`)}
          >
            <Card.Content>
              <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                  <Text variant="titleMedium">{job.title}</Text>
                  <Text variant="bodySmall" style={styles.dateText}>
                    Posted on {new Date(job.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Chip 
                  style={[styles.statusChip, { 
                    backgroundColor: job.status === 'active' ? '#00c853' : 
                                   job.status === 'pending_review' ? '#ff9d4a' : '#757575'
                  }]}
                >
                  {job.status}
                </Chip>
              </View>
              <View style={styles.jobStats}>
                <Chip icon="file-document" style={styles.statChip}>
                  {job.applications_count} Applications
                </Chip>
                <Chip icon="account-check" style={styles.statChip}>
                  {job.shortlisted_count} Shortlisted
                </Chip>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Portal>
        <Dialog
          visible={confirmSignOut}
          onDismiss={() => setConfirmSignOut(false)}
        >
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you sure you want to sign out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmSignOut(false)}>Cancel</Button>
            <Button onPress={handleSignOut}>Sign Out</Button>
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
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    color: '#666',
  },
  statsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsCard: {
    width: '48%',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 8,
  },
  statNumber: {
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
  },
  actionButtons: {
    padding: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobCard: {
    marginBottom: 8,
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
  },
  dateText: {
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    marginLeft: 8,
  },
  jobStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    backgroundColor: '#f0f2ff',
  },
}); 