import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { setupNotificationHandler, requestNotificationPermissions, rescheduleAllGoalNotifications } from '../utils/notifications';
import { useHealthStore } from '../store';
import { useAuthStore } from '../store/auth';
import { pushAll } from '../store/sync';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { init, user, initialized } = useAuthStore();
  const { goals, progressEntries, pullFromRemote, settings } = useHealthStore();

  // ── Boot auth listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, []);

  // ── Auth-based routing ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, segments]);

  // ── On sign-in: pull remote data, then schedule notifications ───────────────
  useEffect(() => {
    if (!user) return;

    // Pull Supabase → local (remote wins)
    pullFromRemote(user.id);

    // On first sign-in from a device that already has local data,
    // push that local data up so it isn't lost.
    if (goals.length > 0 || progressEntries.length > 0) {
      pushAll(goals, progressEntries, user.id);
    }

    // Set up notifications
    if (Platform.OS !== 'web') {
      setupNotificationHandler();
      requestNotificationPermissions().then((granted) => {
        if (granted) {
          rescheduleAllGoalNotifications(goals.filter((g) => g.isActive));
        }
      });
    }
  }, [user?.id]);

  // ── Show spinner until auth is resolved ────────────────────────────────────
  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="goal/new"
          options={{
            title: 'New Goal',
            presentation: 'modal',
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.primary,
          }}
        />
        <Stack.Screen
          name="goal/[id]"
          options={{
            title: 'Edit Goal',
            presentation: 'modal',
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.primary,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
