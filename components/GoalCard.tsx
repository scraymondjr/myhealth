import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, ProgressEntry } from '../types';
import { ProgressBar } from './ProgressBar';
import { Colors } from '../constants/colors';
import { LogProgressModal } from './LogProgressModal';

interface Props {
  goal: Goal;
  progress?: ProgressEntry;
  onMarkComplete: () => void;
  onUnmarkComplete: () => void;
  onLogProgress: (amount: number, notes: string) => void;
}

export function GoalCard({ goal, progress, onMarkComplete, onUnmarkComplete, onLogProgress }: Props) {
  const [showModal, setShowModal] = useState(false);

  const currentAmount = progress?.amount ?? 0;
  const isCompleted = progress?.completed ?? false;
  const progressRatio = Math.min(1, currentAmount / goal.targetAmount);
  const percentText = Math.round(progressRatio * 100);

  function handleToggleComplete() {
    if (isCompleted) {
      if (Platform.OS === 'web') {
        if (window.confirm('Mark this goal as incomplete?')) onUnmarkComplete();
      } else {
        Alert.alert('Mark Incomplete', 'Mark this goal as incomplete for today?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: onUnmarkComplete },
        ]);
      }
    } else {
      onMarkComplete();
    }
  }

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      <View style={[styles.colorBar, { backgroundColor: goal.color }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.completedText}>Done</Text>
              </View>
            )}
          </View>
          <Text style={styles.target}>
            {currentAmount} / {goal.targetAmount} {goal.unit}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <ProgressBar progress={progressRatio} color={goal.color} />
          <Text style={[styles.percent, { color: isCompleted ? Colors.success : Colors.textSecondary }]}>
            {percentText}%
          </Text>
        </View>

        {goal.description ? (
          <Text style={styles.description} numberOfLines={1}>{goal.description}</Text>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.btnSecondaryText}>Log Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, isCompleted ? styles.btnDone : styles.btnPrimary]}
            onPress={handleToggleComplete}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={16}
              color={Colors.white}
            />
            <Text style={styles.btnPrimaryText}>
              {isCompleted ? 'Completed' : 'Mark Done'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <LogProgressModal
        visible={showModal}
        goal={goal}
        currentAmount={currentAmount}
        onClose={() => setShowModal(false)}
        onSubmit={(amount, notes) => {
          onLogProgress(amount, notes);
          setShowModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompleted: {
    opacity: 0.85,
  },
  colorBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  completedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  target: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  percent: {
    fontSize: 12,
    fontWeight: '600',
    width: 38,
    textAlign: 'right',
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnDone: {
    backgroundColor: Colors.success,
  },
  btnSecondary: {
    backgroundColor: Colors.primaryLight,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  btnSecondaryText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
