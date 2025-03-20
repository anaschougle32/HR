import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Button, Card, Divider, Portal, Dialog } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import LoadingScreen from '../../../components/LoadingScreen';

type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected';

interface ApplicationDetails {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  notes?: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  applicant: {
    id: string;
    full_name: string;
    phone: string;
    location: string;
    about: string;
    resume_url: string;
  };
}

export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, action: '' as ApplicationStatus });

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          notes,
          job:jobs!inner (
            id,
            title,
            company
          ),
          applicant:applicant_profiles!inner (
            id,
            full_name,
            phone,
            location,
            about,
            resume_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching application:', error);
        throw error;
      }

      // Transform the data to match the ApplicationDetails interface
      const transformedData: ApplicationDetails = {
        id: data.id,
        status: data.status as ApplicationStatus,
        created_at: data.created_at,
        notes: data.notes,
        job: {
          id: data.job.id,
          title: data.job.title,
          company: data.job.company
        },
        applicant: {
          id: data.applicant.id,
          full_name: data.applicant.full_name,
          phone: data.applicant.phone,
          location: data.applicant.location,
          about: data.applicant.about,
          resume_url: data.applicant.resume_url
        }
      };

      console.log('Application details:', transformedData);
      setApplication(transformedData);
    } catch (error) {
      console.error('Error in fetchApplicationDetails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating application:', error);
        throw error;
      }

      // Update local state
      setApplication(prev => prev ? { ...prev, status: newStatus } : null);
      setConfirmDialog({ visible: false, action: '' as ApplicationStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      // Show error to user
    }
  };

  const showConfirmDialog = (status: ApplicationStatus) => {
    setConfirmDialog({ visible: true, action: status });
  };

  const handleResumeView = async () => {
    try {
      if (application?.applicant.resume_url) {
        const supported = await Linking.canOpenURL(application.applicant.resume_url);
        
        if (supported) {
          await Linking.openURL(application.applicant.resume_url);
        } else {
          console.error("Don't know how to open URI: " + application.applicant.resume_url);
        }
      }
    } catch (error) {
      console.error("Error opening resume URL:", error);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!application) return null;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{application.job.title}</Text>
          <Text variant="titleMedium">{application.job.company}</Text>
          <Text variant="bodyMedium">
            Applied on: {new Date(application.created_at).toLocaleDateString()}
          </Text>
          <Text variant="bodyMedium">Status: {application.status}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Applicant Details</Text>
          <Divider style={styles.divider} />
          
          <Text variant="titleMedium">{application.applicant.full_name}</Text>
          <Text variant="bodyMedium">{application.applicant.location}</Text>
          <Text variant="bodyMedium">{application.applicant.phone}</Text>
          
          <Text variant="titleMedium" style={styles.sectionTitle}>About</Text>
          <Text variant="bodyMedium">{application.applicant.about || 'No information provided'}</Text>
          
          {application.applicant.resume_url && (
            <Button
              mode="contained-tonal"
              onPress={handleResumeView}
              style={styles.button}
            >
              View Resume
            </Button>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => showConfirmDialog('shortlisted')}
          style={[styles.button, styles.shortlistButton]}
          disabled={application.status === 'shortlisted'}
        >
          Shortlist
        </Button>
        <Button
          mode="contained"
          onPress={() => showConfirmDialog('rejected')}
          style={[styles.button, styles.rejectButton]}
          disabled={application.status === 'rejected'}
        >
          Reject
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={confirmDialog.visible}
          onDismiss={() => setConfirmDialog({ visible: false, action: '' as ApplicationStatus })}
        >
          <Dialog.Title>Confirm Action</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to mark this application as {confirmDialog.action}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setConfirmDialog({ visible: false, action: '' as ApplicationStatus })}
            >
              Cancel
            </Button>
            <Button 
              onPress={() => handleStatusUpdate(confirmDialog.action)}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    marginTop: 8,
  },
  shortlistButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#F44336',
  },
}); 