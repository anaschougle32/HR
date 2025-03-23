import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, IconButton, ActivityIndicator, Avatar, Portal, Dialog } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface JobStats {
  total: number;
  active: number;
  pending_review: number;
  total_applications: number;
}

interface RecentApplication {
  id: string;
  created_at: string;
  status: string;
  job: {
    title: string;
    company: string;
  };
  applicant: {
    full_name: string;
    title: string;
  };
}

export default function RecruiterDashboardScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobStats, setJobStats] = useState<JobStats>({ 
    total: 0, 
    active: 0, 
    pending_review: 0,
    total_applications: 0
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get recruiter profile
      const { data: recruiter, error: recruiterError } = await supabase
        .from('recruiter_profiles')
        .select('id, employer_id')
        .eq('user_id', session?.user?.id)
        .single();

      if (recruiterError) throw recruiterError;

      // Get job stats
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('employer_id', recruiter.employer_id);

      if (jobsError) throw jobsError;

      // Get total applications count
      const { count: applicationsCount, error: countError } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (countError) throw countError;

      const stats = {
        total: jobs.length,
        active: jobs.filter(job => job.status === 'active').length,
        pending_review: jobs.filter(job => job.status === 'pending_review').length,
        total_applications: applicationsCount || 0
      };

      // Get recent applications
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          status,
          jobs (
            title,
            company
          ),
          applicant_profiles (
            full_name,
            title
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (applicationsError) throw applicationsError;

      // Transform the data to match the RecentApplication interface
      const transformedApplications: RecentApplication[] = applications.map((app: any) => ({
        id: app.id,
        created_at: app.created_at,
        status: app.status,
        job: {
          title: app.jobs?.title || 'Unknown Job',
          company: app.jobs?.company || 'Unknown Company'
        },
        applicant: {
          full_name: app.applicant_profiles?.full_name || 'Unknown Applicant',
          title: app.applicant_profiles?.title || null
        }
      }));

      setJobStats(stats);
      setRecentApplications(transformedApplications);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>Recruiter Dashboard</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Manage jobs and applications</Text>
        </View>
        <IconButton
          icon="logout"
          size={24}
          onPress={() => setConfirmSignOut(true)}
        />
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search applications or jobs"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.statsContainer}>
        <Card 
          style={[styles.statsCard, { backgroundColor: '#4a5eff' }]}
          onPress={() => router.push('/recruiter/jobs')}
        >
          <Card.Content>
            <Text variant="headlineMedium" style={styles.statNumber}>{jobStats.total}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </Card.Content>
        </Card>

        <Card 
          style={[styles.statsCard, { backgroundColor: '#00c853' }]}
          onPress={() => router.push('/recruiter/applications')}
        >
          <Card.Content>
            <Text variant="headlineMedium" style={styles.statNumber}>{jobStats.total_applications}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </Card.Content>
        </Card>

        <Card 
          style={[styles.statsCard, { backgroundColor: '#ff9d4a' }]}
          onPress={() => router.push('/recruiter/jobs/review')}
        >
          <Card.Content>
            <Text variant="headlineMedium" style={styles.statNumber}>{jobStats.pending_review}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => router.push('/recruiter/jobs/review')}
          style={[styles.actionButton, { backgroundColor: '#4a5eff' }]}
          icon="clipboard-check-outline"
        >
          Review Job Posts
        </Button>
        <Button
          mode="contained"
          onPress={() => router.push('/recruiter/jobs/new')}
          style={[styles.actionButton, { backgroundColor: '#00c853' }]}
          icon="plus"
        >
          Post New Job
        </Button>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Recent Applications</Text>
          <Button 
            mode="text" 
            onPress={() => router.push('/recruiter/applications')}
            textColor="#4a5eff"
          >
            View All
          </Button>
        </View>

        {recentApplications.map(application => (
          <Card 
            key={application.id}
            style={styles.applicationCard}
            onPress={() => router.push(`/recruiter/applications/${application.id}`)}
          >
            <Card.Content style={styles.applicationContent}>
              <Avatar.Text 
                size={40} 
                label={application.applicant.full_name.charAt(0)} 
                style={styles.avatar}
              />
              <View style={styles.applicationDetails}>
                <Text variant="titleMedium">{application.applicant.full_name}</Text>
                <Text variant="bodyMedium">{application.job.title}</Text>
                <Text variant="bodySmall" style={styles.companyText}>
                  {application.job.company}
                </Text>
              </View>
              <Chip style={styles.statusChip}>
                {application.status}
              </Chip>
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
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    color: '#666',
  },
  searchSection: {
    padding: 16,
    paddingTop: 0,
  },
  searchbar: {
    elevation: 2,
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
  statNumber: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
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
  applicationCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  applicationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#e6e6fe',
  },
  applicationDetails: {
    flex: 1,
  },
  companyText: {
    color: '#666',
  },
  statusChip: {
    backgroundColor: '#e6e6fe',
  },
  addButton: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#4a5eff',
  },
  reviewSection: {
    padding: 16,
    paddingTop: 0,
  },
  reviewCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  reviewSubtitle: {
    color: '#666',
    marginTop: 4,
  },
  reviewButton: {
    backgroundColor: '#4a5eff',
    borderRadius: 8,
  },
  actionButtons: {
    padding: 16,
    paddingTop: 0,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
}); 