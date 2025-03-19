import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Chip, Button, Searchbar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Job {
  id: string;
  title: string;
  employer: {
    company_name: string;
  };
}

interface Applicant {
  id: string;
  full_name: string;
  title: string | null;
  resume_url: string | null;
  location: string | null;
  phone: string | null;
}

type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected';

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  job: Job;
  applicant: Applicant;
}

interface ApiResponse {
  id: string;
  status: string;
  created_at: string;
  applicant_id: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  applicant: {
    id: string;
    user_id: string;
    full_name: string;
    title: string;
    resume_url: string | null;
    location: string;
  };
}

export default function ApplicationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  const createRecruiterProfile = async () => {
    try {
      // First get the employer profile
      const { data: employerProfile } = await supabase
        .from('employer_profiles')
        .select('id')
        .single();

      if (!employerProfile) {
        throw new Error('No employer profile found');
      }

      const { data, error } = await supabase
        .from('recruiter_profiles')
        .insert({
          user_id: session?.user.id,
          email: session?.user.email,
          full_name: 'Anas Chougle',
          title: 'Technical Recruiter',
          employer_id: employerProfile.id, // Link to employer
          permissions: {
            can_interview: true,
            can_post_jobs: true,
            can_review_applications: true
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating recruiter profile:', error);
      throw error;
    }
  };

  const fetchApplications = async () => {
    try {
      console.log('Fetching applications...');
      setLoading(true);

      // Get recruiter profile with employer_id
      const { data: recruiterProfile, error: profileError } = await supabase
        .from('recruiter_profiles')
        .select('employer_id')
        .eq('user_id', session?.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching recruiter profile:', profileError);
        return;
      }

      // Get jobs for this employer
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('employer_id', recruiterProfile.employer_id);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
      }

      const jobIds = jobs.map(job => job.id);
      
      if (jobIds.length === 0) {
        setApplications([]);
        return;
      }

      // Fetch applications in two steps to avoid recursion
      // First, get basic application data
      const { data: basicApps, error: appsError } = await supabase
        .from('applications')
        .select('id, status, created_at, job_id, applicant_profile_id')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        return;
      }

      console.log('Basic apps data:', basicApps); // Debug log

      // Then fetch job and applicant details separately
      const applications = await Promise.all(
        basicApps.map(async (app) => {
          // Get job details
          const { data: job } = await supabase
            .from('jobs')
            .select(`
              id,
              title,
              employer:employer_profiles (
                company_name
              )
            `)
            .eq('id', app.job_id)
            .single();

          // Get applicant details
          const { data: applicant } = await supabase
            .from('applicant_profiles')
            .select(`
              id,
              full_name,
              title,
              resume_url,
              location,
              phone
            `)
            .eq('id', app.applicant_profile_id)
            .single();

          return {
            ...app,
            status: app.status as ApplicationStatus, // Ensure proper typing
            job: {
              ...job,
              employer: Array.isArray(job?.employer) ? job.employer[0] : job?.employer
            },
            applicant
          };
        })
      );

      console.log('Processed applications with status:', applications); // Debug log
      setApplications(applications);
    } catch (error) {
      console.error('Error in fetchApplications:', error);
    } finally {
      setLoading(false);
    }
  };

  const isValidStatus = (status: string): status is ApplicationStatus => {
    return ['pending', 'reviewed', 'shortlisted', 'rejected'].includes(status);
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application:', error);
        throw error;
      }

      // Update the application in the local state immediately
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );

      // Force a refresh of the applications list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating status:', error);
      // Show error to user
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.applicant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'shortlisted':
        return { backgroundColor: '#e6f7e6' }; // Light green
      case 'rejected':
        return { backgroundColor: '#ffebee' }; // Light red
      case 'reviewed':
        return { backgroundColor: '#e3f2fd' }; // Light blue
      case 'pending':
      default:
        return { backgroundColor: '#f5f5f5' }; // Light grey
    }
  };

  const handleApplicationPress = (applicationId: string) => {
    router.push(`/recruiter/applications/${applicationId}`);
  };

  const renderApplicationCard = (application: Application) => {
    console.log('Rendering card with status:', application.status); // Debug log
    
    return (
      <Card 
        key={application.id}
        style={styles.card} 
        onPress={() => handleApplicationPress(application.id)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text variant="titleMedium" style={styles.name}>
                {application.applicant.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.title}>
                {application.applicant.title || 'No title provided'}
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
            <Text variant="bodyMedium">
              Applied for: {application.job.title}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              Applied on: {new Date(application.created_at).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const setupSubscription = () => {
    const channel = supabase
      .channel('application_updates')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchApplications();
        }
      )
      .subscribe();

    setSubscription(channel);
  };

  useEffect(() => {
    console.log('Component mounted or refreshed, session:', session);
    fetchApplications();
    setupSubscription();

    // Cleanup subscription
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Add this to help debug
  const debugApplications = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Check recruiter profile
      const { data: profile, error: profileError } = await supabase
        .from('recruiter_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      console.log('Debug - Recruiter Profile:', { profile, error: profileError });

      if (profile) {
        // Check jobs
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('id')
          .eq('employer_id', profile.employer_id);
          
        console.log('Debug - Jobs:', { jobs, error: jobsError });

        if (jobs?.length > 0) {
          // Check applications
          const { data: apps, error: appsError } = await supabase
            .from('applications')
            .select('*')
            .in('job_id', jobs.map(j => j.id));
            
          console.log('Debug - Applications:', { apps, error: appsError });
        }
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Call debug function
  useEffect(() => {
    debugApplications();
  }, []);

  // Update the status filter buttons
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'rejected', label: 'Rejected' },
  ];

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
          buttons={statusOptions}
          style={styles.filterButtons}
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <ScrollView style={styles.scrollView}>
            {filteredApplications.map(application => 
              renderApplicationCard(application)
            )}
            {filteredApplications.length === 0 && (
              <View style={styles.emptyState}>
                <Text variant="titleMedium">No applications found</Text>
                <Text variant="bodyMedium" style={{marginTop: 8, textAlign: 'center'}}>
                  There are no applications matching your criteria.
                </Text>
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
    flex: 1,
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