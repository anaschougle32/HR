import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { Button, Text, Card, HelperText, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function RoleSelectScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, loading: authLoading } = useAuth();
  const [roleSelectLoading, setRoleSelectLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'applicant' | 'employer' | 'recruiter' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [jobseekerError, setJobseekerError] = useState(false);
  const [employerError, setEmployerError] = useState(false);
  const [recruiterError, setRecruiterError] = useState(false);

  // Check session and refresh if needed
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
        router.replace('/(auth)/login');
        return;
      }
      if (!currentSession) {
        router.replace('/(auth)/login');
        return;
      }
    };
    checkSession();
  }, []);

  const handleRoleSelect = async (role: 'applicant' | 'employer' | 'recruiter') => {
    try {
      setSelectedRole(role);
      setRoleSelectLoading(true);
      setError(null);

      // Get current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !currentSession) {
        throw new Error('No active session found. Please login again.');
      }

      // Update user metadata with role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      });

      if (updateError) throw updateError;

      // Check if profile already exists
      let tableName = '';
      let defaultData = {};

      switch (role) {
        case 'applicant':
          tableName = 'applicant_profiles';
          defaultData = {
            full_name: '',
            phone: '',
            location: '',
          };
          break;
        case 'employer':
          tableName = 'employer_profiles';
          defaultData = {
            company_name: '',
            description: '',
            location: '',
          };
          break;
        case 'recruiter':
          tableName = 'recruiter_profiles';
          // First, get the first employer from employer_profiles
          const { data: firstEmployer, error: employerError } = await supabase
            .from('employer_profiles')
            .select('id')
            .limit(1)
            .single();
          
          if (employerError && employerError.code !== 'PGRST116') {
            throw employerError;
          }

          defaultData = {
            full_name: '',
            title: '',
            email: currentSession.user.email,
            employer_id: firstEmployer?.id || null,
            permissions: {
              can_post_jobs: true,
              can_review_applications: true,
              can_interview: true
            }
          };
          break;
      }

      const { data: existingProfile, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', currentSession.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Only create profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from(tableName)
          .insert({
            user_id: currentSession.user.id,
            ...defaultData
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }
      }

      // Redirect to appropriate profile setup
      switch (role) {
        case 'recruiter':
          router.replace('/recruiter/');
          break;
        case 'employer':
          router.replace('/employer/profile');
          break;
        case 'applicant':
          router.replace('/profile');
          break;
      }
    } catch (err) {
      console.error('Role selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set role');
      setSelectedRole(null);
    } finally {
      setRoleSelectLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4a5eff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.logoContainer}>
        {logoError ? (
          <View style={[styles.logo, styles.placeholderLogo]}>
            <Text style={styles.placeholderText}>JobHR</Text>
          </View>
        ) : (
          <Image 
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            onError={() => setLogoError(true)}
          />
        )}
      </View>
      
      <Text variant="headlineLarge" style={styles.title}>
        Choose Your Role
      </Text>
      
      <Text variant="bodyLarge" style={styles.subtitle}>
        Select the option that best describes you
      </Text>

      <View style={styles.cardsContainer}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => !roleSelectLoading && handleRoleSelect('applicant')}
          disabled={roleSelectLoading}
        >
          <Card 
            style={[
              styles.card, 
              selectedRole === 'applicant' && styles.selectedCard
            ]}
            mode="outlined"
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.roleIconContainer}>
                {jobseekerError ? (
                  <Text style={styles.placeholderIcon}>JS</Text>
                ) : (
                  <Image 
                    source={require('../../assets/jobseeker.png')}
                    style={styles.roleIcon}
                    resizeMode="contain"
                    onError={() => setJobseekerError(true)}
                  />
                )}
              </View>
              <Text variant="titleLarge" style={styles.roleTitle}>Job Seeker</Text>
              <Text variant="bodyMedium" style={styles.roleDescription}>
                Find your dream job and connect with top employers
              </Text>
              {selectedRole === 'applicant' && roleSelectLoading && (
                <ActivityIndicator size="small" color="#4a5eff" style={styles.roleLoader} />
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => !roleSelectLoading && handleRoleSelect('employer')}
          disabled={roleSelectLoading}
        >
          <Card 
            style={[
              styles.card, 
              selectedRole === 'employer' && styles.selectedCard
            ]}
            mode="outlined"
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.roleIconContainer}>
                {employerError ? (
                  <Text style={styles.placeholderIcon}>EM</Text>
                ) : (
                  <Image 
                    source={require('../../assets/employer.png')}
                    style={styles.roleIcon}
                    resizeMode="contain"
                    onError={() => setEmployerError(true)}
                  />
                )}
              </View>
              <Text variant="titleLarge" style={styles.roleTitle}>Employer</Text>
              <Text variant="bodyMedium" style={styles.roleDescription}>
                Post jobs and find the perfect candidates for your company
              </Text>
              {selectedRole === 'employer' && roleSelectLoading && (
                <ActivityIndicator size="small" color="#4a5eff" style={styles.roleLoader} />
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => !roleSelectLoading && handleRoleSelect('recruiter')}
          disabled={roleSelectLoading}
        >
          <Card 
            style={[
              styles.card, 
              selectedRole === 'recruiter' && styles.selectedCard
            ]}
            mode="outlined"
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.roleIconContainer}>
                {recruiterError ? (
                  <Text style={styles.placeholderIcon}>RC</Text>
                ) : (
                  <Image 
                    source={require('../../assets/recruiter.png')}
                    style={styles.roleIcon}
                    resizeMode="contain"
                    onError={() => setRecruiterError(true)}
                  />
                )}
              </View>
              <Text variant="titleLarge" style={styles.roleTitle}>Recruiter</Text>
              <Text variant="bodyMedium" style={styles.roleDescription}>
                Manage job postings and handle recruitment process
              </Text>
              {selectedRole === 'recruiter' && roleSelectLoading && (
                <ActivityIndicator size="small" color="#4a5eff" style={styles.roleLoader} />
              )}
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>

      {error && <HelperText type="error" style={styles.errorText}>{error}</HelperText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 40,
    marginTop: 8,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  selectedCard: {
    borderColor: '#4a5eff',
    borderWidth: 2,
    backgroundColor: '#F5F7FF',
  },
  cardContent: {
    padding: 8,
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIcon: {
    width: 50,
    height: 50,
  },
  roleTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  roleDescription: {
    textAlign: 'center',
    color: '#757575',
  },
  roleLoader: {
    marginTop: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
  },
  placeholderLogo: {
    backgroundColor: '#4a5eff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholderIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a5eff',
  },
}); 