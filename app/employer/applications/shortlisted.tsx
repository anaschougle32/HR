import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Chip, 
  Searchbar, 
  ActivityIndicator, 
  Surface,
  IconButton,
  Avatar
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface SupabaseApplication {
  id: string;
  created_at: string;
  status: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  applicant: {
    id: string;
    full_name: string;
    title: string;
    experience: string;
    skills: string[];
  };
}

interface ShortlistedApplication {
  id: string;
  created_at: string;
  status: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  applicant: {
    id: string;
    full_name: string;
    title: string | null;
    experience: string | null;
    skills: string[] | null;
  };
}

export default function ShortlistedApplicationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<ShortlistedApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApplications = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          created_at,
          status,
          job:jobs (
            id,
            title,
            company
          ),
          applicant:applicant_profiles (
            id,
            full_name,
            title,
            experience,
            skills
          )
        `)
        .eq('status', 'shortlisted')
        .order('created_at', { ascending: false })
        .returns<SupabaseApplication[]>();

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData: ShortlistedApplication[] = (data || []).map(app => ({
        id: app.id,
        created_at: app.created_at,
        status: app.status,
        job: {
          id: app.job.id,
          title: app.job.title,
          company: app.job.company
        },
        applicant: {
          id: app.applicant.id,
          full_name: app.applicant.full_name,
          title: app.applicant.title,
          experience: app.applicant.experience,
          skills: app.applicant.skills
        }
      }));

      setApplications(transformedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [session]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const filteredApplications = applications.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    return (
      app.applicant.full_name.toLowerCase().includes(searchLower) ||
      app.job.title.toLowerCase().includes(searchLower) ||
      (app.applicant.title && app.applicant.title.toLowerCase().includes(searchLower))
    );
  });

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
            <Text variant="headlineMedium" style={styles.title}>
              Shortlisted Applications
            </Text>
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        <Searchbar
          placeholder="Search applications"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {filteredApplications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge">No shortlisted applications found</Text>
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
                    <Text variant="bodyMedium" style={styles.jobTitle}>
                      {application.job.title} at {application.job.company}
                    </Text>
                  </View>
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
                  Shortlisted on {new Date(application.created_at).toLocaleDateString()}
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
  content: {
    padding: 16,
    gap: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
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
    alignItems: 'flex-start',
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
    marginBottom: 4,
  },
  jobTitle: {
    color: '#4a5eff',
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