import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, Button, Searchbar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  salary_range: string;
  experience_level: number;
};

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExperienceLevelText = (level: number) => {
    const levels = ['Entry', 'Junior', 'Mid', 'Senior', 'Expert'];
    return levels[level - 1] || 'Unknown';
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Available Jobs</Text>
        <Searchbar
          placeholder="Search jobs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.content}>
        {filteredJobs.map(job => (
          <Card key={job.id} style={styles.card}>
            <Card.Title
              title={job.title}
              subtitle={job.company}
            />
            <Card.Content>
              <View style={styles.chipContainer}>
                <Chip icon="map-marker">{job.location}</Chip>
                <Chip icon="star">
                  {getExperienceLevelText(job.experience_level)}
                </Chip>
                {job.salary_range && (
                  <Chip icon="currency-usd">{job.salary_range}</Chip>
                )}
              </View>
              <Text variant="bodyMedium" numberOfLines={3} style={styles.description}>
                {job.description}
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push(`/jobs/${job.id}`)}>
                View Details
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  description: {
    marginTop: 10,
  },
}); 