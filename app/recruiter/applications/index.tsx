import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, SegmentedButtons, ActivityIndicator, Avatar, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface ApplicationStats {
  total: number;
  pending: number;
  shortlisted: number;
  rejected: number;
  hired: number;
}

interface RawDatabaseApplication {
  id: string;
  created_at: string;
  status: string;
  jobs: {
    title: string;
    company: string;
    category: string;
  };
  applicant_profiles: {
    id: string;
    full_name: string;
    title: string | null;
  };
}

interface Application {
  id: string;
  created_at: string;
  status: string;
  job: {
    title: string;
    company: string;
    category: string;
  };
  applicant: {
    id: string;
    full_name: string;
    title: string | null;
  };
}

const APPLICATION_STATUSES = ['pending', 'shortlisted', 'rejected', 'hired'];

export default function ApplicationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchApplications();
    }
  }, [session]);

  useEffect(() => {
    filterApplications();
  }, [searchQuery, selectedStatus, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // Get all applications without employer restriction
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          status,
          jobs (
            title,
            company,
            category
          ),
          applicant_profiles (
            id,
            full_name,
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data) {
        throw new Error('No applications found');
      }

      const rawData = data as unknown as RawDatabaseApplication[];

      // Transform the data to match the Application interface
      const transformedData: Application[] = rawData.map(item => ({
        id: item.id,
        created_at: item.created_at,
        status: item.status,
        job: {
          title: item.jobs?.title || 'Unknown Job',
          company: item.jobs?.company || 'Unknown Company',
          category: item.jobs?.category || 'Unknown Category'
        },
        applicant: {
          id: item.applicant_profiles?.id || '',
          full_name: item.applicant_profiles?.full_name || 'Unknown Applicant',
          title: item.applicant_profiles?.title || null
        }
      }));

      setApplications(transformedData);

      // Calculate stats
      const newStats = {
        total: transformedData.length,
        pending: transformedData.filter(app => app.status === 'pending').length,
        shortlisted: transformedData.filter(app => app.status === 'shortlisted').length,
        rejected: transformedData.filter(app => app.status === 'rejected').length,
        hired: transformedData.filter(app => app.status === 'hired').length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.applicant.full_name.toLowerCase().includes(query) ||
        app.job.title.toLowerCase().includes(query) ||
        app.job.company.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      const updatedApplications = applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      );
      setApplications(updatedApplications);

      // Update stats
      const newStats = {
        total: updatedApplications.length,
        pending: updatedApplications.filter(app => app.status === 'pending').length,
        shortlisted: updatedApplications.filter(app => app.status === 'shortlisted').length,
        rejected: updatedApplications.filter(app => app.status === 'rejected').length,
        hired: updatedApplications.filter(app => app.status === 'hired').length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a5eff" />
        <Text style={styles.loadingText}>Loading applications...</Text>
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
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>Applications</Text>

        <Searchbar
          placeholder="Search applications"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.statsContainer}>
          <Surface style={[styles.statCard, { backgroundColor: '#4a5eff' }]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: '#ffd700' }]}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: '#00c853' }]}>
            <Text style={styles.statNumber}>{stats.shortlisted}</Text>
            <Text style={styles.statLabel}>Shortlisted</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: '#ff4a4a' }]}>
            <Text style={styles.statNumber}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </Surface>
        </View>

        <SegmentedButtons
          value={selectedStatus}
          onValueChange={setSelectedStatus}
          buttons={[
            { value: 'all', label: 'All' },
            ...APPLICATION_STATUSES.map(status => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1)
            }))
          ]}
          style={styles.statusFilter}
        />

        <Text variant="titleMedium" style={styles.resultsText}>
          {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
        </Text>

        {filteredApplications.map(application => (
          <Card 
            key={application.id}
            style={styles.applicationCard}
            onPress={() => router.push(`/recruiter/applications/${application.id}`)}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <Avatar.Text 
                  size={40} 
                  label={application.applicant.full_name.charAt(0)} 
                  style={styles.avatar}
                />
                <View style={styles.headerInfo}>
                  <Text variant="titleMedium">{application.applicant.full_name}</Text>
                  <Text variant="bodySmall">{application.applicant.title || 'No title'}</Text>
                </View>
                <Chip 
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(application.status) }
                  ]}
                >
                  {application.status}
                </Chip>
              </View>

              <View style={styles.jobInfo}>
                <Text variant="titleSmall" style={styles.jobTitle}>
                  {application.job.title}
                </Text>
                <Text variant="bodySmall" style={styles.companyText}>
                  {application.job.company}
                </Text>
                <Text variant="bodySmall" style={styles.dateText}>
                  Applied {new Date(application.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.actions}>
                {APPLICATION_STATUSES.map(status => (
                  status !== application.status && (
                    <Button
                      key={status}
                      mode="outlined"
                      onPress={() => updateApplicationStatus(application.id, status)}
                      style={styles.actionButton}
                      textColor="#4a5eff"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  )
                ))}
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
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
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  statusFilter: {
    marginBottom: 16,
  },
  resultsText: {
    marginBottom: 16,
    color: '#666',
  },
  applicationCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#e6e6fe',
  },
  headerInfo: {
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
  },
  jobInfo: {
    marginBottom: 12,
  },
  jobTitle: {
    color: '#4a5eff',
    marginBottom: 4,
  },
  companyText: {
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderColor: '#4a5eff',
    borderRadius: 12,
  },
}); 