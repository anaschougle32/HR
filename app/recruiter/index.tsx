import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalJobs: number;
  activeApplications: number;
  shortlistedCandidates: number;
  scheduledInterviews: number;
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeApplications: 0,
    shortlistedCandidates: 0,
    scheduledInterviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: recruiterProfile } = await supabase
        .from('recruiter_profiles')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (!recruiterProfile) {
        console.error('No recruiter profile found');
        return;
      }

      // Fetch jobs count
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' });

      // Fetch applications stats
      const { data: applications } = await supabase
        .from('applications')
        .select('status');

      setStats({
        totalJobs: jobs?.length || 0,
        activeApplications: applications?.filter(app => app.status === 'pending').length || 0,
        shortlistedCandidates: applications?.filter(app => app.status === 'shortlisted').length || 0,
        scheduledInterviews: 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Recruiter Dashboard
        </Text>

        <View style={styles.statsGrid}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats.totalJobs}</Text>
              <Text variant="bodyMedium">Active Jobs</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats.activeApplications}</Text>
              <Text variant="bodyMedium">New Applications</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats.shortlistedCandidates}</Text>
              <Text variant="bodyMedium">Shortlisted</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleLarge">{stats.scheduledInterviews}</Text>
              <Text variant="bodyMedium">Interviews</Text>
            </Card.Content>
          </Card>
        </View>

        <Button
          mode="contained"
          onPress={() => router.push('/recruiter/applications')}
          style={styles.button}
        >
          Review Applications
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
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
  },
  button: {
    marginTop: 10,
  },
}); 