/**
 * Thin sync layer between the local Zustand store and Supabase.
 *
 * Strategy:
 *  - Mutations are optimistic: local state updates immediately.
 *  - Each mutation fires a background upsert/delete to Supabase.
 *  - On sign-in (or explicit pull), Supabase data is fetched and merged
 *    into the local store (remote wins on conflict by updated_at).
 *  - Errors are logged; the app stays functional offline.
 */
import { supabase } from '../lib/supabase';
import { Goal, ProgressEntry } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function goalToRow(goal: Goal, userId: string) {
  return {
    id: goal.id,
    user_id: userId,
    name: goal.name,
    description: goal.description,
    unit: goal.unit,
    target_amount: goal.targetAmount,
    color: goal.color,
    end_of_day_reminder_enabled: goal.endOfDayReminderEnabled,
    end_of_day_reminder_time: goal.endOfDayReminderTime,
    reminders: goal.reminders,
    is_active: goal.isActive,
    created_at: goal.createdAt,
  };
}

function rowToGoal(row: Record<string, any>): Goal {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    unit: row.unit,
    targetAmount: Number(row.target_amount),
    color: row.color,
    endOfDayReminderEnabled: row.end_of_day_reminder_enabled,
    endOfDayReminderTime: row.end_of_day_reminder_time,
    reminders: row.reminders ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function entryToRow(entry: ProgressEntry, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    goal_id: entry.goalId,
    date: entry.date,
    amount: entry.amount,
    completed: entry.completed,
    notes: entry.notes,
    updated_at: entry.updatedAt,
  };
}

function rowToEntry(row: Record<string, any>): ProgressEntry {
  return {
    id: row.id,
    goalId: row.goal_id,
    date: row.date,
    amount: Number(row.amount),
    completed: row.completed,
    notes: row.notes ?? '',
    updatedAt: row.updated_at,
  };
}

// ── pull (remote → local) ─────────────────────────────────────────────────────

export async function pullAll(userId: string): Promise<{
  goals: Goal[];
  progressEntries: ProgressEntry[];
} | null> {
  const [goalsRes, entriesRes] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('progress_entries').select('*').eq('user_id', userId).order('date', { ascending: false }),
  ]);

  if (goalsRes.error) {
    console.error('[sync] pullAll goals error:', goalsRes.error.message);
    return null;
  }
  if (entriesRes.error) {
    console.error('[sync] pullAll entries error:', entriesRes.error.message);
    return null;
  }

  return {
    goals: (goalsRes.data ?? []).map(rowToGoal),
    progressEntries: (entriesRes.data ?? []).map(rowToEntry),
  };
}

// ── push individual records (local → remote) ──────────────────────────────────

export async function pushGoal(goal: Goal, userId: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .upsert(goalToRow(goal, userId), { onConflict: 'id' });
  if (error) console.error('[sync] pushGoal error:', error.message);
}

export async function removeGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (error) console.error('[sync] removeGoal error:', error.message);
}

export async function pushProgressEntry(entry: ProgressEntry, userId: string): Promise<void> {
  const { error } = await supabase
    .from('progress_entries')
    .upsert(entryToRow(entry, userId), { onConflict: 'id' });
  if (error) console.error('[sync] pushProgressEntry error:', error.message);
}

// ── push all local data to remote (used after sign-up with pre-existing data) ─

export async function pushAll(
  goals: Goal[],
  progressEntries: ProgressEntry[],
  userId: string,
): Promise<void> {
  if (goals.length > 0) {
    const { error } = await supabase
      .from('goals')
      .upsert(goals.map((g) => goalToRow(g, userId)), { onConflict: 'id' });
    if (error) console.error('[sync] pushAll goals error:', error.message);
  }

  if (progressEntries.length > 0) {
    const { error } = await supabase
      .from('progress_entries')
      .upsert(progressEntries.map((e) => entryToRow(e, userId)), { onConflict: 'id' });
    if (error) console.error('[sync] pushAll entries error:', error.message);
  }
}
