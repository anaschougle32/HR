import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Avatar, Portal, Dialog, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface ApplicationDetails {
  id: string;
  created_at: string;
  status: string;
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

interface RawDatabaseApplication {
  id: string;
  created_at: string;
  status: string;
  notes: string | null;
  jobs: {
    id: string;
    title: string;
    company: string;
    category: string;
    description: string;
    requirements: string;
  };
  applicant_profiles: {
    id: string;
    full_name: string;
    title: string | null;
    location: string | null;
    experience: string | null;
    skills: string[] | null;
    resume_url: string | null;
  };
}

interface ApplicationWithJob {
  id: string;
  created_at: string;
  status: string;
  notes: string | null;
  applicant_id: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    category: string;
    description: string;
    requirements: string;
  } | null;
}

export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    status: string;
    title: string;
    message: string;
  }>({
    visible: false,
    status: '',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (session?.user?.id && id) {
      fetchApplicationDetails();
    }
  }, [session, id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);

      // First fetch the application with job details
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          status,
          notes,
          applicant_id,
          jobs!inner (
            id,
            title,
            company,
            category,
            description,
            requirements
          )
        `)
        .eq('id', id)
        .single();

      if (applicationError) throw applicationError;
      if (!applicationData) throw new Error('Application not found');

      const typedApplicationData = applicationData as unknown as ApplicationWithJob;
      if (!typedApplicationData.jobs) throw new Error('Job not found');

      // Then fetch the applicant details separately
      const { data: applicantData, error: applicantError } = await supabase
        .from('applicant_profiles')
        .select(`
          id,
          full_name,
          title,
          location,
          experience,
          skills,
          resume_url
        `)
        .eq('id', typedApplicationData.applicant_id)
        .single();

      if (applicantError) throw applicantError;
      if (!applicantData) throw new Error('Applicant not found');

      // Transform the data to match the ApplicationDetails interface
      const transformedData: ApplicationDetails = {
        id: typedApplicationData.id,
        created_at: typedApplicationData.created_at,
        status: typedApplicationData.status,
        notes: typedApplicationData.notes,
        job: {
          id: typedApplicationData.jobs.id,
          title: typedApplicationData.jobs.title,
          company: typedApplicationData.jobs.company,
          category: typedApplicationData.jobs.category,
          description: typedApplicationData.jobs.description,
          requirements: typedApplicationData.jobs.requirements
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
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setApplication(prev => prev ? { ...prev, status: newStatus } : null);
      setConfirmDialog(prev => ({ ...prev, visible: false }));
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
      // The resumeUrl should already be a complete URL from Supabase storage
      if (!resumeUrl.startsWith('http')) {
        throw new Error('Invalid resume URL');
      }

      // Open the URL directly in the device's browser
      await Linking.openURL(resumeUrl);
    } catch (error) {
      console.error('Error downloading resume:', error);
      // Show error message to user
      Alert.alert(
        'Error',
        'Could not open the resume. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a5eff" />
        <Text style={styles.loadingText}>Loading application details...</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.applicantCard}>
          <Card.Content>
            <View style={styles.applicantHeader}>
              <Avatar.Text 
                size={60} 
                label={application.applicant.full_name.charAt(0)} 
                style={styles.avatar}
              />
              <View style={styles.applicantInfo}>
                <Text variant="headlineSmall" style={styles.name}>
                  {application.applicant.full_name}
                </Text>
                <Text variant="bodyLarge" style={styles.title}>
                  {application.applicant.title || 'No title'}
                </Text>
                {application.applicant.location && (
                  <Text variant="bodyMedium" style={styles.location}>
                    📍 {application.applicant.location}
                  </Text>
                )}
              </View>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(application.status) }]}
              >
                {application.status}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Applied Position</Text>
              <Card style={styles.jobCard}>
                <Card.Content>
                  <Text variant="titleLarge">{application.job.title}</Text>
                  <Text variant="bodyLarge" style={styles.company}>{application.job.company}</Text>
                  <Chip style={styles.categoryChip}>{application.job.category}</Chip>
                </Card.Content>
              </Card>
            </View>

            {application.applicant.experience && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Experience</Text>
                <Text variant="bodyMedium">{application.applicant.experience}</Text>
              </View>
            )}

            {application.applicant.skills && application.applicant.skills.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Skills</Text>
                <View style={styles.skillsContainer}>
                  {application.applicant.skills.map((skill, index) => (
                    <Chip key={index} style={styles.skillChip}>{skill}</Chip>
                  ))}
                </View>
              </View>
            )}

            {application.applicant.resume_url && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Resume</Text>
                <Button 
                  mode="contained-tonal" 
                  icon="file-document" 
                  onPress={() => handleResumeDownload(application.applicant.resume_url!)}
                >
                  View Resume
                </Button>
              </View>
            )}

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Application Timeline</Text>
              <Text variant="bodyMedium">
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </Text>
            </View>

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
                  style={[styles.actionButton, { backgroundColor: '#ff4a4a' }]}
                >
                  Reject
                </Button>
              )}
              {application.status !== 'hired' && (
                <Button 
                  mode="contained"
                  onPress={() => handleStatusUpdate('hired')}
                  style={[styles.actionButton, { backgroundColor: '#00c853' }]}
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

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#ffd700';
    case 'shortlisted':
      return '#4a5eff';
    case 'rejected':
      return '#ff4a4a';
    case 'hired':
      return '#00c853';
    default:
      return '#e0e0e0';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  applicantCard: {
    borderRadius: 12,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#e6e6fe',
  },
  applicantInfo: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    color: '#666',
    marginBottom: 4,
  },
  location: {
    color: '#666',
  },
  statusChip: {
    borderRadius: 12,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#333',
    fontWeight: '500',
  },
  jobCard: {
    backgroundColor: '#f5f7ff',
  },
  company: {
    color: '#666',
    marginVertical: 4,
  },
  categoryChip: {
    marginTop: 8,
    backgroundColor: '#e6e6fe',
    alignSelf: 'flex-start',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#f0f0f0',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
}); 