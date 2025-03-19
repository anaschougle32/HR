// Candidate tracking system
interface CandidateStatus {
  id: string;
  applicant_id: string;
  job_id: string;
  status: 'new' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected';
  notes?: string;
  rating?: number;
  interview_date?: string;
} 

import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function CandidatesScreen() {
  return (
    <View style={styles.container}>
      <Text>Candidates Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
}); 