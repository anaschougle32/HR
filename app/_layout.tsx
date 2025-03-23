import { useEffect, useState } from 'react';
import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import theme from './theme';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Root layout must be exported as default
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          'Poppins': require('../assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf')
        });

        // Add artificial delay to ensure fonts are loaded
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen once everything is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NotificationsProvider>
          <RootLayoutNav />
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

  return <Stack screenOptions={{ headerShown: false }} />;
} 