import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../../store';
import { useAuthStore } from '../../store/auth';
import { GoalCard } from '../../components/GoalCard';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { formatDisplayDate } from '../../utils/date';

export default function TodayScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const goals = useHealthStore((s) => s.getActiveGoals());
  const getTodayProgress = useHealthStore((s) => s.getTodayProgress);
  const markComplete = useHealthStore((s) => s.markComplete);
  const unmarkComplete = useHealthStore((s) => s.unmarkComplete);
  const logProgress = useHealthStore((s) => s.logProgress);
  const pullFromRemote = useHealthStore((s) => s.pullFromRemote);
  const syncing = useHealthStore((s) => s.syncing);

  const completedCount = goals.filter((g) => getTodayProgress(g.id)?.completed).length;
  const todayLabel = formatDisplayDate(new Date());

  const [refreshing, setRefreshing] = React.useState(false);
  async function onRefresh() {
    setRefreshing(true);
    if (userId) await pullFromRemote(userId);
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel}>{todayLabel}</Text>
          {goals.length > 0 && (
            <Text style={styles.summaryText}>
              {completedCount} of {goals.length} goals completed
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/goal/new')}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Progress overview pill */}
      {goals.length > 0 && (
        <View style={styles.overviewBar}>
          <View
            style={[
              styles.overviewFill,
              { width: `${(completedCount / goals.length) * 100}%` },
            ]}
          />
          <Text style={styles.overviewText}>
            {completedCount === goals.length
              ? '🎉 All goals done!'
              : `${goals.length - completedCount} goal${goals.length - completedCount !== 1 ? 's' : ''} remaining`}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No goals yet"
            message="Add your first exercise goal to start tracking your progress."
            action={
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => router.push('/goal/new')}
              >
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.emptyAddBtnText}>Add Goal</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={getTodayProgress(goal.id)}
              onMarkComplete={() => markComplete(goal.id, undefined, userId)}
              onUnmarkComplete={() => unmarkComplete(goal.id, undefined, userId)}
              onLogProgress={(amount, notes) => logProgress(goal.id, amount, notes, userId)}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  overviewBar: {
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  overviewFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
  },
  overviewText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
    zIndex: 1,
  },
  list: {
    padding: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  emptyAddBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
