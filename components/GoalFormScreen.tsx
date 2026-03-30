/**
 * Shared goal form used by both /goal/new and /goal/[id].
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore, makeDefaultReminder } from '../store';
import { Colors } from '../constants/colors';
import { formatTime, parseTimeInput } from '../utils/date';
import { scheduleGoalNotifications } from '../utils/notifications';
import { Goal, Reminder } from '../types';

interface Props {
  /** Pass undefined for "new goal" mode, pass a goal for "edit" mode. */
  goal?: Goal;
}

export function GoalFormScreen({ goal }: Props) {
  const isNew = !goal;
  const router = useRouter();

  const addGoal = useHealthStore((s) => s.addGoal);
  const updateGoal = useHealthStore((s) => s.updateGoal);
  const settings = useHealthStore((s) => s.settings);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(goal?.name ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [unit, setUnit] = useState(goal?.unit ?? 'minutes');
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : '');
  const [color, setColor] = useState(goal?.color ?? Colors.goalColors[0]);
  const [endOfDayEnabled, setEndOfDayEnabled] = useState(goal?.endOfDayReminderEnabled ?? true);
  const [endOfDayTime, setEndOfDayTime] = useState(
    goal?.endOfDayReminderTime ?? settings.defaultEndOfDayReminderTime
  );
  const [editingEodTime, setEditingEodTime] = useState(false);
  const [eodTimeInput, setEodTimeInput] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>(goal?.reminders ?? []);
  const [isActive, setIsActive] = useState(goal?.isActive ?? true);

  const [addingReminder, setAddingReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('12:00');
  const [newReminderMessage, setNewReminderMessage] = useState('');

  function validate(): string | null {
    if (!name.trim()) return 'Please enter a goal name.';
    const amt = parseFloat(targetAmount);
    if (isNaN(amt) || amt <= 0) return 'Please enter a valid target amount greater than 0.';
    if (!unit.trim()) return 'Please enter a unit (e.g. minutes, steps).';
    return null;
  }

  async function handleSave() {
    const error = validate();
    if (error) {
      if (Platform.OS === 'web') {
        window.alert(error);
      } else {
        Alert.alert('Validation Error', error);
      }
      return;
    }

    const goalData: Omit<Goal, 'id' | 'createdAt'> = {
      name: name.trim(),
      description: description.trim(),
      unit: unit.trim(),
      targetAmount: parseFloat(targetAmount),
      color,
      endOfDayReminderEnabled: endOfDayEnabled,
      endOfDayReminderTime: endOfDayTime,
      reminders,
      isActive,
    };

    if (isNew) {
      const newGoal = addGoal(goalData);
      await scheduleGoalNotifications(newGoal);
    } else {
      updateGoal(goal!.id, goalData);
      await scheduleGoalNotifications({ ...goal!, ...goalData });
    }

    router.back();
  }

  function handleEodTimeSave() {
    const parsed = parseTimeInput(eodTimeInput);
    if (!parsed) {
      if (Platform.OS === 'web') window.alert('Invalid time format. Use HH:MM (e.g. 20:00)');
      else Alert.alert('Invalid Time', 'Use HH:MM format (e.g. 20:00)');
      return;
    }
    setEndOfDayTime(parsed);
    setEditingEodTime(false);
  }

  function addReminder() {
    const parsed = parseTimeInput(newReminderTime);
    if (!parsed) {
      if (Platform.OS === 'web') window.alert('Invalid time format. Use HH:MM');
      else Alert.alert('Invalid Time', 'Use HH:MM format');
      return;
    }
    setReminders((prev) => [...prev, makeDefaultReminder(parsed, newReminderMessage.trim())]);
    setNewReminderTime('12:00');
    setNewReminderMessage('');
    setAddingReminder(false);
  }

  function removeReminder(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleReminder(id: string) {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  const UNITS = ['minutes', 'steps', 'miles', 'km', 'reps', 'sets', 'hours', 'calories'];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Goal Details ──────────────────────────────────────────────────── */}
        <Text style={styles.section}>Goal Details</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Daily Walk"
              placeholderTextColor={Colors.textDisabled}
              maxLength={50}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional details about this goal"
              placeholderTextColor={Colors.textDisabled}
              maxLength={120}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.label}>Daily Target *</Text>
            <View style={styles.targetRow}>
              <TextInput
                style={[styles.input, styles.targetInput]}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
                placeholder="100"
                placeholderTextColor={Colors.textDisabled}
              />
              <Text style={styles.targetSep}>of</Text>
              <TextInput
                style={[styles.input, styles.unitInput]}
                value={unit}
                onChangeText={setUnit}
                placeholder="minutes"
                placeholderTextColor={Colors.textDisabled}
                autoCapitalize="none"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitChips}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, unit === u && styles.unitChipActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Color ──────────────────────────────────────────────────────────── */}
        <Text style={styles.section}>Color</Text>
        <View style={[styles.card, styles.colorRow]}>
          {Colors.goalColors.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchSelected]}
              onPress={() => setColor(c)}
            >
              {color === c && <Ionicons name="checkmark" size={16} color={Colors.white} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── End-of-day reminder ────────────────────────────────────────────── */}
        <Text style={styles.section}>End-of-Day Reminder</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={Colors.text} />
              <View>
                <Text style={styles.rowLabel}>Daily check-in reminder</Text>
                <Text style={styles.rowSub}>Asks if you completed this goal</Text>
              </View>
            </View>
            <Switch
              value={endOfDayEnabled}
              onValueChange={setEndOfDayEnabled}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={endOfDayEnabled ? Colors.primary : Colors.textDisabled}
            />
          </View>

          {endOfDayEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons name="time-outline" size={20} color={Colors.text} />
                  <Text style={styles.rowLabel}>Reminder time</Text>
                </View>
                {editingEodTime ? (
                  <View style={styles.inlineTimeRow}>
                    <TextInput
                      style={styles.inlineTimeInput}
                      value={eodTimeInput}
                      onChangeText={setEodTimeInput}
                      placeholder="HH:MM"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.saveBtn} onPress={handleEodTimeSave}>
                      <Text style={styles.saveBtnText}>OK</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingEodTime(false)}>
                      <Ionicons name="close-circle" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.timeChip}
                    onPress={() => { setEodTimeInput(endOfDayTime); setEditingEodTime(true); }}
                  >
                    <Text style={styles.timeChipText}>{formatTime(endOfDayTime)}</Text>
                    <Ionicons name="pencil" size={13} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {/* ── Additional reminders ───────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Additional Reminders</Text>
          <TouchableOpacity onPress={() => setAddingReminder(true)}>
            <Ionicons name="add-circle" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {reminders.length === 0 && !addingReminder && (
            <TouchableOpacity style={styles.emptyReminder} onPress={() => setAddingReminder(true)}>
              <Ionicons name="alarm-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.emptyReminderText}>
                Add check-ins throughout the day (e.g. halfway nudge at noon)
              </Text>
            </TouchableOpacity>
          )}

          {reminders.map((r, i) => (
            <View key={r.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.reminderRow}>
                <Switch
                  value={r.enabled}
                  onValueChange={() => toggleReminder(r.id)}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={r.enabled ? Colors.primary : Colors.textDisabled}
                  style={styles.reminderSwitch}
                />
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderTime, !r.enabled && styles.dimmed]}>
                    {formatTime(r.time)}
                  </Text>
                  {r.message ? (
                    <Text style={[styles.reminderMsg, !r.enabled && styles.dimmed]} numberOfLines={1}>
                      {r.message}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => removeReminder(r.id)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {addingReminder && (
            <>
              {reminders.length > 0 && <View style={styles.divider} />}
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>New Reminder</Text>
                <View style={styles.field}>
                  <Text style={styles.label}>Time (HH:MM 24-hour)</Text>
                  <TextInput
                    style={styles.input}
                    value={newReminderTime}
                    onChangeText={setNewReminderTime}
                    placeholder="12:00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    autoFocus
                  />
                </View>
                <View style={[styles.field, { marginTop: 8 }]}>
                  <Text style={styles.label}>Message (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newReminderMessage}
                    onChangeText={setNewReminderMessage}
                    placeholder="Time to make progress!"
                    maxLength={80}
                  />
                </View>
                <View style={styles.addFormActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setAddingReminder(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addBtn} onPress={addReminder}>
                    <Text style={styles.addBtnText}>Add Reminder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Active toggle (edit only) ──────────────────────────────────────── */}
        {!isNew && (
          <>
            <Text style={styles.section}>Status</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons name="power-outline" size={20} color={Colors.text} />
                  <View>
                    <Text style={styles.rowLabel}>Goal is active</Text>
                    <Text style={styles.rowSub}>Paused goals won't show on Today tab</Text>
                  </View>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={isActive ? Colors.primary : Colors.textDisabled}
                />
              </View>
            </View>
          </>
        )}

        {/* ── Save button ────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>{isNew ? 'Create Goal' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 16,
    paddingRight: 4,
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
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetInput: { width: 80, textAlign: 'center' },
  targetSep: { fontSize: 14, color: Colors.textSecondary },
  unitInput: { flex: 1 },
  unitChips: { marginTop: 10 },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.background,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  unitChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  unitChipTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: Colors.white,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  rowSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  inlineTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlineTimeInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 15,
    color: Colors.text,
    width: 68,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  timeChipText: { fontSize: 14, color: Colors.primaryDark, fontWeight: '600' },
  emptyReminder: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  emptyReminderText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  reminderSwitch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },
  reminderInfo: { flex: 1 },
  reminderTime: { fontSize: 15, fontWeight: '600', color: Colors.text },
  reminderMsg: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  dimmed: { opacity: 0.4 },
  addForm: { padding: 16 },
  addFormTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  addFormActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  addBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
