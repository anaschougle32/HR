import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, Title, Paragraph, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import LoadingScreen from '../../../components/LoadingScreen';
import { useAuth } from '../../../contexts/AuthContext';

interface JobDetails {
  id: string;
  title: string;
  description: string;
  requirements: string;
  experience_level: number;
  created_at: string;
  status: string;
  employer_id: string;
}

interface ApplicationStats {
  total: number;
  pending: number;
  shortlisted: number;
  rejected: number;
}

interface Application {
  id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  created_at: string;
  updated_at: string;
  applicant: {
    id: string;
    full_name: string;
    title: string | null;
    location: string | null;
    resume_url: string | null;
  };
}

export default function EmployerJobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobDetails = async () => {
    try {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // First get the employer_id for the current user
      const { data: employerProfile } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!employerProfile) {
        throw new Error('Employer profile not found');
      }

      // Fetch job details with employer check
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          requirements,
          experience_level,
          created_at,
          status,
          employer_id
        `)
        .eq('id', id)
        .eq('employer_id', employerProfile.id)
        .single();

      if (jobError) throw jobError;
      if (!jobData) throw new Error('Job not found');

      setJob(jobData as JobDetails);

      // Fetch all applications for this job with applicant details
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          applicant:applicant_profiles!inner ( 
            id,
            full_name,
            title,
            location,
            resume_url
          )
        `)
        .eq('job_id', id);

      if (appsError) throw appsError;

      console.log('Raw applications data:', applicationsData);

      // Transform and type the applications data with null check
      const transformedApps = (applicationsData || [])
        .filter(app => app.applicant) // Filter out applications with null applicant
        .map(app => ({
          id: app.id,
          status: app.status as Application['status'],
          created_at: app.created_at,
          updated_at: app.updated_at,
          applicant: {
            id: app.applicant.id,
            full_name: app.applicant.full_name,
            title: app.applicant.title,
            location: app.applicant.location,
            resume_url: app.applicant.resume_url
          }
        }));

      // Calculate stats from all applications (including those with null applicant)
      const stats = {
        total: applicationsData?.length || 0,
        pending: applicationsData?.filter(app => app.status === 'pending').length || 0,
        shortlisted: applicationsData?.filter(app => app.status === 'shortlisted').length || 0,
        rejected: applicationsData?.filter(app => app.status === 'rejected').length || 0
      };

      console.log('Application Stats:', stats);
      setStats(stats);

      // Only show valid shortlisted applications in the list
      const shortlistedApps = transformedApps.filter(app => app.status === 'shortlisted');
      console.log('Shortlisted applications:', shortlistedApps);
      setApplications(shortlistedApps);

    } catch (error) {
      console.error('Error fetching job details:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchJobDetails();
    }
  }, [id, session]);

  // Add real-time subscription for updates
  useEffect(() => {
    const channel = supabase
      .channel('job_applications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications',
        filter: `job_id=eq.${id}`
      }, () => {
        fetchJobDetails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!job) return null;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return { backgroundColor: '#e6f7e6' }; // Light green
      case 'rejected':
        return { backgroundColor: '#ffebee' }; // Light red
      case 'reviewed':
        return { backgroundColor: '#e3f2fd' }; // Light blue
      default:
        return { backgroundColor: '#f5f5f5' }; // Light grey
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{job.title}</Title>
          <Text variant="bodyMedium">Posted on: {new Date(job.created_at).toLocaleDateString()}</Text>
        </Card.Content>
      </Card>

      <Title style={styles.sectionTitle}>Application Statistics</Title>
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>{stats.total}</Title>
            <Paragraph>Total</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>{stats.pending}</Title>
            <Paragraph>Pending</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>{stats.shortlisted}</Title>
            <Paragraph>Shortlisted</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>{stats.rejected}</Title>
            <Paragraph>Rejected</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Title style={styles.sectionTitle}>Shortlisted Candidates</Title>
      {applications.length > 0 ? (
        applications.map(application => (
          <Card key={application.id} style={styles.applicationCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View>
                  <Text variant="titleMedium" style={styles.name}>
                    {application.applicant.full_name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.title}>
                    {application.applicant.title || 'No title provided'}
                  </Text>
                  {application.applicant.location && (
                    <Text variant="bodySmall" style={styles.location}>
                      {application.applicant.location}
                    </Text>
                  )}
                </View>
                <Chip 
                  mode="outlined" 
                  style={getStatusStyle('shortlisted')}
                >
                  Shortlisted
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.date}>
                Applied on: {new Date(application.created_at).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>No shortlisted candidates yet</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    margin: 4,
  },
  applicationCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontWeight: '600',
  },
  title: {
    opacity: 0.7,
    marginTop: 2,
  },
  location: {
    opacity: 0.5,
    marginTop: 2,
  },
  date: {
    marginTop: 8,
    opacity: 0.5,
  },
  emptyCard: {
    marginTop: 8,
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
  },
}); 