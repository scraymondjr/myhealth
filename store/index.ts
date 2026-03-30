import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, ProgressEntry, AppSettings, Reminder } from '../types';
import { format } from 'date-fns';
import { pushGoal, removeGoal, pushProgressEntry, pullAll } from './sync';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

interface HealthStore {
  goals: Goal[];
  progressEntries: ProgressEntry[];
  settings: AppSettings;
  /** Tracks whether a sync is in-flight (for UI indicator) */
  syncing: boolean;
  /** ISO timestamp of last successful pull from Supabase */
  lastSyncedAt: string | null;

  // ── Goal actions ────────────────────────────────────────────────────────────
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>, userId?: string) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>, userId?: string) => void;
  deleteGoal: (id: string) => void;

  // ── Progress actions ────────────────────────────────────────────────────────
  logProgress: (goalId: string, amount: number, notes?: string, userId?: string) => void;
  markComplete: (goalId: string, date?: string, userId?: string) => void;
  unmarkComplete: (goalId: string, date?: string, userId?: string) => void;

  // ── Sync ────────────────────────────────────────────────────────────────────
  /** Pull everything from Supabase and replace local state */
  pullFromRemote: (userId: string) => Promise<void>;

  // ── Selectors ───────────────────────────────────────────────────────────────
  getTodayProgress: (goalId: string) => ProgressEntry | undefined;
  getProgressForDate: (goalId: string, date: string) => ProgressEntry | undefined;
  getCompletedDates: (goalId: string) => string[];
  getActiveGoals: () => Goal[];

  // ── Settings ────────────────────────────────────────────────────────────────
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      goals: [],
      progressEntries: [],
      syncing: false,
      lastSyncedAt: null,
      settings: {
        defaultEndOfDayReminderTime: '20:00',
        notificationsEnabled: true,
      },

      // ── Goals ────────────────────────────────────────────────────────────────

      addGoal: (goalData, userId) => {
        const goal: Goal = {
          ...goalData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ goals: [...s.goals, goal] }));
        if (userId) pushGoal(goal, userId);
        return goal;
      },

      updateGoal: (id, updates, userId) => {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
        if (userId) {
          const updated = get().goals.find((g) => g.id === id);
          if (updated) pushGoal(updated, userId);
        }
      },

      deleteGoal: (id) => {
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          progressEntries: s.progressEntries.filter((p) => p.goalId !== id),
        }));
        removeGoal(id); // fire-and-forget; always delete remote regardless of auth
      },

      // ── Progress ─────────────────────────────────────────────────────────────

      logProgress: (goalId, amount, notes = '', userId) => {
        const date = todayStr();
        const existing = get().getProgressForDate(goalId, date);
        const goal = get().goals.find((g) => g.id === goalId);
        let updatedEntry: ProgressEntry;

        if (existing) {
          const newAmount = existing.amount + amount;
          const completed = goal ? newAmount >= goal.targetAmount : existing.completed;
          updatedEntry = {
            ...existing,
            amount: newAmount,
            completed,
            notes: notes || existing.notes,
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({
            progressEntries: s.progressEntries.map((p) =>
              p.id === existing.id ? updatedEntry : p
            ),
          }));
        } else {
          const completed = goal ? amount >= goal.targetAmount : false;
          updatedEntry = {
            id: generateId(),
            goalId,
            date,
            amount,
            completed,
            notes,
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({ progressEntries: [...s.progressEntries, updatedEntry] }));
        }

        if (userId) pushProgressEntry(updatedEntry, userId);
      },

      markComplete: (goalId, date, userId) => {
        const targetDate = date ?? todayStr();
        const existing = get().getProgressForDate(goalId, targetDate);
        const goal = get().goals.find((g) => g.id === goalId);
        const amount = goal?.targetAmount ?? 0;
        let updatedEntry: ProgressEntry;

        if (existing) {
          updatedEntry = {
            ...existing,
            completed: true,
            amount: Math.max(existing.amount, amount),
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({
            progressEntries: s.progressEntries.map((p) =>
              p.id === existing.id ? updatedEntry : p
            ),
          }));
        } else {
          updatedEntry = {
            id: generateId(),
            goalId,
            date: targetDate,
            amount,
            completed: true,
            notes: '',
            updatedAt: new Date().toISOString(),
          };
          set((s) => ({ progressEntries: [...s.progressEntries, updatedEntry] }));
        }

        if (userId) pushProgressEntry(updatedEntry, userId);
      },

      unmarkComplete: (goalId, date, userId) => {
        const targetDate = date ?? todayStr();
        const existing = get().getProgressForDate(goalId, targetDate);
        if (!existing) return;
        const updatedEntry: ProgressEntry = {
          ...existing,
          completed: false,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          progressEntries: s.progressEntries.map((p) =>
            p.goalId === goalId && p.date === targetDate ? updatedEntry : p
          ),
        }));
        if (userId) pushProgressEntry(updatedEntry, userId);
      },

      // ── Sync ─────────────────────────────────────────────────────────────────

      pullFromRemote: async (userId) => {
        set({ syncing: true });
        const data = await pullAll(userId);
        if (data) {
          set({
            goals: data.goals,
            progressEntries: data.progressEntries,
            lastSyncedAt: new Date().toISOString(),
          });
        }
        set({ syncing: false });
      },

      // ── Selectors ─────────────────────────────────────────────────────────────

      getTodayProgress: (goalId) => get().getProgressForDate(goalId, todayStr()),

      getProgressForDate: (goalId, date) =>
        get().progressEntries.find((p) => p.goalId === goalId && p.date === date),

      getCompletedDates: (goalId) =>
        get()
          .progressEntries.filter((p) => p.goalId === goalId && p.completed)
          .map((p) => p.date),

      getActiveGoals: () => get().goals.filter((g) => g.isActive),

      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),
    }),
    {
      name: 'myhealth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient sync state
      partialize: (s) => ({
        goals: s.goals,
        progressEntries: s.progressEntries,
        settings: s.settings,
        lastSyncedAt: s.lastSyncedAt,
      }),
    }
  )
);

export function makeDefaultReminder(time: string, message: string): Reminder {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    time,
    message,
    enabled: true,
  };
}
