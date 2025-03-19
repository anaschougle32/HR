import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function VerifyEmailScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Verify Your Email
      </Text>
      
      <Text variant="bodyLarge" style={styles.message}>
        We've sent you an email with a verification link. Please check your inbox and click the link to verify your account.
      </Text>

      <Button
        mode="contained"
        onPress={() => router.replace('/auth/login')}
        style={styles.button}
      >
        Return to Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  button: {
    marginTop: 10,
  },
}); 