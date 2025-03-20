import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, HelperText, Card, IconButton, Portal, Modal, Menu, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import { Buffer } from 'buffer';

type WorkExperience = {
  id?: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
};

function decode(base64String: string): Buffer {
  return Buffer.from(base64String, 'base64');
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<WorkExperience | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    location: '',
    title: '',
    about: '',
  });

  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [currentExperience, setCurrentExperience] = useState<WorkExperience>({
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchExperiences();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          fullName: data.full_name || '',
          phone: data.phone || '',
          location: data.location || '',
          title: data.title || '',
          about: data.about || '',
        });
        setResumeUrl(data.resume_url || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error('No user session found');
      }

      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile:', checkError);
        throw checkError;
      }

      const profileData = {
        user_id: session.user.id,
        full_name: profile.fullName.trim(),
        phone: profile.phone.trim(),
        location: profile.location.trim(),
        title: profile.title.trim(),
        about: profile.about.trim(),
        resume_url: resumeUrl,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existingProfile) {
        console.log('Updating existing profile...');
        const { error: updateError } = await supabase
          .from('applicant_profiles')
          .update(profileData)
          .eq('user_id', session.user.id)
          .select()
          .single();
        error = updateError;
      } else {
        console.log('Creating new profile...');
        const { error: insertError } = await supabase
          .from('applicant_profiles')
          .insert([profileData])
          .select()
          .single();
        error = insertError;
      }

      if (error) {
        console.error('Profile save error:', error);
        throw error;
      }

      router.back();
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExperience = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('work_experiences')
        .insert({
          user_id: session?.user.id,
          ...currentExperience,
        });

      if (error) throw error;
      
      await fetchExperiences();
      setShowExperienceModal(false);
      setCurrentExperience({
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add experience');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExperience = async () => {
    try {
      setLoading(true);
      if (!selectedExperience?.id) return;

      const { error } = await supabase
        .from('work_experiences')
        .update({
          company: currentExperience.company,
          position: currentExperience.position,
          start_date: currentExperience.start_date,
          end_date: currentExperience.end_date,
          description: currentExperience.description,
        })
        .eq('id', selectedExperience.id);

      if (error) throw error;
      
      await fetchExperiences();
      setShowEditModal(false);
      setSelectedExperience(null);
      setCurrentExperience({
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update experience');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('work_experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchExperiences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete experience');
    } finally {
      setLoading(false);
      setMenuVisible(null);
    }
  };

  const handleResumeUpload = async () => {
    try {
      setResumeLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFileName(file.name);

      const fileExt = file.name.split('.').pop();
      const fileName = `${session?.user.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      // Read the file as base64
      const fileBase64 = await fetch(file.uri).then(response =>
        response.blob()
      ).then(blob => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });

      // Remove the data:application/pdf;base64, prefix
      const base64Data = String(fileBase64).split(',')[1];

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('resumes')
        .upload(filePath, decode(base64Data), {
          contentType: file.mimeType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      setResumeUrl(publicUrl);
      console.log('Upload successful, URL:', publicUrl);

    } catch (err) {
      console.error('Upload error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Profile Details</Text>
      </View>

      <View style={styles.form}>
        {/* Basic Info Section */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
              label="Full Name"
              value={profile.fullName}
              onChangeText={(text) => setProfile({ ...profile, fullName: text })}
              style={styles.input}
            />
            <TextInput
              label="Professional Title"
              value={profile.title}
              onChangeText={(text) => setProfile({ ...profile, title: text })}
              placeholder="e.g. Senior Software Engineer"
              style={styles.input}
            />
            <TextInput
              label="Phone Number"
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              label="Location"
              value={profile.location}
              onChangeText={(text) => setProfile({ ...profile, location: text })}
              placeholder="e.g. New York, NY"
              style={styles.input}
            />
            <TextInput
              label="About"
              value={profile.about}
              onChangeText={(text) => setProfile({ ...profile, about: text })}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            <View style={styles.resumeSection}>
              <Text variant="titleMedium">Resume</Text>
              {resumeLoading ? (
                <ActivityIndicator style={styles.resumeLoader} />
              ) : resumeUrl ? (
                <View style={styles.resumeContainer}>
                  <Text variant="bodyMedium" numberOfLines={1} style={styles.resumeText}>
                    {selectedFileName || 'Resume uploaded'}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={handleResumeUpload}
                    style={styles.resumeButton}
                  >
                    Update Resume
                  </Button>
                </View>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handleResumeUpload}
                  icon="upload"
                  style={styles.resumeButton}
                >
                  Upload Resume
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Work Experience Section */}
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium">Work Experience</Text>
              <IconButton
                icon="plus"
                onPress={() => setShowExperienceModal(true)}
              />
            </View>
            
            {experiences.map((exp, index) => (
              <Card key={exp.id || index} style={styles.experienceCard}>
                <Card.Content>
                  <View style={styles.experienceHeader}>
                    <View style={styles.experienceTitle}>
                      <Text variant="titleMedium">{exp.position}</Text>
                      <Text variant="bodyLarge">{exp.company}</Text>
                    </View>
                    <Menu
                      visible={menuVisible === exp.id}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => setMenuVisible(exp.id || null)}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          setMenuVisible(null);
                          setSelectedExperience(exp);
                          setCurrentExperience(exp);
                          setShowEditModal(true);
                        }}
                        title="Edit"
                      />
                      <Menu.Item
                        onPress={() => {
                          if (exp.id) handleDeleteExperience(exp.id);
                        }}
                        title="Delete"
                      />
                    </Menu>
                  </View>
                  <Text variant="bodyMedium" style={styles.dates}>
                    {exp.start_date} - {exp.end_date}
                  </Text>
                  <Text variant="bodyMedium">{exp.description}</Text>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>

        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Save Profile
        </Button>
      </View>

      {/* Experience Modal */}
      <Portal>
        <Modal
          visible={showExperienceModal}
          onDismiss={() => setShowExperienceModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Add Work Experience</Text>
          <TextInput
            label="Company"
            value={currentExperience.company}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, company: text })}
            style={styles.input}
          />
          <TextInput
            label="Position"
            value={currentExperience.position}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, position: text })}
            style={styles.input}
          />
          <TextInput
            label="Start Date"
            value={currentExperience.start_date}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, start_date: text })}
            placeholder="YYYY-MM"
            style={styles.input}
          />
          <TextInput
            label="End Date"
            value={currentExperience.end_date}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, end_date: text })}
            placeholder="YYYY-MM or Present"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={currentExperience.description}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, description: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleAddExperience}
            loading={loading}
            style={styles.button}
          >
            Add Experience
          </Button>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => {
            setShowEditModal(false);
            setSelectedExperience(null);
            setCurrentExperience({
              company: '',
              position: '',
              start_date: '',
              end_date: '',
              description: '',
            });
          }}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Edit Work Experience</Text>
          <TextInput
            label="Company"
            value={currentExperience.company}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, company: text })}
            style={styles.input}
          />
          <TextInput
            label="Position"
            value={currentExperience.position}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, position: text })}
            style={styles.input}
          />
          <TextInput
            label="Start Date"
            value={currentExperience.start_date}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, start_date: text })}
            placeholder="YYYY-MM"
            style={styles.input}
          />
          <TextInput
            label="End Date"
            value={currentExperience.end_date}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, end_date: text })}
            placeholder="YYYY-MM or Present"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={currentExperience.description}
            onChangeText={(text) => setCurrentExperience({ ...currentExperience, description: text })}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleEditExperience}
            loading={loading}
            style={styles.button}
          >
            Update Experience
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  experienceCard: {
    marginTop: 10,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  experienceTitle: {
    flex: 1,
  },
  dates: {
    opacity: 0.7,
    marginVertical: 5,
  },
  button: {
    marginTop: 10,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 20,
  },
  resumeSection: {
    marginTop: 20,
  },
  resumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  resumeText: {
    flex: 1,
    marginRight: 10,
  },
  resumeButton: {
    marginTop: 10,
  },
  resumeLoader: {
    marginTop: 10,
  },
}); 