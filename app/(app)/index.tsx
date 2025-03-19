import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Welcome to JobHR</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Your Professional Journey Starts Here
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title title="Complete Your Profile" />
          <Card.Content>
            <Text variant="bodyMedium">
              Add your professional details, experience, and skills to stand out.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.push('/(app)/profile')}>
              Update Profile
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Browse Jobs" />
          <Card.Content>
            <Text variant="bodyMedium">
              Explore available positions matching your skills and experience.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.push('/(app)/jobs')}>
              View Jobs
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="My Applications" />
          <Card.Content>
            <Text variant="bodyMedium">
              Track your job applications and interview status.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => router.push('/(app)/applications')}>
              View Applications
            </Button>
          </Card.Actions>
        </Card>
      </View>

      <Button 
        mode="outlined" 
        onPress={handleSignOut} 
        style={styles.signOutButton}
      >
        Sign Out
      </Button>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 15,
  },
  signOutButton: {
    margin: 20,
  },
}); 