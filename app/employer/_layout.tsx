import { Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { Appbar, Menu } from 'react-native-paper';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

// Add type for route params
type RouteParams = {
  title?: string;
};

export default function EmployerLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const userRole = session?.user?.user_metadata?.role;

  if (loading) return null;

  // If not authenticated or not an employer, redirect to login
  if (!session || userRole !== 'employer') {
    return <Redirect href="/(auth)/login" />;
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Stack
      screenOptions={{
        header: ({ navigation, route }) => {
          const params = route.params as RouteParams;
          return (
            <Appbar.Header>
              {navigation.canGoBack() && (
                <Appbar.BackAction onPress={navigation.goBack} />
              )}
              <Appbar.Content 
                title={route.name === 'index' ? 'Dashboard' : params?.title || route.name} 
              />
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Appbar.Action
                    icon="account-circle"
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/employer/profile/');
                  }}
                  title="Company Profile"
                  leadingIcon="building"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/employer/applications/');
                  }}
                  title="Review Applications"
                  leadingIcon="file-document-multiple"
                />
                <Menu.Item
                  onPress={handleSignOut}
                  title="Sign Out"
                  leadingIcon="logout"
                />
              </Menu>
            </Appbar.Header>
          );
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Company Profile',
        }}
      />
      <Stack.Screen
        name="jobs"
        options={{
          title: 'Jobs',
        }}
      />
      <Stack.Screen
        name="applications"
        options={{
          title: 'Applications',
        }}
      />
    </Stack>
  );
} 