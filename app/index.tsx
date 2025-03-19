import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function Index() {
  const { session, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  // If no session, always redirect to login first
  if (!session) {
    console.log('No session, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // If logged in, check role and redirect
  const userRole = session.user?.user_metadata?.role;
  console.log('User role:', userRole);

  switch (userRole) {
    case 'recruiter':
      return <Redirect href="/recruiter/" />;
    case 'employer':
      return <Redirect href="/employer/" />;
    case 'applicant':
      return <Redirect href="/(app)/" />;
    default:
      // Only show role selection after login if role is not set
      return <Redirect href="/(auth)/role-select" />;
  }
} 