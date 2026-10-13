import type { Request, Response } from 'express';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { Reflection } from '../models/Reflection.js';

const MONTH_REGEX = /^\d{4}-\d{2}$/;

function getParamString(param: string | string[] | undefined): string | null {
  if (Array.isArray(param)) return param[0] || null;
  return typeof param === 'string' ? param : null;
}

function getPreviousDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calculates current and longest streak for an individual habit.
 */
function calculateHabitStreak(
  habitId: string,
  logsMap: Record<string, { completed: boolean; date: string }>,
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
    .filter((log) => log.completed && logsMap[`${habitId}_${log.date}`]?.completed)
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
 * Calculates consecutive days where all active habits were completed.
 */
function calculatePerfectDayStreak(
  activeHabitIds: string[],
  logsMap: Record<string, { completed: boolean; date: string }>,
  referenceDate?: string
): { current: number; longest: number } {
  if (activeHabitIds.length === 0) return { current: 0, longest: 0 };

  const isPerfect = (date: string) =>
    activeHabitIds.every((hId) => logsMap[`${hId}_${date}`]?.completed === true);

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

  const allDates = Array.from(new Set(Object.values(logsMap).map((l) => l.date))).sort();
  let longest = 0;
  let currentRun = 0;
  let lastDate: string | null = null;

  for (const date of allDates) {
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
 * GET /api/reports/monthly?month=YYYY-MM
 * Produces aggregated monthly completion rates, quality scores, habit breakdowns, and streaks.
 */
export async function getMonthlyReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const month = typeof req.query.month === 'string' ? req.query.month : '';
    if (!MONTH_REGEX.test(month)) {
      res.status(400).json({ error: 'Invalid month parameter. Format must be YYYY-MM.' });
      return;
    }

    const [yearStr, monthStr] = month.split('-');
    const year = Number.parseInt(yearStr, 10);
    const monthNum = Number.parseInt(monthStr, 10);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const startDate = `${month}-01`;
    const endDate = `${month}-${String(daysInMonth).padStart(2, '0')}`;

    const habits = await Habit.find({ userId, archived: false }).sort({ order: 1 }).lean();
    const habitIds = habits.map((h) => h._id.toString());

    // Fetch month logs for breakdowns and all historical completed logs for true streak tracking
    const [monthLogs, allLogs] = await Promise.all([
      HabitLog.find({ userId, date: { $gte: startDate, $lte: endDate } }).lean(),
      HabitLog.find({ userId, completed: true }).lean(),
    ]);

    const allLogsMap: Record<string, { completed: boolean; date: string }> = {};
    for (const log of allLogs) {
      allLogsMap[`${log.habitId.toString()}_${log.date}`] = {
        completed: log.completed,
        date: log.date,
      };
    }

    const habitBreakdowns = habits.map((habit) => {
      const hId = habit._id.toString();
      const habitLogs = monthLogs.filter((l) => l.habitId.toString() === hId);
      const completedDays = habitLogs.filter((l) => l.completed).length;
      const completionRate =
        daysInMonth > 0 ? Math.round((completedDays / daysInMonth) * 1000) / 10 : 0;

      const ratedLogs = habitLogs.filter(
        (l) => l.completed && typeof l.quality === 'number' && l.quality > 0
      );
      const averageQuality =
        ratedLogs.length > 0
          ? Math.round(
              (ratedLogs.reduce((acc, l) => acc + (l.quality ?? 0), 0) / ratedLogs.length) * 10
            ) / 10
          : null;

      return {
        habitId: hId,
        name: habit.name,
        color: habit.color,
        completedDays,
        totalDays: daysInMonth,
        completionRate,
        averageQuality,
      };
    });

    const totalCompleted = monthLogs.filter((l) => l.completed).length;
    const habitCount = habits.length > 0 ? habits.length : 6;
    const totalPossible = habitCount * daysInMonth;
    const completionRate =
      totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 1000) / 10 : 0;

    const ratedLogsOverall = monthLogs.filter(
      (l) => l.completed && typeof l.quality === 'number' && l.quality > 0
    );
    const qualityScore =
      ratedLogsOverall.length > 0
        ? Math.round(
            (ratedLogsOverall.reduce((acc, l) => acc + (l.quality ?? 0), 0) /
              ratedLogsOverall.length) *
              10
          ) / 10
        : 0;

    const perfectStreak = calculatePerfectDayStreak(habitIds, allLogsMap);
    const habitStreaks: Record<string, { current: number; longest: number }> = {};
    for (const hId of habitIds) {
      habitStreaks[hId] = calculateHabitStreak(hId, allLogsMap);
    }

    const streakStats = {
      currentPerfectStreak: perfectStreak.current,
      longestPerfectStreak: perfectStreak.longest,
      habitStreaks,
    };

    res.status(200).json({
      completionRate,
      qualityScore,
      habitBreakdowns,
      streakStats,
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Internal server error while generating monthly report.' });
  }
}

/**
 * POST /api/reports/reflections
 * Upserts monthly reflection notes and commitments.
 */
export async function saveReflection(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const { monthKey, reflectionText, goalsNextMonth } = req.body;

    if (typeof monthKey !== 'string' || !MONTH_REGEX.test(monthKey)) {
      res.status(400).json({ error: 'monthKey is required in YYYY-MM format.' });
      return;
    }

    const reflection = await Reflection.findOneAndUpdate(
      { userId, monthKey },
      {
        $set: {
          userId,
          monthKey,
          reflectionText: typeof reflectionText === 'string' ? reflectionText.trim() : '',
          goalsNextMonth: typeof goalsNextMonth === 'string' ? goalsNextMonth.trim() : '',
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      reflection,
    });
  } catch (error) {
    console.error('Error saving reflection:', error);
    res.status(500).json({ error: 'Internal server error while saving reflection.' });
  }
}

/**
 * GET /api/reports/reflections
 * GET /api/reports/reflections/:monthKey
 * Retrieves stored reflection for a specified month.
 */
export async function getReflection(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const monthKey =
      getParamString(req.params.monthKey) ||
      (typeof req.query.monthKey === 'string' ? req.query.monthKey : null);

    if (!monthKey || !MONTH_REGEX.test(monthKey)) {
      res.status(400).json({ error: 'monthKey parameter required in YYYY-MM format.' });
      return;
    }

    const reflection = await Reflection.findOne({ userId, monthKey }).lean();

    res.status(200).json({
      success: true,
      reflection: reflection ?? null,
    });
  } catch (error) {
    console.error('Error fetching reflection:', error);
    res.status(500).json({ error: 'Internal server error while fetching reflection.' });
  }
}
