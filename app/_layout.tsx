import { useEffect, useState, useCallback } from 'react';
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
        await Font.loadAsync({
          // Poppins
          'Poppins': require('../assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
          
          // Montserrat
          'Montserrat': require('../assets/fonts/Montserrat-Regular.ttf'),
          'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
          'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
          'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
          
          // Lexend
          'Lexend': require('../assets/fonts/Lexend-Regular.ttf'),
          'Lexend-Medium': require('../assets/fonts/Lexend-Medium.ttf'),
          'Lexend-SemiBold': require('../assets/fonts/Lexend-SemiBold.ttf'),
          'Lexend-Bold': require('../assets/fonts/Lexend-Bold.ttf'),
          
          // Inter
          'Inter': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
          
          // Verdana is a system font, no need to load it
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

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
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