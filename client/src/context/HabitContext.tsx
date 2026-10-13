import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import confetti from 'canvas-confetti';
import type { Habit, HabitLog, HabitQuality, MonthlyReflection } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import {
  getCachedHabits,
  saveCachedHabits,
  getCachedLogsForRange,
  saveCachedLogs,
  upsertCachedLog,
  getSyncQueue,
  enqueueSyncItem,
  removeSyncedItems,
  getCachedReflection,
  saveCachedReflection,
} from '../lib/storage';

// Date utility functions co-located to maintain single-file self-containment
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseDate(dateInput: Date | string): Date {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 12, 0, 0);
  }
  const [yearStr, monthStr, dayStr] = dateInput.split('-');
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10) - 1;
  const day = Number.parseInt(dayStr, 10);
  return new Date(year, month, day, 12, 0, 0);
}

function getTodayString(): string {
  return formatDate(new Date());
}

function getCurrentMonthKey(): string {
  return formatMonthKey(new Date());
}

function getMonday(dateInput: Date | string): Date {
  const date = parseDate(dateInput);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

function getWeekDays(baseDate: Date | string): Date[] {
  const monday = getMonday(baseDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

function getWeekRange(baseDate: Date | string): {
  startDate: string;
  endDate: string;
  dates: string[];
  days: Date[];
} {
  const days = getWeekDays(baseDate);
  const dates = days.map(formatDate);
  return {
    startDate: dates[0],
    endDate: dates[6],
    dates,
    days,
  };
}

function addWeeks(baseDate: Date | string, weeks: number): Date {
  const date = parseDate(baseDate);
  date.setDate(date.getDate() + weeks * 7);
  return date;
}

export interface HabitContextType {
  habits: Habit[];
  logs: Record<string, HabitLog>;
  loading: boolean;
  syncing: boolean;
  currentWeekDate: Date;
  selectedMonth: string;
  getLog: (habitId: string, date: string) => HabitLog | undefined;
  toggleHabit: (habitId: string, date: string) => Promise<void>;
  updateLogQuality: (habitId: string, date: string, quality: HabitQuality | null) => Promise<void>;
  updateLogNote: (habitId: string, date: string, note: string) => Promise<void>;
  syncPendingLogs: () => Promise<void>;
  refreshHabits: () => Promise<void>;
  loadWeekLogs: (startDate: string, endDate: string) => Promise<void>;
  setCurrentWeekDate: (date: Date) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  setSelectedMonth: (month: string) => void;
  getMonthlyReflection: (monthKey: string) => Promise<MonthlyReflection | undefined>;
  saveMonthlyReflection: (
    monthKey: string,
    reflectionText: string,
    goalsNextMonth: string
  ) => Promise<void>;
}

export const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncPendingLogs = useCallback(async (): Promise<void> => {
    if (!user || !navigator.onLine) return;
    try {
      setSyncing(true);
      const queue = await getSyncQueue(user.uid);
      if (queue.length === 0) return;

      await api.batchSyncLogs(queue);
      await removeSyncedItems(user.uid, queue);
    } catch (error) {
      console.error('Failed to sync pending log mutations:', error);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      void syncPendingLogs();
    }, 600);
  }, [syncPendingLogs]);

  const refreshHabits = useCallback(async (): Promise<void> => {
    if (!user) return;
    const cached = await getCachedHabits(user.uid);
    if (cached.length > 0) {
      setHabits(cached);
    }

    if (navigator.onLine) {
      try {
        const res = await api.getHabits();
        if (res.habits) {
          setHabits(res.habits);
          await saveCachedHabits(user.uid, res.habits);
        }
      } catch (error) {
        console.error('Failed to fetch habits from server:', error);
      }
    }
  }, [user]);

  const loadWeekLogs = useCallback(
    async (startDate: string, endDate: string): Promise<void> => {
      if (!user) return;
      const cachedRange = await getCachedLogsForRange(user.uid, startDate, endDate);
      if (cachedRange.length > 0) {
        setLogs((prev) => {
          const next = { ...prev };
          for (const log of cachedRange) {
            next[`${log.habitId}_${log.date}`] = log;
          }
          return next;
        });
      }

      if (navigator.onLine) {
        try {
          const res = await api.getLogsRange(startDate, endDate);
          if (res.logs) {
            setLogs((prev) => {
              const next = { ...prev };
              for (const log of res.logs) {
                next[`${log.habitId}_${log.date}`] = log;
              }
              return next;
            });
            await saveCachedLogs(user.uid, res.logs);
          }
        } catch (error) {
          console.error('Failed to fetch range logs from server:', error);
        }
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLogs({});
      setLoading(false);
      return;
    }

    setLoading(true);
    void refreshHabits().finally(() => setLoading(false));
    void syncPendingLogs();
  }, [user, refreshHabits, syncPendingLogs]);

  useEffect(() => {
    if (!user) return;
    const { startDate, endDate } = getWeekRange(currentWeekDate);
    void loadWeekLogs(startDate, endDate);
  }, [user, currentWeekDate, loadWeekLogs]);

  useEffect(() => {
    const handleOnline = () => {
      void syncPendingLogs();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncPendingLogs]);

  const getLog = useCallback(
    (habitId: string, date: string): HabitLog | undefined => {
      return logs[`${habitId}_${date}`];
    },
    [logs]
  );

  const checkCelebration = useCallback(
    (habitId: string, date: string, nextCompleted: boolean) => {
      const today = getTodayString();
      if (date !== today || !nextCompleted) return;

      const activeHabits = habits.filter((h) => !h.archived);
      if (activeHabits.length === 0) return;

      const allOthersDone = activeHabits
        .filter((h) => h._id !== habitId)
        .every((h) => logs[`${h._id}_${today}`]?.completed === true);

      if (allOthersDone) {
        try {
          void confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore canvas-confetti error in unsupported contexts
        }
      }
    },
    [habits, logs]
  );

  const toggleHabit = useCallback(
    async (habitId: string, date: string): Promise<void> => {
      if (!user) return;
      const key = `${habitId}_${date}`;
      const existing = logs[key];
      const nextCompleted = existing ? !existing.completed : true;

      const updatedLog: HabitLog = {
        userId: user.uid,
        habitId,
        date,
        completed: nextCompleted,
        quality: existing?.quality ?? null,
        note: existing?.note ?? '',
        _id: existing?._id,
        updatedAt: new Date().toISOString(),
      };

      setLogs((prev) => ({ ...prev, [key]: updatedLog }));
      await upsertCachedLog(user.uid, updatedLog);
      checkCelebration(habitId, date, nextCompleted);

      await enqueueSyncItem(user.uid, {
        habitId,
        date,
        completed: nextCompleted,
        quality: updatedLog.quality,
        note: updatedLog.note,
      });

      scheduleSync();
    },
    [user, logs, checkCelebration, scheduleSync]
  );

  const updateLogQuality = useCallback(
    async (
      habitId: string,
      date: string,
      quality: HabitQuality | null
    ): Promise<void> => {
      if (!user) return;
      const key = `${habitId}_${date}`;
      const existing = logs[key];

      const updatedLog: HabitLog = {
        userId: user.uid,
        habitId,
        date,
        completed: existing ? existing.completed : true,
        quality,
        note: existing?.note ?? '',
        _id: existing?._id,
        updatedAt: new Date().toISOString(),
      };

      setLogs((prev) => ({ ...prev, [key]: updatedLog }));
      await upsertCachedLog(user.uid, updatedLog);

      await enqueueSyncItem(user.uid, {
        habitId,
        date,
        completed: updatedLog.completed,
        quality,
        note: updatedLog.note,
      });

      scheduleSync();
    },
    [user, logs, scheduleSync]
  );

  const updateLogNote = useCallback(
    async (habitId: string, date: string, note: string): Promise<void> => {
      if (!user) return;
      const key = `${habitId}_${date}`;
      const existing = logs[key];

      const updatedLog: HabitLog = {
        userId: user.uid,
        habitId,
        date,
        completed: existing ? existing.completed : true,
        quality: existing?.quality ?? null,
        note,
        _id: existing?._id,
        updatedAt: new Date().toISOString(),
      };

      setLogs((prev) => ({ ...prev, [key]: updatedLog }));
      await upsertCachedLog(user.uid, updatedLog);

      await enqueueSyncItem(user.uid, {
        habitId,
        date,
        completed: updatedLog.completed,
        quality: updatedLog.quality,
        note,
      });

      scheduleSync();
    },
    [user, logs, scheduleSync]
  );

  const goToPreviousWeek = useCallback(() => setCurrentWeekDate((prev) => addWeeks(prev, -1)), []);
  const goToNextWeek = useCallback(() => setCurrentWeekDate((prev) => addWeeks(prev, 1)), []);
  const goToCurrentWeek = useCallback(() => setCurrentWeekDate(new Date()), []);

  const getMonthlyReflection = useCallback(
    async (monthKey: string): Promise<MonthlyReflection | undefined> => {
      if (!user) return undefined;
      return getCachedReflection(user.uid, monthKey);
    },
    [user]
  );

  const saveMonthlyReflection = useCallback(
    async (
      monthKey: string,
      reflectionText: string,
      goalsNextMonth: string
    ): Promise<void> => {
      if (!user) return;
      const reflection: MonthlyReflection = {
        userId: user.uid,
        monthKey,
        reflectionText,
        goalsNextMonth,
        updatedAt: new Date().toISOString(),
      };
      await saveCachedReflection(user.uid, reflection);

      if (navigator.onLine) {
        try {
          await api.saveReflection({ monthKey, reflectionText, goalsNextMonth });
        } catch (error) {
          console.error('Failed to sync monthly reflection:', error);
        }
      }
    },
    [user]
  );

  const value = useMemo<HabitContextType>(
    () => ({
      habits,
      logs,
      loading,
      syncing,
      currentWeekDate,
      selectedMonth,
      getLog,
      toggleHabit,
      updateLogQuality,
      updateLogNote,
      syncPendingLogs,
      refreshHabits,
      loadWeekLogs,
      setCurrentWeekDate,
      goToPreviousWeek,
      goToNextWeek,
      goToCurrentWeek,
      setSelectedMonth,
      getMonthlyReflection,
      saveMonthlyReflection,
    }),
    [
      habits,
      logs,
      loading,
      syncing,
      currentWeekDate,
      selectedMonth,
      getLog,
      toggleHabit,
      updateLogQuality,
      updateLogNote,
      syncPendingLogs,
      refreshHabits,
      loadWeekLogs,
      goToPreviousWeek,
      goToNextWeek,
      goToCurrentWeek,
      getMonthlyReflection,
      saveMonthlyReflection,
    ]
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabits(): HabitContextType {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
}
