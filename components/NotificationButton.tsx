import { View, StyleSheet } from 'react-native';
import { IconButton, Badge } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNotifications } from '../contexts/NotificationsContext';

export default function NotificationButton() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      <IconButton
        icon="bell"
        size={24}
        onPress={() => router.push('/notifications')}
      />
      {unreadCount > 0 && (
        <Badge
          size={20}
          style={styles.badge}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc3545',
  },
}); 