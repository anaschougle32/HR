import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Title } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingScreen from '../../../components/LoadingScreen';

interface Job {
  id: string;
  title: string;
  created_at: string;
  status: string;
  applications_count?: number;
  shortlisted_count?: number;
}

export default function EmployerJobsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      if (!session?.user?.id) return;

      const { data: employerProfile } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!employerProfile) return;

      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          created_at,
          status,
          applications (
            status
          )
        `)
        .eq('employer_id', employerProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include application counts
      const transformedJobs = (jobsData || []).map(job => ({
        id: job.id,
        title: job.title,
        created_at: job.created_at,
        status: job.status,
        applications_count: job.applications?.length || 0,
        shortlisted_count: job.applications?.filter(app => app.status === 'shortlisted').length || 0
      }));

      console.log('Jobs with applications:', transformedJobs);
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchJobs();
    }
  }, [session]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Button 
        mode="contained"
        onPress={() => router.push('/employer/jobs/new')}
        style={styles.newButton}
      >
        Post New Job
      </Button>

      <ScrollView style={styles.scrollView}>
        {jobs.length > 0 ? (
          jobs.map(job => (
            <Card 
              key={job.id} 
              style={styles.card}
              onPress={() => router.push(`/employer/jobs/${job.id}`)}
            >
              <Card.Content>
                <Title>{job.title}</Title>
                <Text>Posted on: {new Date(job.created_at).toLocaleDateString()}</Text>
                <Text>Total Applications: {job.applications_count || 0}</Text>
                <Text>Shortlisted: {job.shortlisted_count || 0}</Text>
                <Text>Status: {job.status}</Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No jobs posted yet</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  newButton: {
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
  },
}); 