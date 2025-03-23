import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, Searchbar, Chip, Avatar, ActivityIndicator, IconButton, Portal, Modal, Button, TextInput, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
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
  description?: string;
  experience_level: number;
  category?: string;
}

interface Filters {
  employmentTypes: string[];
  categories: string[];
  salaryRange: [number, number];
  experienceLevels: number[];
}

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    employmentTypes: ['All'],
    categories: ['All'],
    salaryRange: [0, 200000],
    experienceLevels: []
  });

  const JOB_CATEGORIES = ['All', 'Design', 'Development', 'Marketing', 'Sales', 'Finance', 'HR', 'Technology'];
  const EMPLOYMENT_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
  const EXPERIENCE_LEVELS = [
    { value: 1, label: 'Entry' },
    { value: 2, label: 'Junior' },
    { value: 3, label: 'Mid' },
    { value: 4, label: 'Senior' },
    { value: 5, label: 'Expert' }
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          company,
          location,
          salary_min,
          salary_max,
          employment_type,
          experience_level,
          description,
          created_at,
          status,
          category
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        throw error;
      }

      if (data) {
        const transformedJobs = data.map(job => ({
          id: job.id,
          title: job.title,
          company_name: job.company || 'Unknown Company',
          location: job.location || 'Remote',
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          job_type: job.employment_type || 'Full Time',
          experience_level: job.experience_level,
          description: job.description,
          created_at: job.created_at,
          category: job.category || 'Other'
        }));
        setJobs(transformedJobs);
      }
    } catch (error) {
      console.error('Error in fetchJobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExperienceLevelText = (level: number) => {
    const levels = ['Entry', 'Junior', 'Mid', 'Senior', 'Expert'];
    return levels[level - 1] || 'Unknown';
  };

  const toggleEmploymentType = (type: string) => {
    if (type === 'All') {
      setFilters(prev => ({ ...prev, employmentTypes: ['All'] }));
    } else {
      setFilters(prev => {
        const newTypes = prev.employmentTypes.filter(t => t !== 'All');
        if (newTypes.includes(type)) {
          const filtered = newTypes.filter(t => t !== type);
          return { ...prev, employmentTypes: filtered.length ? filtered : ['All'] };
        } else {
          return { ...prev, employmentTypes: [...newTypes, type] };
        }
      });
    }
  };

  const toggleCategory = (category: string) => {
    if (category === 'All') {
      setFilters(prev => ({ ...prev, categories: ['All'] }));
    } else {
      setFilters(prev => {
        const newCategories = prev.categories.filter(c => c !== 'All');
        if (newCategories.includes(category)) {
          const filtered = newCategories.filter(c => c !== category);
          return { ...prev, categories: filtered.length ? filtered : ['All'] };
        } else {
          return { ...prev, categories: [...newCategories, category] };
        }
      });
    }
  };

  const toggleExperienceLevel = (level: number) => {
    setFilters(prev => {
      if (prev.experienceLevels.includes(level)) {
        return { ...prev, experienceLevels: prev.experienceLevels.filter(l => l !== level) };
      } else {
        return { ...prev, experienceLevels: [...prev.experienceLevels, level] };
      }
    });
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEmploymentType = filters.employmentTypes.includes('All') || 
      filters.employmentTypes.some(type => 
        job.job_type?.toLowerCase() === type.toLowerCase().replace(' ', '-')
      );

    const matchesCategory = filters.categories.includes('All') ||
      filters.categories.includes(job.category || 'Other');

    const matchesSalary = (!job.salary_min && !job.salary_max) ||
      (job.salary_min && job.salary_min >= filters.salaryRange[0] &&
       job.salary_max && job.salary_max <= filters.salaryRange[1]);

    const matchesExperience = filters.experienceLevels.length === 0 ||
      filters.experienceLevels.includes(job.experience_level);
    
    return matchesSearch && matchesEmploymentType && matchesCategory && 
           matchesSalary && matchesExperience;
  });

  const resetFilters = () => {
    setFilters({
      employmentTypes: ['All'],
      categories: ['All'],
      salaryRange: [0, 200000],
      experienceLevels: []
    });
  };

  const groupedJobs = () => {
    const grouped = JOB_CATEGORIES.filter(cat => cat !== 'All').reduce((acc, category) => {
      const jobs = filteredJobs.filter(job => job.category === category);
      if (jobs.length > 0) {
        acc[category] = jobs;
      }
      return acc;
    }, {} as Record<string, Job[]>);

    // Add "Other" category for uncategorized jobs
    const otherJobs = filteredJobs.filter(job => !job.category || !JOB_CATEGORIES.includes(job.category));
    if (otherJobs.length > 0) {
      grouped['Other'] = otherJobs;
    }

    return grouped;
  };

  const renderJobCard = (job: Job) => (
    <Card 
      key={job.id} 
      style={styles.jobCard}
      onPress={() => router.push(`/(app)/jobs/${job.id}`)}
    >
      <Card.Content>
        <View style={styles.jobHeader}>
          <Avatar.Text 
            size={50} 
            label={job.company_name.charAt(0)} 
            style={styles.companyLogo}
          />
          <View style={styles.jobTitleContainer}>
            <Text variant="titleMedium" style={styles.jobTitle}>{job.title}</Text>
            <Text variant="bodyMedium" style={styles.companyName}>{job.company_name}</Text>
            <Text variant="bodySmall" style={styles.location}>
              <Ionicons name="location-outline" size={14} color="#666" /> {job.location}
            </Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <Chip style={styles.jobTypeChip}>
            {job.job_type}
          </Chip>
          <Chip style={styles.categoryChip}>
            {job.category || 'Other'}
          </Chip>
          <Chip style={styles.experienceLevelChip}>
            {getExperienceLevelText(job.experience_level)}
          </Chip>
        </View>

        {job.salary_min && job.salary_max && (
          <Text variant="bodyMedium" style={styles.salary}>
            ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}/year
          </Text>
        )}

        {job.description && (
          <Text 
            variant="bodySmall" 
            numberOfLines={2} 
            style={styles.description}
          >
            {job.description}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search for a job or company"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            icon={() => <Ionicons name="search-outline" size={20} color="#666" />}
          />
          
          <View style={styles.filterHeader}>
            <View style={styles.locationPicker}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text variant="bodyMedium" style={styles.locationText}>Anywhere</Text>
            </View>
            <Button 
              mode="outlined" 
              onPress={() => setShowFilters(true)}
              icon="filter-variant"
              style={styles.filterButton}
            >
              Filters
            </Button>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {EMPLOYMENT_TYPES.map((type) => (
            <Chip
              key={type}
              selected={filters.employmentTypes.includes(type)}
              onPress={() => toggleEmploymentType(type)}
              style={[
                styles.filterChip,
                filters.employmentTypes.includes(type) && styles.selectedFilterChip
              ]}
              textStyle={filters.employmentTypes.includes(type) ? styles.selectedChipText : styles.chipText}
            >
              {type}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4a5eff" />
      ) : (
        <ScrollView style={styles.jobsList}>
          <View style={styles.resultsHeader}>
            <Text variant="titleMedium">{filteredJobs.length} Jobs Found</Text>
          </View>
          
          {filteredJobs.length > 0 ? (
            Object.entries(groupedJobs()).map(([category, jobs]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text variant="titleMedium" style={styles.categoryTitle}>
                    {category}
                  </Text>
                  <Text variant="bodyMedium" style={styles.categoryCount}>
                    {jobs.length} jobs
                  </Text>
                </View>
                <Divider style={styles.divider} />
                {jobs.map(job => renderJobCard(job))}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium">No jobs found</Text>
              <Text variant="bodyMedium">Try adjusting your search or filters</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>Filters</Text>
            
            <Text variant="titleMedium" style={styles.filterTitle}>Job Categories</Text>
            <View style={styles.chipGroup}>
              {JOB_CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  selected={filters.categories.includes(category)}
                  onPress={() => toggleCategory(category)}
                  style={[
                    styles.filterChip,
                    filters.categories.includes(category) && styles.selectedFilterChip
                  ]}
                  textStyle={filters.categories.includes(category) ? styles.selectedChipText : styles.chipText}
                >
                  {category}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.filterTitle}>Experience Level</Text>
            <View style={styles.chipGroup}>
              {EXPERIENCE_LEVELS.map(({ value, label }) => (
                <Chip
                  key={value}
                  selected={filters.experienceLevels.includes(value)}
                  onPress={() => toggleExperienceLevel(value)}
                  style={[
                    styles.filterChip,
                    filters.experienceLevels.includes(value) && styles.selectedFilterChip
                  ]}
                  textStyle={filters.experienceLevels.includes(value) ? styles.selectedChipText : styles.chipText}
                >
                  {label}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.filterTitle}>Salary Range</Text>
            <View style={styles.salaryRangeContainer}>
              <View style={styles.salaryInputs}>
                <TextInput
                  mode="outlined"
                  label="Min Salary"
                  value={filters.salaryRange[0].toString()}
                  onChangeText={(value) => {
                    const numValue = parseInt(value) || 0;
                    setFilters(prev => ({ 
                      ...prev, 
                      salaryRange: [numValue, Math.max(numValue, prev.salaryRange[1])] 
                    }));
                  }}
                  keyboardType="numeric"
                  style={styles.salaryInput}
                />
                <Text variant="bodyMedium" style={styles.salaryDash}>-</Text>
                <TextInput
                  mode="outlined"
                  label="Max Salary"
                  value={filters.salaryRange[1].toString()}
                  onChangeText={(value) => {
                    const numValue = parseInt(value) || 0;
                    setFilters(prev => ({ 
                      ...prev, 
                      salaryRange: [Math.min(prev.salaryRange[0], numValue), numValue] 
                    }));
                  }}
                  keyboardType="numeric"
                  style={styles.salaryInput}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={resetFilters} style={styles.resetButton}>
                Reset Filters
              </Button>
              <Button mode="contained" onPress={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchbar: {
    elevation: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterButton: {
    borderColor: '#e0e0e0',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#e6e6fe',
  },
  chipText: {
    color: '#666',
  },
  selectedChipText: {
    color: '#4a5eff',
  },
  jobsList: {
    padding: 16,
  },
  jobCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  companyLogo: {
    backgroundColor: '#e6e6fe',
    marginRight: 12,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  companyName: {
    color: '#666',
    marginTop: 2,
  },
  location: {
    color: '#666',
    marginTop: 2,
  },
  jobDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  jobTypeChip: {
    backgroundColor: '#e6f7ff',
  },
  categoryChip: {
    backgroundColor: '#fff0e6',
  },
  experienceLevelChip: {
    backgroundColor: '#edf7ed',
  },
  salary: {
    color: '#4a5eff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  selectedFilterChip: {
    backgroundColor: '#4a5eff',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  filterTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  salaryRangeContainer: {
    marginTop: 8,
  },
  salaryInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salaryInput: {
    flex: 1,
  },
  salaryDash: {
    marginHorizontal: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  categoryCount: {
    color: '#666',
  },
  divider: {
    marginBottom: 12,
    backgroundColor: '#e0e0e0',
  },
}); 