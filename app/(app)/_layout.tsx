import { Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { session, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) return null;

  // If not authenticated or not an applicant, redirect to login
  if (!session || session.user.user_metadata?.role !== 'applicant') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="jobs" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="profile" />
    </Stack>
  );
} 