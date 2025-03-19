import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Title, Paragraph, DataTable } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  shortlistedApplications: number;
  recentShortlisted: number;
}

interface RecentJob {
  id: string;
  title: string;
  created_at: string;
  shortlisted_count: number;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    shortlistedApplications: 0,
    recentShortlisted: 0
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const { data: employer } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (!employer) return;

      // Fetch jobs stats
      const { data: jobsData } = await supabase
        .from('jobs')
        .select(`
          id, 
          status,
          applications!inner (
            id,
            status,
            created_at
          )
        `)
        .eq('employer_id', employer.id);

      // Calculate stats
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      const shortlistedApps = jobsData?.flatMap(job => 
        job.applications.filter(app => app.status === 'shortlisted')
      ) || [];

      setStats({
        totalJobs: jobsData?.length || 0,
        activeJobs: jobsData?.filter(job => job.status === 'active').length || 0,
        shortlistedApplications: shortlistedApps.length,
        recentShortlisted: shortlistedApps.filter(app => 
          new Date(app.created_at) > thirtyDaysAgo
        ).length
      });

      // Fetch recent jobs with shortlisted application counts
      const { data: recentJobsData } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          created_at,
          applications!inner (
            status
          )
        `)
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const transformedJobs = recentJobsData?.map(job => ({
        id: job.id,
        title: job.title,
        created_at: job.created_at,
        shortlisted_count: job.applications.filter(app => app.status === 'shortlisted').length
      })) || [];

      // Only show jobs that have shortlisted applications
      setRecentJobs(transformedJobs.filter(job => job.shortlisted_count > 0));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Dashboard Overview</Title>

      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>{stats.activeJobs}</Title>
            <Paragraph>Active Jobs</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>{stats.shortlistedApplications}</Title>
            <Paragraph>Shortlisted Candidates</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.section}>
        <Card.Content>
          <Title>Jobs with Shortlisted Candidates</Title>
          {recentJobs.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Job Title</DataTable.Title>
                <DataTable.Title numeric>Shortlisted</DataTable.Title>
              </DataTable.Header>

              {recentJobs.map(job => (
                <DataTable.Row 
                  key={job.id}
                  onPress={() => router.push(`/employer/jobs/${job.id}`)}
                >
                  <DataTable.Cell>{job.title}</DataTable.Cell>
                  <DataTable.Cell numeric>{job.shortlisted_count}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.emptyState}>
              <Text>No jobs with shortlisted candidates yet</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Button 
        mode="contained"
        onPress={() => router.push('/employer/jobs/new')}
        style={styles.button}
      >
        Post New Job
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    margin: 8,
  },
  section: {
    marginBottom: 20,
  },
  button: {
    marginTop: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
}); 