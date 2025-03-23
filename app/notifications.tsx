import { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Surface, 
  IconButton, 
  Card, 
  Button,
  Portal,
  Dialog,
  ActivityIndicator
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNotifications } from '../contexts/NotificationsContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    fetchNotifications,
    markAsRead,
    clearError
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const handleNotificationPress = async (notification: any) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead([notification.id]);
    }

    // Navigate based on notification type
    switch (notification.related_entity_type) {
      case 'job':
        router.push(`/jobs/${notification.related_entity_id}`);
        break;
      case 'application':
        router.push(`/applications/${notification.related_entity_id}`);
        break;
      case 'interview':
        router.push(`/interviews/${notification.related_entity_id}`);
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_scheduled':
        return 'calendar-clock';
      case 'application_status':
        return 'file-document-edit';
      case 'job_status':
        return 'briefcase';
      default:
        return 'bell';
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
            />
            <Text variant="headlineMedium" style={styles.title}>Notifications</Text>
          </View>
          {unreadCount > 0 && (
            <Button
              mode="text"
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
            >
              Mark all as read
            </Button>
          )}
        </View>
      </Surface>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bell-off" size={48} color="#666" />
          <Text variant="titleMedium" style={styles.emptyText}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <View style={styles.notificationsContainer}>
          {notifications.map(notification => (
            <Card
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <Card.Content style={styles.notificationContent}>
                <View style={styles.notificationIcon}>
                  <MaterialCommunityIcons
                    name={getNotificationIcon(notification.type)}
                    size={24}
                    color={!notification.read ? '#4a5eff' : '#666'}
                  />
                </View>
                <View style={styles.notificationDetails}>
                  <Text variant="titleMedium" style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text variant="bodySmall" style={styles.notificationDate}>
                    {new Date(notification.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <Portal>
        <Dialog visible={showError} onDismiss={() => setShowError(false)}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowError(false);
              clearError();
            }}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#666',
    marginTop: 16,
  },
  notificationsContainer: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  unreadCard: {
    backgroundColor: '#f0f3ff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 16,
    marginTop: 4,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#444',
    marginBottom: 8,
  },
  notificationDate: {
    color: '#666',
  },
}); 