import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  Searchbar, 
  ActivityIndicator, 
  Button,
  Avatar,
  SegmentedButtons,
  Surface,
  IconButton
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';

interface ApplicationData {
  id: string;
  status: string;
  created_at: string;
  applicant: {
    id: string;
    full_name: string;
    title: string | null;
    experience: string | null;
    skills: string[] | null;
  };
}

export default function JobApplicationsScreen() {
  const router = useRouter();
  const { id, status: initialStatus } = useLocalSearchParams();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus as string || 'all');
  const [jobTitle, setJobTitle] = useState('');

  const fetchApplications = async () => {
    try {
      if (!session?.user?.id) return;

      // Get job title
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJobTitle(job.title);

      // Get applications with applicant details
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          applicant:applicant_profiles!inner (
            id,
            full_name,
            title,
            experience,
            skills
          )
        `)
        .eq('job_id', id)
        .order('created_at', { ascending: false })
        .returns<ApplicationData[]>();

      if (error) throw error;

      setApplications(data || []);
      filterApplications(data || [], selectedStatus, searchQuery);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [id, session]);

  const filterApplications = (apps: ApplicationData[], status: string, query: string) => {
    let filtered = [...apps];

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter(app => app.status === status);
    }

    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(app => 
        app.applicant.full_name.toLowerCase().includes(lowercaseQuery) ||
        (app.applicant.title && app.applicant.title.toLowerCase().includes(lowercaseQuery))
      );
    }

    setFilteredApplications(filtered);
  };

  useEffect(() => {
    filterApplications(applications, selectedStatus, searchQuery);
  }, [selectedStatus, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'shortlisted': return '#4a5eff';
      case 'rejected': return '#dc3545';
      case 'hired': return '#28a745';
      default: return '#6c757d';
    }
  };

  const handleViewApplication = (applicationId: string) => {
    router.push(`/employer/applications/${applicationId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
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
            <View>
              <Text variant="titleLarge" style={styles.title}>Applications</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>{jobTitle}</Text>
            </View>
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        <Searchbar
          placeholder="Search applicants"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <SegmentedButtons
          value={selectedStatus}
          onValueChange={handleStatusChange}
          buttons={[
            { value: 'all', label: `All (${applications.length})` },
            { 
              value: 'pending', 
              label: `Pending (${applications.filter(a => a.status === 'pending').length})`
            },
            { 
              value: 'shortlisted', 
              label: `Shortlisted (${applications.filter(a => a.status === 'shortlisted').length})`
            },
            { 
              value: 'hired', 
              label: `Hired (${applications.filter(a => a.status === 'hired').length})`
            }
          ]}
          style={styles.segmentedButtons}
        />

        {filteredApplications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge">No applications found</Text>
          </View>
        ) : (
          filteredApplications.map(application => (
            <Card 
              key={application.id} 
              style={styles.applicationCard}
              onPress={() => handleViewApplication(application.id)}
            >
              <Card.Content>
                <View style={styles.applicantInfo}>
                  <Avatar.Text 
                    size={40} 
                    label={application.applicant.full_name.charAt(0)} 
                    style={styles.avatar}
                  />
                  <View style={styles.applicantDetails}>
                    <Text variant="titleMedium">{application.applicant.full_name}</Text>
                    {application.applicant.title && (
                      <Text variant="bodyMedium" style={styles.applicantTitle}>
                        {application.applicant.title}
                      </Text>
                    )}
                  </View>
                  <Chip 
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(application.status) }
                    ]}
                    textStyle={styles.statusText}
                  >
                    {application.status}
                  </Chip>
                </View>

                {application.applicant.skills && application.applicant.skills.length > 0 && (
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
                )}

                <Text variant="bodySmall" style={styles.date}>
                  Applied on {new Date(application.created_at).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
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
  subtitle: {
    color: '#666',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  applicationCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#e6e6fe',
  },
  applicantDetails: {
    flex: 1,
  },
  applicantTitle: {
    color: '#666',
  },
  statusChip: {
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillChip: {
    backgroundColor: '#f0f2ff',
  },
  skillText: {
    color: '#4a5eff',
  },
  date: {
    color: '#666',
  },
}); 