import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Chip, Button, Searchbar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Job {
  id: string;
  title: string;
  company: string;
}

interface Applicant {
  id: string;
  full_name: string;
  title: string;
  resume_url: string;
}

interface Application {
  id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  created_at: string;
  job: Job;
  applicant: Applicant;
}

export default function ApplicationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchApplications = async () => {
    try {
      console.log('Fetching applications...');
      setLoading(true);

      // Get employer profile
      const { data: employerProfile, error: profileError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching employer profile:', profileError);
        return;
      }

      console.log('Employer profile:', employerProfile);

      // Fetch applications for jobs posted by this employer
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          job:jobs!inner (
            id,
            title,
            company
          ),
          applicant:applicant_profiles!inner (
            id,
            full_name,
            title,
            resume_url
          )
        `)
        .eq('job.employer_id', employerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Applications query error:', error);
        throw error;
      }

      console.log('Raw applications data:', data);

      if (!data || data.length === 0) {
        console.log('No applications found');
        setApplications([]);
        return;
      }

      // Transform the data
      const transformedData = data.map(item => {
        // Handle the case where job and applicant might be arrays
        const jobData = Array.isArray(item.job) ? item.job[0] : item.job;
        const applicantData = Array.isArray(item.applicant) ? item.applicant[0] : item.applicant;
        
        console.log('Processing item:', item.id);
        console.log('Job data:', jobData);
        console.log('Applicant data:', applicantData);
        
        return {
          id: item.id,
          status: item.status as Application['status'],
          created_at: item.created_at,
          job: {
            id: jobData.id,
            title: jobData.title,
            company: jobData.company
          },
          applicant: {
            id: applicantData.id,
            full_name: applicantData.full_name,
            title: applicantData.title,
            resume_url: applicantData.resume_url || ''
          }
        };
      });

      console.log('Transformed applications:', transformedData);
      setApplications(transformedData);
    } catch (error) {
      console.error('Error in fetchApplications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.applicant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return { backgroundColor: '#e6f7e6' };
      case 'rejected':
        return { backgroundColor: '#ffebee' };
      case 'reviewed':
        return { backgroundColor: '#e3f2fd' };
      default:
        return { backgroundColor: '#f5f5f5' };
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Searchbar
          placeholder="Search applications..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'shortlisted', label: 'Shortlisted' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          style={styles.filterButtons}
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <ScrollView style={styles.scrollView}>
            {filteredApplications.map(application => (
              <Card 
                key={application.id}
                style={styles.card} 
                onPress={() => router.push(`/employer/applications/${application.id}`)}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text variant="titleMedium" style={styles.name}>
                        {application.applicant.full_name}
                      </Text>
                      <Text variant="bodyMedium" style={styles.title}>
                        {application.applicant.title}
                      </Text>
                    </View>
                    <Chip 
                      mode="outlined" 
                      style={getStatusStyle(application.status)}
                    >
                      {application.status}
                    </Chip>
                  </View>
                  
                  <View style={styles.jobInfo}>
                    <Text variant="bodyMedium">Applied for: {application.job.title}</Text>
                    <Text variant="bodySmall" style={styles.date}>
                      Applied on: {new Date(application.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
            {filteredApplications.length === 0 && (
              <View style={styles.emptyState}>
                <Text variant="titleMedium">No applications found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
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
  scrollView: {
    flex: 1,
  },
  searchbar: {
    marginBottom: 15,
  },
  filterButtons: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontWeight: '600',
  },
  title: {
    opacity: 0.7,
    marginTop: 2,
  },
  jobInfo: {
    marginTop: 8,
  },
  date: {
    opacity: 0.5,
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 