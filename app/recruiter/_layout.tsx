import { Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';
import { Appbar, Menu } from 'react-native-paper';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function RecruiterLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  if (loading) return null;

  // If not authenticated or not a recruiter, redirect to login
  if (!session || session.user.user_metadata?.role !== 'recruiter') {
    return <Redirect href="/(auth)/login" />;
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Stack
      screenOptions={{
        header: ({ navigation, route, options }) => {
          const title = options.title || route.name;
          return (
            <Appbar.Header>
              <Appbar.BackAction onPress={navigation.goBack} />
              <Appbar.Content title={title} />
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Appbar.Action 
                    icon="dots-vertical" 
                    onPress={() => setMenuVisible(true)} 
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/recruiter/profile');
                  }}
                  title="Profile"
                  leadingIcon="account"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/recruiter/applications');
                  }}
                  title="Applications"
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
          title: 'Profile',
        }}
      />
      <Stack.Screen
        name="applications/index"
        options={{
          title: 'Applications',
        }}
      />
      <Stack.Screen
        name="applications/[id]"
        options={{
          title: 'Application Details',
        }}
      />
    </Stack>
  );
} 