import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Button, Text, Card, Searchbar, Chip, Avatar, ActivityIndicator, IconButton } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  created_at: string;
}

interface DatabaseJob {
  id: string;
  title: string;
  created_at: string;
  employer_profiles: {
    company_name: string;
    location: string;
  };
}

interface EmployerProfile {
  company_name: string;
  location: string;
}

interface JobStats {
  total: number;
  fullTime: number;
  partTime: number;
  applications: {
    total: number;
    pending: number;
    shortlisted: number;
    rejected: number;
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [jobStats, setJobStats] = useState<JobStats>({
    total: 0,
    fullTime: 0,
    partTime: 0,
    applications: {
      total: 0,
      pending: 0,
      shortlisted: 0,
      rejected: 0
    }
  });
  
  useEffect(() => {
    fetchUserProfile();
    fetchJobs();
    fetchJobStats();
  }, []);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('full_name')
        .eq('user_id', session.user.id)
        .single();
      
      if (data && !error) {
        const firstName = data.full_name.split(' ')[0];
        setUserName(firstName || 'there');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchJobStats = async () => {
    try {
      // Get applicant profile ID
      const { data: profile } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (!profile) return;

      // Get total active jobs
      const { data: totalJobs, error: totalError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      // Get full-time jobs
      const { data: fullTimeJobs, error: fullTimeError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .eq('employment_type', 'full-time');

      // Get part-time jobs
      const { data: partTimeJobs, error: partTimeError } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('status', 'active')
        .eq('employment_type', 'part-time');

      // Get application statistics
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select('status')
        .eq('applicant_id', profile.id);

      if (!totalError && !fullTimeError && !partTimeError && !applicationsError) {
        const applicationStats = {
          total: applications?.length || 0,
          pending: applications?.filter(a => a.status === 'pending').length || 0,
          shortlisted: applications?.filter(a => a.status === 'shortlisted').length || 0,
          rejected: applications?.filter(a => a.status === 'rejected').length || 0
        };

        setJobStats({
          total: totalJobs?.length || 0,
          fullTime: fullTimeJobs?.length || 0,
          partTime: partTimeJobs?.length || 0,
          applications: applicationStats
        });
      }
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      console.log('Fetching jobs...');
      
      // Fetch recommended jobs with search filter
      const recommendedQuery = supabase
        .from('jobs')
        .select(`
          id,
          title,
          company,
          location,
          salary_min,
          salary_max,
          employment_type,
          created_at,
          status
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      // Add search filter if query exists
      if (searchQuery) {
        recommendedQuery.or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data: recommended, error: recommendedError } = await recommendedQuery;

      console.log('Recommended jobs response:', { 
        count: recommended?.length,
        jobs: recommended,
        error: recommendedError 
      });

      if (!recommendedError && recommended) {
        const transformedRecommended = recommended.map(job => ({
          id: job.id,
          title: job.title,
          company_name: job.company || 'Unknown Company',
          location: job.location || 'Remote',
          salary_min: job.salary_min || 0,
          salary_max: job.salary_max || 0,
          job_type: job.employment_type || 'Full Time',
          created_at: job.created_at
        }));
        console.log('Transformed recommended jobs:', transformedRecommended);
        setRecommendedJobs(transformedRecommended);
      }

      // Fetch recent jobs with search filter
      const recentQuery = supabase
        .from('jobs')
        .select(`
          id,
          title,
          company,
          location,
          employment_type,
          created_at,
          status
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      // Add search filter if query exists
      if (searchQuery) {
        recentQuery.or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data: recent, error: recentError } = await recentQuery;

      console.log('Recent jobs response:', { 
        count: recent?.length,
        jobs: recent,
        error: recentError 
      });

      if (!recentError && recent) {
        const transformedRecent = recent.map(job => ({
          id: job.id,
          title: job.title,
          company_name: job.company || 'Unknown Company',
          location: job.location || 'Remote',
          job_type: job.employment_type || 'Full Time',
          created_at: job.created_at
        }));
        console.log('Transformed recent jobs:', transformedRecent);
        setRecentJobs(transformedRecent);
      }

      if (recommendedError) {
        console.error('Error fetching recommended jobs:', recommendedError);
      }
      if (recentError) {
        console.error('Error fetching recent jobs:', recentError);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchJobs(); // Refetch jobs with new search query
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text variant="titleMedium" style={styles.welcomeText}>Hello {userName}</Text>
          <Text variant="bodySmall" style={styles.subtitle}>Start Your New Journey</Text>
        </View>
        <View style={styles.headerButtons}>
          <IconButton
            icon="briefcase"
            size={24}
            onPress={() => router.push('/(app)/applications')}
            style={styles.applicationButton}
          />
          <IconButton
            icon="logout"
            size={24}
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
        </View>
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search for a job or company"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          icon={() => <Ionicons name="search-outline" size={20} color="#666" />}
        />
        
        <View style={styles.locationPicker}>
          <Ionicons name="location-outline" size={18} color="#666" />
          <Text variant="bodyMedium" style={styles.locationText}>Anywhere</Text>
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={[styles.statCard, { backgroundColor: '#4a5eff' }]}>
          <Text style={styles.statNumber}>{jobStats.applications.total}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#ff9d4a' }]}>
          <Text style={styles.statNumber}>{jobStats.applications.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#4bcffa' }]}>
          <Text style={styles.statNumber}>{jobStats.applications.shortlisted}</Text>
          <Text style={styles.statLabel}>Shortlisted</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium">Recommended</Text>
        <Text variant="bodySmall" onPress={() => router.push('/jobs')} style={styles.showAllButton}>Show All</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : recommendedJobs.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jobCardsScroll}>
          {recommendedJobs.map(job => (
            <Card key={job.id} style={styles.jobCard} onPress={() => router.push(`/(app)/jobs/${job.id}`)}>
              <View style={styles.companyLogo}>
                <Avatar.Text 
                  size={40} 
                  label={job.company_name?.charAt(0) || '?'} 
                  style={styles.logoAvatar} 
                />
              </View>
              <Card.Content>
                <Text variant="titleMedium" numberOfLines={1}>{job.title}</Text>
                <Text variant="bodySmall" style={styles.companyText}>{job.company_name}</Text>
                <Text variant="bodySmall" style={styles.locationText}>{job.location}</Text>
                <View style={styles.salaryRow}>
                  <Text variant="bodySmall" style={styles.salary}>
                    ${job.salary_min} - ${job.salary_max}/Year
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noJobsText}>No recommended jobs available</Text>
      )}

      <View style={styles.sectionHeader}>
        <Text variant="titleMedium">Recent Jobs</Text>
        <Text variant="bodySmall" onPress={() => router.push('/jobs')} style={styles.showAllButton}>Show All</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Design', 'Technology', 'Finance', 'Marketing', 'Sales'].map(category => (
            <Chip 
              key={category} 
              selected={selectedCategories.includes(category) || category === 'All'} 
              onPress={() => toggleCategory(category)}
              style={styles.filterChip}
              textStyle={styles.chipText}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : recentJobs.length > 0 ? (
        <View style={styles.recentJobsList}>
          {recentJobs.map(job => (
            <Card key={job.id} style={styles.recentJobCard} onPress={() => router.push(`/(app)/jobs/${job.id}`)}>
              <Card.Content style={styles.recentJobContent}>
                <Avatar.Text size={40} label={job.company_name.charAt(0)} style={styles.recentJobLogo} />
                <View style={styles.jobDetails}>
                  <Text variant="titleSmall" numberOfLines={1}>{job.title}</Text>
                  <Text variant="bodySmall" style={styles.companyText}>{job.company_name}</Text>
                  <Text variant="bodySmall" style={styles.locationText}>{job.location}</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      ) : (
        <Text style={styles.noJobsText}>No recent jobs available</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  subtitle: {
    color: '#666',
    marginTop: 2,
  },
  avatar: {
    backgroundColor: '#4a5eff',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchbar: {
    elevation: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  locationText: {
    color: '#666',
    marginLeft: 5,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  jobCardsScroll: {
    paddingLeft: 20,
    marginBottom: 25,
  },
  jobCard: {
    width: 220,
    marginRight: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  companyLogo: {
    paddingTop: 15,
    paddingLeft: 15,
  },
  logoAvatar: {
    backgroundColor: '#e6e6fe',
  },
  companyText: {
    color: '#666',
    marginTop: 4,
  },
  salaryRow: {
    marginTop: 10,
  },
  salary: {
    color: '#4a5eff',
    fontWeight: 'bold',
  },
  filterSection: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  filterChip: {
    marginRight: 10,
    backgroundColor: '#e6e6fe',
  },
  chipText: {
    color: '#4a5eff',
  },
  recentJobsList: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  recentJobCard: {
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  recentJobContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentJobLogo: {
    backgroundColor: '#e6e6fe',
    marginRight: 15,
  },
  jobDetails: {
    flex: 1,
  },
  loader: {
    padding: 20,
  },
  signOutButton: {
    marginLeft: 'auto',
  },
  noJobsText: {
    textAlign: 'center',
    color: '#757575',
    padding: 20,
  },
  showAllButton: {
    color: '#4a5eff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicationButton: {
    marginRight: 8,
  },
}); 