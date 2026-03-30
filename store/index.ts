import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, ProgressEntry, AppSettings, Reminder } from '../types';
import { format } from 'date-fns';

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

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Progress actions
  logProgress: (goalId: string, amount: number, notes?: string) => void;
  markComplete: (goalId: string, date?: string) => void;
  unmarkComplete: (goalId: string, date?: string) => void;

  // Selectors
  getTodayProgress: (goalId: string) => ProgressEntry | undefined;
  getProgressForDate: (goalId: string, date: string) => ProgressEntry | undefined;
  getCompletedDates: (goalId: string) => string[];
  getActiveGoals: () => Goal[];

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      goals: [],
      progressEntries: [],
      settings: {
        defaultEndOfDayReminderTime: '20:00',
        notificationsEnabled: true,
      },

      addGoal: (goalData) => {
        const goal: Goal = {
          ...goalData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ goals: [...state.goals, goal] }));
        return goal;
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          progressEntries: state.progressEntries.filter((p) => p.goalId !== id),
        }));
      },

      logProgress: (goalId, amount, notes = '') => {
        const date = todayStr();
        const existing = get().getProgressForDate(goalId, date);
        const goal = get().goals.find((g) => g.id === goalId);

        if (existing) {
          const newAmount = existing.amount + amount;
          const completed = goal ? newAmount >= goal.targetAmount : existing.completed;
          set((state) => ({
            progressEntries: state.progressEntries.map((p) =>
              p.id === existing.id
                ? { ...p, amount: newAmount, completed, notes: notes || p.notes, updatedAt: new Date().toISOString() }
                : p
            ),
          }));
        } else {
          const completed = goal ? amount >= goal.targetAmount : false;
          const entry: ProgressEntry = {
            id: generateId(),
            goalId,
            date,
            amount,
            completed,
            notes,
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({ progressEntries: [...state.progressEntries, entry] }));
        }
      },

      markComplete: (goalId, date) => {
        const targetDate = date ?? todayStr();
        const existing = get().getProgressForDate(goalId, targetDate);
        const goal = get().goals.find((g) => g.id === goalId);
        const amount = goal?.targetAmount ?? 0;

        if (existing) {
          set((state) => ({
            progressEntries: state.progressEntries.map((p) =>
              p.id === existing.id
                ? { ...p, completed: true, amount: Math.max(p.amount, amount), updatedAt: new Date().toISOString() }
                : p
            ),
          }));
        } else {
          const entry: ProgressEntry = {
            id: generateId(),
            goalId,
            date: targetDate,
            amount,
            completed: true,
            notes: '',
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({ progressEntries: [...state.progressEntries, entry] }));
        }
      },

      unmarkComplete: (goalId, date) => {
        const targetDate = date ?? todayStr();
        set((state) => ({
          progressEntries: state.progressEntries.map((p) =>
            p.goalId === goalId && p.date === targetDate
              ? { ...p, completed: false, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      getTodayProgress: (goalId) => {
        return get().getProgressForDate(goalId, todayStr());
      },

      getProgressForDate: (goalId, date) => {
        return get().progressEntries.find((p) => p.goalId === goalId && p.date === date);
      },

      getCompletedDates: (goalId) => {
        return get()
          .progressEntries.filter((p) => p.goalId === goalId && p.completed)
          .map((p) => p.date);
      },

      getActiveGoals: () => {
        return get().goals.filter((g) => g.isActive);
      },

      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
      },
    }),
    {
      name: 'myhealth-storage',
      storage: createJSONStorage(() => AsyncStorage),
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
