import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Card, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  created_at: string;
  applications_count: number;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeApplications: 0,
    shortlistedCandidates: 0,
    scheduledInterviews: 0
  });

  useEffect(() => {
    fetchJobs();
    fetchDashboardStats();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      if (!session?.user?.id) {
        console.error('No user session found');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (!profile) {
        console.error('No employer profile found');
        return;
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      setJobs(data || []);
    } catch (error) {
      console.error('Error in fetchJobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: profile } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (!profile) {
        console.error('No employer profile found');
        return;
      }

      // Fetch jobs count
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('employer_id', profile.id);

      // Fetch applications stats
      const { data: applications } = await supabase
        .from('applications')
        .select('status, job:jobs!inner(employer_id)')
        .eq('job.employer_id', profile.id);

      setStats({
        totalJobs: jobs?.length || 0,
        activeApplications: applications?.filter(app => app.status === 'pending').length || 0,
        shortlistedCandidates: applications?.filter(app => app.status === 'shortlisted').length || 0,
        scheduledInterviews: 0 // You can implement this later
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text variant="headlineMedium">Posted Jobs</Text>
        </View>

        <View style={styles.content}>
          {jobs.map((job) => (
            <Card 
              key={job.id} 
              style={styles.card}
              onPress={() => router.push(`/employer/jobs/${job.id}`)}
            >
              <Card.Content>
                <Text variant="titleLarge">{job.title}</Text>
                <Text variant="titleMedium">{job.company}</Text>
                <Text variant="bodyMedium">{job.location}</Text>
                
                <View style={styles.cardFooter}>
                  <Text variant="bodySmall" style={styles.date}>
                    Posted on {new Date(job.created_at).toLocaleDateString()}
                  </Text>
                  <Text variant="bodySmall">
                    {job.applications_count} Applications
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/employer/jobs/new')}
        label="Post Job"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  date: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 