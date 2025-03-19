import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function RecruiterProfileScreen() {
  return (
    <View style={styles.container}>
      <Text>Recruiter Profile Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
}); 