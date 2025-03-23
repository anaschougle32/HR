import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  created_at: string;
  job: {
    title: string;
    company: string;
    location: string;
  };
}

export default function ApplicationsScreen() {
  const { session } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data: profile } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs (
            title,
            company,
            location
          )
        `)
        .eq('applicant_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to handle potential arrays and null values
      const transformedData = (data || [])
        .filter(item => item.job) // Filter out applications with no job data
        .map(item => {
          const jobData = Array.isArray(item.job) ? item.job[0] : item.job;
          return {
            ...item,
            job: jobData
          };
        });
      
      setApplications(transformedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">My Applications</Text>
      </View>

      <View style={styles.content}>
        {applications.map((application) => (
          <Card key={application.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">{application.job.title}</Text>
              <Text variant="titleMedium">{application.job.company}</Text>
              <Text variant="bodyMedium">{application.job.location}</Text>
              
              <View style={styles.statusContainer}>
                <Chip 
                  icon={application.status === 'pending' ? 'clock' : 
                        application.status === 'reviewed' ? 'eye' :
                        application.status === 'shortlisted' ? 'star' : 'close'}
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Chip>
                <Text variant="bodySmall" style={styles.date}>
                  Applied on {new Date(application.created_at).toLocaleDateString()}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
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
  statusContainer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    opacity: 0.7,
  },
}); 