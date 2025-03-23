import { Stack } from 'expo-router';

export default function JobsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Jobs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Job Details' }} />
      <Stack.Screen name="[id]/applications" options={{ title: 'Applications', headerShown: false }} />
      <Stack.Screen
        name="post"
        options={{
          title: 'Post New Job',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Edit Job',
          presentation: 'modal'
        }}
      />
    </Stack>
  );
} 