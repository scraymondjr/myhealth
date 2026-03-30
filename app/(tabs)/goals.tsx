import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../../store';
import { Colors } from '../../constants/colors';
import { EmptyState } from '../../components/EmptyState';
import { formatTime } from '../../utils/date';

export default function GoalsScreen() {
  const router = useRouter();
  const goals = useHealthStore((s) => s.goals);
  const updateGoal = useHealthStore((s) => s.updateGoal);
  const deleteGoal = useHealthStore((s) => s.deleteGoal);

  function confirmDelete(id: string, name: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}" and all its progress data?`)) deleteGoal(id);
    } else {
      Alert.alert('Delete Goal', `Delete "${name}" and all its progress data?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Goals</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/goal/new')}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No goals yet"
            message="Set up exercise goals to start tracking your progress."
            action={
              <TouchableOpacity style={styles.addEmptyBtn} onPress={() => router.push('/goal/new')}>
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.addEmptyBtnText}>Add First Goal</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          goals.map((goal) => (
            <View key={goal.id} style={styles.card}>
              <View style={[styles.colorBar, { backgroundColor: goal.color }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardName}>{goal.name}</Text>
                    <View style={[styles.statusBadge, goal.isActive ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, goal.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                        {goal.isActive ? 'Active' : 'Paused'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardTarget}>
                    {goal.targetAmount} {goal.unit} / day
                  </Text>
                  {goal.description ? (
                    <Text style={styles.cardDesc} numberOfLines={1}>{goal.description}</Text>
                  ) : null}
                </View>

                {/* Reminders summary */}
                <View style={styles.remindersInfo}>
                  {goal.endOfDayReminderEnabled && (
                    <View style={styles.reminderChip}>
                      <Ionicons name="notifications" size={12} color={Colors.primary} />
                      <Text style={styles.reminderChipText}>
                        EOD {formatTime(goal.endOfDayReminderTime)}
                      </Text>
                    </View>
                  )}
                  {goal.reminders.filter((r) => r.enabled).map((r) => (
                    <View key={r.id} style={styles.reminderChip}>
                      <Ionicons name="alarm" size={12} color={Colors.secondary} />
                      <Text style={styles.reminderChipText}>{formatTime(r.time)}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => updateGoal(goal.id, { isActive: !goal.isActive })}
                  >
                    <Ionicons
                      name={goal.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.actionBtnText}>
                      {goal.isActive ? 'Pause' : 'Resume'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/goal/${goal.id}`)}
                  >
                    <Ionicons name="pencil-outline" size={18} color={Colors.secondary} />
                    <Text style={[styles.actionBtnText, { color: Colors.secondary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => confirmDelete(goal.id, goal.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  colorBar: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { marginBottom: 8 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: { backgroundColor: Colors.primaryLight },
  statusInactive: { backgroundColor: Colors.border },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusActiveText: { color: Colors.primaryDark },
  statusInactiveText: { color: Colors.textSecondary },
  cardTarget: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textDisabled,
    marginTop: 2,
  },
  remindersInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  reminderChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  addEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addEmptyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
