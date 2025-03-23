import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, ActivityIndicator, Portal, Dialog } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  experience_level: number;
  employment_type: string;
  category: string;
  status: 'pending_review' | 'active' | 'rejected' | 'closed';
  created_at: string;
}

export default function JobReviewScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | 'close'>('approve');

  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Get recruiter profile to get employer_id
      const { data: recruiter, error: recruiterError } = await supabase
        .from('recruiter_profiles')
        .select('employer_id')
        .eq('user_id', session?.user?.id)
        .single();

      if (recruiterError) throw recruiterError;

      // Get jobs for review
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', recruiter.employer_id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const handleJobAction = async (job: Job, action: 'approve' | 'reject' | 'close') => {
    setSelectedJob(job);
    setDialogAction(action);
    setShowDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedJob) return;

    try {
      const newStatus = dialogAction === 'approve' ? 'active' : 
                       dialogAction === 'reject' ? 'rejected' : 'closed';

      const { error } = await supabase
        .from('jobs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedJob.id);

      if (error) throw error;

      // Update local state
      setJobs(jobs.map(job => 
        job.id === selectedJob.id 
          ? { ...job, status: newStatus }
          : job
      ));

      setShowDialog(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#00c853';
      case 'rejected': return '#ff1744';
      case 'closed': return '#757575';
      default: return '#ff9d4a';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a5eff" />
        <Text>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Review Job Postings</Text>
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search jobs"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {filteredJobs.map(job => (
        <Card key={job.id} style={styles.jobCard}>
          <Card.Content>
            <View style={styles.jobHeader}>
              <View style={styles.jobInfo}>
                <Text variant="titleMedium">{job.title}</Text>
                <Text variant="bodyMedium">{job.company}</Text>
                <Text variant="bodySmall" style={styles.location}>{job.location}</Text>
              </View>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(job.status) }]}
                textStyle={{ color: '#fff' }}
              >
                {job.status}
              </Chip>
            </View>

            <View style={styles.tags}>
              <Chip style={styles.tag}>{job.employment_type}</Chip>
              <Chip style={styles.tag}>{job.category}</Chip>
              <Chip style={styles.tag}>Level: {job.experience_level}</Chip>
            </View>

            <Text variant="bodyMedium" style={styles.sectionTitle}>Description</Text>
            <Text variant="bodySmall" style={styles.description}>{job.description}</Text>

            <Text variant="bodyMedium" style={styles.sectionTitle}>Requirements</Text>
            <Text variant="bodySmall" style={styles.description}>{job.requirements}</Text>

            {job.status === 'pending_review' && (
              <View style={styles.actions}>
                <Button 
                  mode="contained" 
                  onPress={() => handleJobAction(job, 'approve')}
                  style={[styles.actionButton, styles.approveButton]}
                >
                  Approve
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => handleJobAction(job, 'reject')}
                  style={[styles.actionButton, styles.rejectButton]}
                >
                  Reject
                </Button>
              </View>
            )}

            {job.status === 'active' && (
              <View style={styles.actions}>
                <Button 
                  mode="contained" 
                  onPress={() => handleJobAction(job, 'close')}
                  style={[styles.actionButton, { backgroundColor: '#757575' }]}
                >
                  Close Job
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>
            {dialogAction === 'approve' ? 'Approve Job' : 
             dialogAction === 'reject' ? 'Reject Job' : 'Close Job'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to {dialogAction} this job posting?
              {dialogAction === 'close' && ' This will prevent new applications.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button onPress={confirmAction}>Confirm</Button>
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
  header: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  searchSection: {
    padding: 16,
    paddingTop: 0,
  },
  searchbar: {
    elevation: 2,
    backgroundColor: '#fff',
  },
  jobCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  location: {
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    marginLeft: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f2ff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  description: {
    color: '#666',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#00c853',
  },
  rejectButton: {
    backgroundColor: '#ff1744',
  },
}); 