import { Platform } from 'react-native';
import { Goal } from '../types';

// Expo Notifications is not supported on web — import conditionally
let Notifications: typeof import('expo-notifications') | null = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
}

export function setupNotificationHandler() {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleGoalNotifications(goal: Goal): Promise<void> {
  if (!Notifications) return;
  if (!goal.isActive) {
    await cancelGoalNotifications(goal.id);
    return;
  }

  // Cancel existing notifications for this goal before rescheduling
  await cancelGoalNotifications(goal.id);

  // End-of-day reminder
  if (goal.endOfDayReminderEnabled) {
    const [hour, minute] = goal.endOfDayReminderTime.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: `eod-${goal.id}`,
      content: {
        title: '🏃 Daily Goal Check-in',
        body: `Did you complete your "${goal.name}" goal today? (${goal.targetAmount} ${goal.unit})`,
        data: { goalId: goal.id, type: 'end-of-day' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  // Additional mid-day / custom reminders
  for (const reminder of goal.reminders) {
    if (!reminder.enabled) continue;
    const [hour, minute] = reminder.time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: `rem-${goal.id}-${reminder.id}`,
      content: {
        title: goal.name,
        body: reminder.message || `Time to work on your "${goal.name}" goal!`,
        data: { goalId: goal.id, type: 'reminder', reminderId: reminder.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function cancelGoalNotifications(goalId: string): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(`eod-${goalId}`) || n.identifier.startsWith(`rem-${goalId}-`))
      .map((n) => Notifications!.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function rescheduleAllGoalNotifications(goals: Goal[]): Promise<void> {
  if (!Notifications) return;
  await Promise.all(goals.map((g) => scheduleGoalNotifications(g)));
}
