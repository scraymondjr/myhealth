import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setupNotificationHandler, requestNotificationPermissions, rescheduleAllGoalNotifications } from '../utils/notifications';
import { useHealthStore } from '../store';

export default function RootLayout() {
  const goals = useHealthStore((s) => s.goals);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setupNotificationHandler();
      requestNotificationPermissions().then((granted) => {
        if (granted) {
          rescheduleAllGoalNotifications(goals.filter((g) => g.isActive));
        }
      });
    }
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="goal/[id]"
          options={{
            title: 'Goal',
            presentation: 'modal',
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#4CAF50',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
