import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Title, Searchbar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export default function EmployerJobsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      if (!session?.user?.id) {
        console.log('No session found');
        return;
      }

      // Get employer profile
      const { data: employer, error: employerError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (employerError) {
        console.error('Error fetching employer profile:', employerError);
        return;
      }

      if (!employer) {
        console.log('No employer profile found');
        return;
      }

      // Get all jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, status, created_at')
        .eq('employer_id', employer.id)
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
      }

      setJobs(jobs || []);
    } catch (error) {
      console.error('Error in fetchJobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [session]);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Posted Jobs</Title>
        <IconButton
          icon="logout"
          size={24}
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </View>

      <View style={styles.filters}>
        <Searchbar
          placeholder="Search jobs"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {filteredJobs.map(job => (
        <Card 
          key={job.id} 
          style={styles.jobCard}
          onPress={() => router.push(`/employer/jobs/${job.id}`)}
        >
          <Card.Content>
            <Title>{job.title}</Title>
            <Text>Posted on: {new Date(job.created_at).toLocaleDateString()}</Text>
            <Text>Status: {job.status}</Text>
          </Card.Content>
        </Card>
      ))}

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
  filters: {
    marginBottom: 20,
  },
  searchbar: {
    marginBottom: 10,
  },
  jobCard: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signOutButton: {
    marginLeft: 'auto',
  },
}); 