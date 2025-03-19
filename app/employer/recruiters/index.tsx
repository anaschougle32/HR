import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Button, FAB, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

interface Recruiter {
  id: string;
  full_name: string;
  title: string;
  email: string;
  permissions: {
    can_post_jobs: boolean;
    can_review_applications: boolean;
    can_interview: boolean;
  };
  created_at: string;
}

export default function RecruitersScreen() {
  const router = useRouter();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const { data: profile } = await supabase
        .from('employer_profiles')
        .select('id')
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('recruiter_profiles')
        .select('*')
        .eq('employer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecruiters(data || []);
    } catch (error) {
      console.error('Error fetching recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          {recruiters.map((recruiter) => (
            <Card key={recruiter.id} style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge">{recruiter.full_name}</Text>
                <Text variant="titleMedium">{recruiter.title}</Text>
                <Text variant="bodyMedium">{recruiter.email}</Text>
                
                <View style={styles.permissions}>
                  {recruiter.permissions.can_post_jobs && (
                    <Text variant="bodySmall">Can post jobs</Text>
                  )}
                  {recruiter.permissions.can_review_applications && (
                    <Text variant="bodySmall">Can review applications</Text>
                  )}
                  {recruiter.permissions.can_interview && (
                    <Text variant="bodySmall">Can conduct interviews</Text>
                  )}
                </View>
              </Card.Content>
              <Card.Actions>
                <Button
                  onPress={() => router.push(`/employer/recruiters/${recruiter.id}`)}
                >
                  Manage Permissions
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/employer/recruiters/invite')}
        label="Invite Recruiter"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 15,
  },
  permissions: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 