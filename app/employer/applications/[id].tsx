import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Chip, 
  ActivityIndicator, 
  Surface,
  IconButton,
  Avatar,
  Portal,
  Dialog,
  Divider
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ApplicationDetails {
  id: string;
  status: string;
  created_at: string;
  notes: string | null;
  job: {
    id: string;
    title: string;
    company: string;
    category: string;
    description: string;
    requirements: string;
  };
  applicant: {
    id: string;
    full_name: string;
    title: string | null;
    location: string | null;
    experience: string | null;
    skills: string[];
    resume_url: string | null;
  };
}

interface ConfirmDialog {
  visible: boolean;
  title: string;
  message: string;
  status: string;
}

export default function ApplicationDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    visible: false,
    title: '',
    message: '',
    status: ''
  });

  useEffect(() => {
    if (session?.user?.id && id) {
      fetchApplicationDetails();
    }
  }, [session, id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);

      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          status,
          notes,
          job:jobs!inner (
            id,
            title,
            company,
            category,
            description,
            requirements
          ),
          applicant:applicant_profiles!inner (
            id,
            full_name,
            title,
            location,
            experience,
            skills,
            resume_url
          )
        `)
        .eq('id', id)
        .single();

      if (applicationError) throw applicationError;

      if (!applicationData || !Array.isArray(applicationData.job) || !Array.isArray(applicationData.applicant)) {
        throw new Error('Application not found');
      }

      const jobData = applicationData.job[0];
      const applicantData = applicationData.applicant[0];

      if (!jobData || !applicantData) {
        throw new Error('Application data is incomplete');
      }

      // Transform the data to match ApplicationDetails interface
      const transformedData: ApplicationDetails = {
        id: applicationData.id,
        status: applicationData.status,
        created_at: applicationData.created_at,
        notes: applicationData.notes,
        job: {
          id: jobData.id,
          title: jobData.title,
          company: jobData.company,
          category: jobData.category,
          description: jobData.description,
          requirements: jobData.requirements
        },
        applicant: {
          id: applicantData.id,
          full_name: applicantData.full_name,
          title: applicantData.title,
          location: applicantData.location,
          experience: applicantData.experience,
          skills: applicantData.skills || [],
          resume_url: applicantData.resume_url
        }
      };

      setApplication(transformedData);
    } catch (error) {
      console.error('Error fetching application details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplicationDetails();
  };

  const updateApplicationStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setConfirmDialog(prev => ({ ...prev, visible: false }));
      fetchApplicationDetails();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleStatusUpdate = (status: string) => {
    const statusMessages = {
      shortlisted: {
        title: 'Shortlist Candidate',
        message: 'Are you sure you want to shortlist this candidate?'
      },
      rejected: {
        title: 'Reject Application',
        message: 'Are you sure you want to reject this application?'
      },
      hired: {
        title: 'Hire Candidate',
        message: 'Are you sure you want to mark this candidate as hired?'
      }
    };

    setConfirmDialog({
      visible: true,
      status,
      title: statusMessages[status as keyof typeof statusMessages].title,
      message: statusMessages[status as keyof typeof statusMessages].message
    });
  };

  const handleResumeDownload = async (resumeUrl: string) => {
    try {
      if (!resumeUrl.startsWith('http')) {
        throw new Error('Invalid resume URL');
      }
      await Linking.openURL(resumeUrl);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.container}>
        <Text>Application not found</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
            />
            <Text variant="headlineMedium" style={styles.title}>
              Application Details
            </Text>
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        {/* Applicant Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.applicantHeader}>
              <Avatar.Text 
                size={60} 
                label={application.applicant.full_name.charAt(0)} 
                style={styles.avatar}
              />
              <View style={styles.applicantInfo}>
                <Text variant="titleLarge">{application.applicant.full_name}</Text>
                <Text variant="titleMedium" style={styles.subtitle}>
                  {application.applicant.title || 'No title provided'}
                </Text>
                <View style={styles.locationContainer}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                  <Text variant="bodyMedium" style={styles.location}>
                    {application.applicant.location || 'Location not specified'}
                  </Text>
                </View>
              </View>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(application.status) }]}
                textStyle={{ color: '#fff' }}
              >
                {application.status}
              </Chip>
            </View>

            {application.applicant.skills && application.applicant.skills.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Skills</Text>
                <View style={styles.skills}>
                  {application.applicant.skills.map((skill, index) => (
                    <Chip 
                      key={index}
                      style={styles.skillChip}
                      textStyle={styles.skillText}
                    >
                      {skill}
                    </Chip>
                  ))}
                </View>
              </>
            )}

            {application.applicant.experience && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Experience</Text>
                <Text variant="bodyMedium">{application.applicant.experience}</Text>
              </>
            )}

            {application.applicant.resume_url && (
              <>
                <Divider style={styles.divider} />
                <Button
                  mode="outlined"
                  icon="file-download"
                  onPress={() => handleResumeDownload(application.applicant.resume_url!)}
                  style={styles.resumeButton}
                >
                  Download Resume
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Applied Position Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Applied Position</Text>
            <View style={styles.jobInfo}>
              <Text variant="titleLarge">{application.job.title}</Text>
              <Text variant="titleMedium" style={styles.subtitle}>{application.job.company}</Text>
              <Chip style={styles.categoryChip}>{application.job.category}</Chip>
            </View>

            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Application Timeline</Text>
            <Text variant="bodyMedium">
              Applied on {new Date(application.created_at).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.actions}>
              {application.status !== 'shortlisted' && (
                <Button 
                  mode="contained"
                  onPress={() => handleStatusUpdate('shortlisted')}
                  style={[styles.actionButton, { backgroundColor: '#4a5eff' }]}
                >
                  Shortlist
                </Button>
              )}
              {application.status !== 'rejected' && (
                <Button 
                  mode="contained"
                  onPress={() => handleStatusUpdate('rejected')}
                  style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
                >
                  Reject
                </Button>
              )}
              {application.status !== 'hired' && (
                <Button 
                  mode="contained"
                  onPress={() => handleStatusUpdate('hired')}
                  style={[styles.actionButton, { backgroundColor: '#28a745' }]}
                >
                  Hire
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      </View>

      <Portal>
        <Dialog
          visible={confirmDialog.visible}
          onDismiss={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}
        >
          <Dialog.Title>{confirmDialog.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{confirmDialog.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}>
              Cancel
            </Button>
            <Button onPress={() => updateApplicationStatus(confirmDialog.status)}>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#e6e6fe',
  },
  applicantInfo: {
    flex: 1,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    color: '#666',
    marginLeft: 4,
  },
  statusChip: {
    marginLeft: 'auto',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#f0f2ff',
  },
  skillText: {
    color: '#4a5eff',
  },
  resumeButton: {
    marginTop: 8,
  },
  jobInfo: {
    marginBottom: 16,
  },
  categoryChip: {
    marginTop: 8,
    backgroundColor: '#f0f2ff',
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#ffc107';
    case 'shortlisted': return '#4a5eff';
    case 'rejected': return '#dc3545';
    case 'hired': return '#28a745';
    default: return '#6c757d';
  }
}; 