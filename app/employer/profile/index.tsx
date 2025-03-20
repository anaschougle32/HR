import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

// Enhanced company profile with more fields
interface CompanyProfile {
  id: string;
  company_name: string;
  description: string;
  location: string;
  industry?: string;
  company_size?: string;
  website?: string;
  logo_url?: string;
}

export default function EmployerProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState({
    company_name: '',
    description: '',
    location: '',
    industry: '',
    company_size: '',
    website: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setForm({
          company_name: data.company_name || '',
          description: data.description || '',
          location: data.location || '',
          industry: data.industry || '',
          company_size: data.company_size || '',
          website: data.website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error('No user session found');
      }

      console.log('Checking for existing profile...');
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (checkError) {
        console.log('Error checking profile:', checkError);
      }

      console.log('Existing profile:', existingProfile);

      const profileData = {
        user_id: session.user.id,
        company_name: form.company_name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        industry: form.industry.trim(),
        company_size: form.company_size.trim(),
        website: form.website.trim(),
        updated_at: new Date().toISOString()
      };

      console.log('Saving profile data:', profileData);

      let error;
      if (existingProfile) {
        console.log('Updating existing profile...');
        // Update existing profile
        const { error: updateError } = await supabase
          .from('employer_profiles')
          .update(profileData)
          .eq('user_id', session.user.id);
        error = updateError;
        if (updateError) {
          console.log('Update error:', updateError);
        }
      } else {
        console.log('Creating new profile...');
        // Insert new profile
        const { error: insertError } = await supabase
          .from('employer_profiles')
          .insert([profileData]);
        error = insertError;
        if (insertError) {
          console.log('Insert error:', insertError);
        }
      }

      if (error) {
        console.error('Profile save error:', error);
        throw error;
      }

      console.log('Profile saved successfully');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Company Profile
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Company Name"
            value={form.company_name}
            onChangeText={(text) => setForm({ ...form, company_name: text })}
            style={styles.input}
          />

          <TextInput
            label="Industry"
            value={form.industry}
            onChangeText={(text) => setForm({ ...form, industry: text })}
            style={styles.input}
          />

          <TextInput
            label="Company Size"
            value={form.company_size}
            onChangeText={(text) => setForm({ ...form, company_size: text })}
            style={styles.input}
          />

          <TextInput
            label="Website"
            value={form.website}
            onChangeText={(text) => setForm({ ...form, website: text })}
            style={styles.input}
          />

          <TextInput
            label="Location"
            value={form.location}
            onChangeText={(text) => setForm({ ...form, location: text })}
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.button}
          >
            Save Changes
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
  },
}); 