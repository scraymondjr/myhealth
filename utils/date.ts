import { format, isToday, isYesterday, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatTime(time: string): string {
  // Convert "HH:MM" 24hr to "h:mm AM/PM"
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteStr.padStart(2, '0')} ${period}`;
}

export function parseTimeInput(input: string): string | null {
  // Accept "HH:MM" and validate
  const match = input.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
}
