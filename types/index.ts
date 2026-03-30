export interface Reminder {
  id: string;
  time: string;    // "HH:MM" 24-hour format
  message: string;
  enabled: boolean;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  unit: string;           // e.g. "minutes", "steps", "miles"
  targetAmount: number;
  color: string;
  endOfDayReminderEnabled: boolean;
  endOfDayReminderTime: string;  // "HH:MM", default "20:00"
  reminders: Reminder[];         // additional mid-day reminders
  createdAt: string;
  isActive: boolean;
}

export interface ProgressEntry {
  id: string;
  goalId: string;
  date: string;      // "YYYY-MM-DD"
  amount: number;
  completed: boolean;
  notes: string;
  updatedAt: string;
}

export interface AppSettings {
  defaultEndOfDayReminderTime: string;  // "HH:MM"
  notificationsEnabled: boolean;
}
