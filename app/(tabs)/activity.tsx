import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';
import { useHealthStore } from '../../store';
import { Colors } from '../../constants/colors';
import { formatDate } from '../../utils/date';
import { ProgressBar } from '../../components/ProgressBar';

// react-native-calendars only works on native. On web fall back to custom grid.
let Calendar: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  Calendar = require('react-native-calendars').Calendar;
}

type View = 'calendar' | 'list';

export default function ActivityScreen() {
  const [view, setView] = useState<View>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const goals = useHealthStore((s) => s.goals);
  const progressEntries = useHealthStore((s) => s.progressEntries);

  // Build calendar marked dates — dots per goal, green if completed
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const entry of progressEntries) {
      const goal = goals.find((g) => g.id === entry.goalId);
      if (!goal) continue;
      if (!marks[entry.date]) {
        marks[entry.date] = { dots: [], marked: true };
      }
      marks[entry.date].dots.push({
        key: entry.goalId,
        color: entry.completed ? Colors.success : goal.color,
      });
    }
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: Colors.primary,
      };
    }
    return marks;
  }, [progressEntries, goals, selectedDate]);

  // Entries for selected date or for list view
  const selectedEntries = useMemo(() => {
    if (!selectedDate) return [];
    return progressEntries.filter((e) => e.date === selectedDate);
  }, [progressEntries, selectedDate]);

  // Recent activity for list view — last 30 days grouped by date
  const recentActivity = useMemo(() => {
    const last30 = new Set(
      Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'))
    );
    const byDate: Record<string, typeof progressEntries> = {};
    for (const entry of progressEntries) {
      if (!last30.has(entry.date)) continue;
      if (!byDate[entry.date]) byDate[entry.date] = [];
      byDate[entry.date].push(entry);
    }
    return Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));
  }, [progressEntries]);

  return (
    <View style={styles.container}>
      {/* View toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'calendar' && styles.toggleBtnActive]}
          onPress={() => setView('calendar')}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={view === 'calendar' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.toggleText, view === 'calendar' && styles.toggleTextActive]}>
            Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
          onPress={() => setView('list')}
        >
          <Ionicons
            name="list"
            size={16}
            color={view === 'list' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'calendar' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Calendar */}
          {Calendar ? (
            <Calendar
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={(day: { dateString: string }) => {
                setSelectedDate(day.dateString === selectedDate ? null : day.dateString);
              }}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
                dotColor: Colors.primary,
                textSectionTitleColor: Colors.textSecondary,
              }}
            />
          ) : (
            <WebCalendar
              markedDates={markedDates}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
            />
          )}

          {/* Day detail */}
          {selectedDate && (
            <View style={styles.dayDetail}>
              <Text style={styles.dayDetailTitle}>{formatDate(selectedDate)}</Text>
              {selectedEntries.length === 0 ? (
                <Text style={styles.noActivity}>No activity recorded</Text>
              ) : (
                selectedEntries.map((entry) => {
                  const goal = goals.find((g) => g.id === entry.goalId);
                  if (!goal) return null;
                  return (
                    <EntryRow key={entry.id} entry={entry} goal={goal} />
                  );
                })
              )}
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>Partial progress</Text>
            </View>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        <FlatList
          data={recentActivity}
          keyExtractor={([date]) => date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textDisabled} />
              <Text style={styles.emptyText}>No activity yet</Text>
              <Text style={styles.emptySubtext}>Start logging progress on the Today tab</Text>
            </View>
          }
          renderItem={({ item: [date, entries] }) => (
            <View style={styles.dateGroup}>
              <Text style={styles.dateGroupLabel}>{formatDate(date)}</Text>
              {entries.map((entry) => {
                const goal = goals.find((g) => g.id === entry.goalId);
                if (!goal) return null;
                return <EntryRow key={entry.id} entry={entry} goal={goal} />;
              })}
            </View>
          )}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}
    </View>
  );
}

function EntryRow({ entry, goal }: { entry: any; goal: any }) {
  const ratio = Math.min(1, entry.amount / goal.targetAmount);
  return (
    <View style={styles.entryRow}>
      <View style={[styles.entryColorDot, { backgroundColor: goal.color }]} />
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryName}>{goal.name}</Text>
          {entry.completed && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          )}
        </View>
        <ProgressBar progress={ratio} color={goal.color} height={6} />
        <Text style={styles.entryAmount}>
          {entry.amount} / {goal.targetAmount} {goal.unit}
          {entry.notes ? ` · ${entry.notes}` : ''}
        </Text>
      </View>
    </View>
  );
}

// Minimal web fallback calendar
function WebCalendar({
  markedDates,
  selectedDate,
  onSelectDate,
}: {
  markedDates: Record<string, any>;
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      format(new Date(year, month, i + 1), 'yyyy-MM-dd')
    ),
  ];

  return (
    <View style={webCal.container}>
      <View style={webCal.nav}>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month - 1, 1))}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={webCal.monthLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(year, month + 1, 1))}>
          <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={webCal.dayNames}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <Text key={d} style={webCal.dayName}>{d}</Text>
        ))}
      </View>
      <View style={webCal.grid}>
        {cells.map((dateStr, i) => {
          if (!dateStr) return <View key={i} style={webCal.cell} />;
          const mark = markedDates[dateStr];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const hasActivity = !!mark;
          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                webCal.cell,
                isToday && webCal.today,
                isSelected && webCal.selected,
              ]}
              onPress={() => onSelectDate(dateStr)}
            >
              <Text style={[webCal.cellText, isSelected && webCal.selectedText, isToday && !isSelected && webCal.todayText]}>
                {parseInt(dateStr.split('-')[2], 10)}
              </Text>
              {hasActivity && (
                <View style={webCal.dotsRow}>
                  {(mark.dots ?? []).slice(0, 3).map((dot: any, j: number) => (
                    <View key={j} style={[webCal.dot, { backgroundColor: dot.color }]} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: Colors.background,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  dayDetail: {
    backgroundColor: Colors.surface,
    margin: 12,
    borderRadius: 12,
    padding: 16,
  },
  dayDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  noActivity: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  entryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  entryAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  dateGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dateGroupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

const webCal = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: 12,
    margin: 12,
    borderRadius: 12,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dayNames: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  cellText: {
    fontSize: 14,
    color: Colors.text,
  },
  today: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  selected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  selectedText: {
    color: Colors.white,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
