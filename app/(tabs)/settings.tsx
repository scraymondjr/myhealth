import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useHealthStore } from '../../store';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';
import { formatTime, parseTimeInput } from '../../utils/date';
import { requestNotificationPermissions, rescheduleAllGoalNotifications } from '../../utils/notifications';

export default function SettingsScreen() {
  const settings = useHealthStore((s) => s.settings);
  const updateSettings = useHealthStore((s) => s.updateSettings);
  const goals = useHealthStore((s) => s.goals);
  const syncing = useHealthStore((s) => s.syncing);
  const lastSyncedAt = useHealthStore((s) => s.lastSyncedAt);
  const pullFromRemote = useHealthStore((s) => s.pullFromRemote);

  const { user, signOut } = useAuthStore();

  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState(settings.defaultEndOfDayReminderTime);

  function saveTime() {
    const parsed = parseTimeInput(timeInput);
    if (!parsed) {
      if (Platform.OS === 'web') alert('Invalid time. Use HH:MM (e.g. 20:00)');
      else Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g. 20:00)');
      return;
    }
    updateSettings({ defaultEndOfDayReminderTime: parsed });
    setEditingTime(false);
  }

  async function handleToggleNotifications(value: boolean) {
    if (value && Platform.OS !== 'web') {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.'
        );
        return;
      }
      updateSettings({ notificationsEnabled: true });
      rescheduleAllGoalNotifications(goals.filter((g) => g.isActive));
    } else {
      updateSettings({ notificationsEnabled: value });
    }
  }

  function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out? Your data is saved to the cloud.')) signOut();
    } else {
      Alert.alert('Sign Out', 'Your data is saved to the cloud and will sync back when you sign in again.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]);
    }
  }

  function handleManualSync() {
    if (user) pullFromRemote(user.id);
  }

  const lastSyncDisplay = lastSyncedAt
    ? format(parseISO(lastSyncedAt), 'MMM d, h:mm a')
    : 'Never';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Account */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.rowLabel}>{user?.email ?? 'Signed in'}</Text>
              <Text style={styles.rowSub}>Logged in</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.row} onPress={handleSignOut}>
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={[styles.rowLabel, { color: Colors.danger }]}>Sign Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
        </TouchableOpacity>
      </View>

      {/* Sync */}
      <Text style={styles.sectionLabel}>Sync</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name={syncing ? 'sync' : 'cloud-done-outline'}
              size={20}
              color={syncing ? Colors.primary : Colors.success}
            />
            <View>
              <Text style={styles.rowLabel}>{syncing ? 'Syncing…' : 'Synced'}</Text>
              <Text style={styles.rowSub}>Last sync: {lastSyncDisplay}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
            onPress={handleManualSync}
            disabled={syncing}
          >
            {syncing
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Ionicons name="refresh" size={18} color={Colors.primary} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionLabel}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            <Text style={styles.rowLabel}>Enable Reminders</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={settings.notificationsEnabled ? Colors.primary : Colors.textDisabled}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="time-outline" size={20} color={Colors.text} />
            <View>
              <Text style={styles.rowLabel}>Default End-of-Day Time</Text>
              <Text style={styles.rowSub}>Applied to new goals unless overridden</Text>
            </View>
          </View>
          {editingTime ? (
            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                value={timeInput}
                onChangeText={setTimeInput}
                placeholder="HH:MM"
                keyboardType="numbers-and-punctuation"
                autoFocus
                maxLength={5}
              />
              <TouchableOpacity style={styles.saveTimeBtn} onPress={saveTime}>
                <Text style={styles.saveTimeBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingTime(false); setTimeInput(settings.defaultEndOfDayReminderTime); }}>
                <Ionicons name="close-circle" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.timeDisplay}
              onPress={() => { setTimeInput(settings.defaultEndOfDayReminderTime); setEditingTime(true); }}
            >
              <Text style={styles.timeDisplayText}>{formatTime(settings.defaultEndOfDayReminderTime)}</Text>
              <Ionicons name="pencil" size={14} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>About</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="heart-outline" size={20} color={Colors.danger} />
            <Text style={styles.rowLabel}>MyHealth</Text>
          </View>
          <Text style={styles.rowValue}>v1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="phone-portrait-outline" size={20} color={Colors.text} />
            <Text style={styles.rowLabel}>Platform</Text>
          </View>
          <Text style={styles.rowValue}>{Platform.OS}</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        All data is encrypted in transit and stored in your private Supabase account.{'\n'}
        Reminders are scheduled locally on your device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  rowSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  rowValue: { fontSize: 14, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 16 },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnDisabled: { opacity: 0.5 },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: Colors.text,
    width: 70,
    textAlign: 'center',
  },
  saveTimeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveTimeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  timeDisplay: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeDisplayText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  footer: {
    fontSize: 12,
    color: Colors.textDisabled,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingBottom: 8,
  },
});
