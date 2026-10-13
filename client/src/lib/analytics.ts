import type { Habit, HabitLog, HabitBreakdown, StreakStats } from '../types';

function getPreviousDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getNextDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calculates completion rate percentage according to Spec 4.3:
 * Completion Rate = (Completed Habit Logs / (habits * Days in Interval)) * 100
 */
export function calculateCompletionRate(
  completedCount: number,
  habitCount: number,
  totalDays: number
): number {
  const denominator = habitCount * totalDays;
  if (denominator <= 0) return 0;
  const rate = (completedCount / denominator) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * Calculates raw quality score (1.0 to 4.0) and percentage (0 to 100%)
 */
export function calculateQualityScore(logs: HabitLog[]): { rawScore: number; percentage: number } {
  const rated = logs.filter((l) => l.completed && l.quality !== null && l.quality !== undefined && l.quality > 0);
  if (rated.length === 0) {
    return { rawScore: 0, percentage: 0 };
  }
  const sum = rated.reduce((acc, l) => acc + (l.quality ?? 0), 0);
  const rawScore = Math.round((sum / rated.length) * 10) / 10;
  const percentage = Math.round((rawScore / 4) * 100);
  return { rawScore, percentage };
}

/**
 * Calculates current and longest consecutive streak for an individual habit.
 */
export function calculateHabitStreak(
  habitId: string,
  logsMap: Record<string, HabitLog>,
  referenceDate?: string
): { current: number; longest: number } {
  const today = referenceDate ?? getTodayString();
  const yesterday = getPreviousDateString(today);

  let current = 0;
  const todayCompleted = logsMap[`${habitId}_${today}`]?.completed === true;
  const yesterdayCompleted = logsMap[`${habitId}_${yesterday}`]?.completed === true;

  let checkDate = todayCompleted ? today : yesterdayCompleted ? yesterday : '';

  while (checkDate) {
    if (logsMap[`${habitId}_${checkDate}`]?.completed === true) {
      current++;
      checkDate = getPreviousDateString(checkDate);
    } else {
      break;
    }
  }

  const completedDates = Object.values(logsMap)
    .filter((log) => log.habitId === habitId && log.completed)
    .map((log) => log.date)
    .sort();

  const uniqueDates = Array.from(new Set(completedDates));
  let longest = 0;
  let currentRun = 0;
  let lastDate: string | null = null;

  for (const date of uniqueDates) {
    if (!lastDate || date === getNextDateString(lastDate)) {
      currentRun = !lastDate ? 1 : currentRun + 1;
    } else {
      currentRun = 1;
    }
    lastDate = date;
    if (currentRun > longest) longest = currentRun;
  }

  return { current, longest: Math.max(longest, current) };
}

/**
 * Calculates consecutive days where ALL habits were completed.
 */
export function calculatePerfectDayStreak(
  habits: Habit[],
  logsMap: Record<string, HabitLog>,
  referenceDate?: string
): { current: number; longest: number } {
  const activeHabits = habits.filter((h) => !h.archived);
  if (activeHabits.length === 0) return { current: 0, longest: 0 };

  const isPerfect = (date: string) =>
    activeHabits.every((h) => logsMap[`${h._id}_${date}`]?.completed === true);

  const today = referenceDate ?? getTodayString();
  const yesterday = getPreviousDateString(today);

  let current = 0;
  let checkDate = isPerfect(today) ? today : isPerfect(yesterday) ? yesterday : '';

  while (checkDate) {
    if (isPerfect(checkDate)) {
      current++;
      checkDate = getPreviousDateString(checkDate);
    } else {
      break;
    }
  }

  // Scan unique dates in logs
  const dates = Array.from(new Set(Object.values(logsMap).map((l) => l.date))).sort();
  let longest = 0;
  let currentRun = 0;
  let lastDate: string | null = null;

  for (const date of dates) {
    if (isPerfect(date)) {
      if (!lastDate || date === getNextDateString(lastDate)) {
        currentRun = !lastDate ? 1 : currentRun + 1;
      } else {
        currentRun = 1;
      }
      lastDate = date;
      if (currentRun > longest) longest = currentRun;
    } else {
      currentRun = 0;
      lastDate = null;
    }
  }

  return { current, longest: Math.max(longest, current) };
}

/**
 * Aggregates complete streak statistics.
 */
export function calculateStreakStats(
  habits: Habit[],
  logsMap: Record<string, HabitLog>
): StreakStats {
  const perfect = calculatePerfectDayStreak(habits, logsMap);
  const habitStreaks: Record<string, { current: number; longest: number }> = {};

  for (const habit of habits) {
    habitStreaks[habit._id] = calculateHabitStreak(habit._id, logsMap);
  }

  return {
    currentPerfectStreak: perfect.current,
    longestPerfectStreak: perfect.longest,
    habitStreaks,
  };
}

/**
 * Aggregates habit breakdown stats over a given date range.
 */
export function calculateHabitBreakdowns(
  habits: Habit[],
  logsMap: Record<string, HabitLog>,
  dates: string[]
): HabitBreakdown[] {
  const totalDays = dates.length;
  return habits.map((habit) => {
    let completedDays = 0;
    const qualities: number[] = [];

    for (const date of dates) {
      const log = logsMap[`${habit._id}_${date}`];
      if (log?.completed) {
        completedDays++;
        if (log.quality) qualities.push(log.quality);
      }
    }

    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 1000) / 10 : 0;
    const averageQuality =
      qualities.length > 0
        ? Math.round((qualities.reduce((a, b) => a + b, 0) / qualities.length) * 10) / 10
        : null;

    return {
      habitId: habit._id,
      name: habit.name,
      color: habit.color,
      completedDays,
      totalDays,
      completionRate,
      averageQuality,
    };
  });
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  completionRate: number;
  completedCount: number;
  qualityScore: number | null;
}

/**
 * Formats daily trend timeline data for Recharts visualization.
 */
export function generateDailyTrendData(
  habits: Habit[],
  logsMap: Record<string, HabitLog>,
  dates: string[]
): DailyTrendPoint[] {
  const activeHabits = habits.filter((h) => !h.archived);
  const habitCount = activeHabits.length;

  return dates.map((date) => {
    let completedCount = 0;
    const qualities: number[] = [];

    for (const habit of activeHabits) {
      const log = logsMap[`${habit._id}_${date}`];
      if (log?.completed) {
        completedCount++;
        if (log.quality) qualities.push(log.quality);
      }
    }

    const completionRate = habitCount > 0 ? Math.round((completedCount / habitCount) * 100) : 0;
    const qualityScore =
      qualities.length > 0
        ? Math.round((qualities.reduce((a, b) => a + b, 0) / qualities.length) * 10) / 10
        : null;

    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12);
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      date,
      label,
      completionRate,
      completedCount,
      qualityScore,
    };
  });
}
