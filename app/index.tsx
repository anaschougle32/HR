import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Initializing..." />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // If authenticated, redirect based on role
  const userRole = session.user?.user_metadata?.role;
  
  switch (userRole) {
    case 'recruiter':
      return <Redirect href="/recruiter/" />;
    case 'employer':
      return <Redirect href="/employer/" />;
    case 'applicant':
      return <Redirect href="/(app)/" />;
    default:
      return <Redirect href="/(auth)/role-select" />;
  }
} 