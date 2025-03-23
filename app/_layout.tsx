import { useEffect, useState } from 'react';
import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import theme from './theme';

// Root layout must be exported as default
export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NotificationsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationsProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // If authenticated and in auth group, redirect based on role
      const userRole = session.user?.user_metadata?.role;
      
      switch (userRole) {
        case 'recruiter':
          router.replace('/recruiter/');
          break;
        case 'employer':
          router.replace('/employer/');
          break;
        case 'applicant':
          router.replace('/(app)/');
          break;
        default:
          router.replace('/(auth)/role-select');
      }
    }
  }, [session, loading, segments, isInitialized]);

  return <Slot />;
} 