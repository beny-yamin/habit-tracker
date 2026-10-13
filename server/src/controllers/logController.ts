import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { HabitLog, type HabitQuality } from '../models/HabitLog.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Interface representing incoming batch log entry
 */
interface IncomingLogItem {
  habitId: string;
  date: string;
  completed: boolean;
  quality?: HabitQuality | null;
  note?: string;
}

/**
 * GET /api/logs/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Retrieves all habit logs for the user within a date range inclusive.
 */
export async function getLogsRange(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const { startDate, endDate } = req.query;

    if (
      typeof startDate !== 'string' ||
      !DATE_REGEX.test(startDate) ||
      typeof endDate !== 'string' ||
      !DATE_REGEX.test(endDate)
    ) {
      res.status(400).json({
        error: 'Invalid date parameters. Both startDate and endDate must be in YYYY-MM-DD format.',
      });
      return;
    }

    const logs = await HabitLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    res.status(200).json({ logs });
  } catch (error) {
    console.error('Error fetching logs in range:', error);
    res.status(500).json({ error: 'Internal server error while fetching logs.' });
  }
}

/**
 * POST /api/logs/batch
 * Executes atomic MongoDB bulkWrite with updateOne and { upsert: true }
 * keyed on { userId, habitId, date } to guarantee idempotent mutations.
 */
export async function batchSyncLogs(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const { logs } = req.body as { logs?: IncomingLogItem[] };

    if (!Array.isArray(logs)) {
      res.status(400).json({ error: 'Invalid payload: logs array required.' });
      return;
    }

    if (logs.length === 0) {
      res.status(200).json({ success: true, processedCount: 0 });
      return;
    }

    const validOps = logs
      .filter(
        (item) =>
          item &&
          typeof item.habitId === 'string' &&
          Types.ObjectId.isValid(item.habitId) &&
          typeof item.date === 'string' &&
          DATE_REGEX.test(item.date)
      )
      .map((item) => {
        const qualityVal =
          item.quality === 1 || item.quality === 2 || item.quality === 3 || item.quality === 4
            ? item.quality
            : null;

        const noteVal = typeof item.note === 'string' ? item.note.trim().slice(0, 280) : '';

        return {
          updateOne: {
            filter: {
              userId,
              habitId: new Types.ObjectId(item.habitId),
              date: item.date,
            },
            update: {
              $set: {
                userId,
                habitId: new Types.ObjectId(item.habitId),
                date: item.date,
                completed: Boolean(item.completed),
                quality: qualityVal,
                note: noteVal,
              },
            },
            upsert: true,
          },
        };
      });

    if (validOps.length > 0) {
      await HabitLog.bulkWrite(validOps);
    }

    res.status(200).json({
      success: true,
      processedCount: validOps.length,
    });
  } catch (error) {
    console.error('Error processing batch logs:', error);
    res.status(500).json({ error: 'Internal server error while processing batch logs.' });
  }
}

/**
 * POST /api/logs
 * Upserts a single habit log record idempotently.
 */
export async function upsertLog(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const { habitId, date, completed, quality, note } = req.body;

    if (!habitId || !Types.ObjectId.isValid(habitId)) {
      res.status(400).json({ error: 'Invalid or missing habitId.' });
      return;
    }

    if (typeof date !== 'string' || !DATE_REGEX.test(date)) {
      res.status(400).json({ error: 'Date must be formatted as YYYY-MM-DD.' });
      return;
    }

    const qualityVal =
      quality === 1 || quality === 2 || quality === 3 || quality === 4 ? quality : null;

    const noteVal = typeof note === 'string' ? note.trim().slice(0, 280) : '';

    const log = await HabitLog.findOneAndUpdate(
      {
        userId,
        habitId: new Types.ObjectId(habitId),
        date,
      },
      {
        $set: {
          userId,
          habitId: new Types.ObjectId(habitId),
          date,
          completed: Boolean(completed),
          quality: qualityVal,
          note: noteVal,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({ success: true, log });
  } catch (error) {
    console.error('Error upserting habit log:', error);
    res.status(500).json({ error: 'Internal server error while saving log.' });
  }
}

/**
 * GET /api/logs/analytics
 * Computes aggregated completion statistics and quality rating analytics.
 */
export async function getLogAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const { startDate, endDate } = req.query;

    const queryFilter: Record<string, unknown> = { userId };
    if (typeof startDate === 'string' && DATE_REGEX.test(startDate)) {
      queryFilter.date = {
        ...(typeof queryFilter.date === 'object' ? (queryFilter.date as object) : {}),
        $gte: startDate,
      };
    }
    if (typeof endDate === 'string' && DATE_REGEX.test(endDate)) {
      queryFilter.date = {
        ...(typeof queryFilter.date === 'object' ? (queryFilter.date as object) : {}),
        $lte: endDate,
      };
    }

    const logs = await HabitLog.find(queryFilter).lean();

    let totalCompleted = 0;
    let totalQualitySum = 0;
    let ratedCount = 0;
    const qualityDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const log of logs) {
      if (log.completed) {
        totalCompleted += 1;
        if (log.quality !== null && log.quality !== undefined && log.quality >= 1 && log.quality <= 4) {
          totalQualitySum += log.quality;
          ratedCount += 1;
          qualityDistribution[log.quality] = (qualityDistribution[log.quality] || 0) + 1;
        }
      }
    }

    const rawQualityScore = ratedCount > 0 ? Number((totalQualitySum / ratedCount).toFixed(2)) : 0;
    const qualityPercentage = Number(((rawQualityScore / 4) * 100).toFixed(1));

    res.status(200).json({
      success: true,
      analytics: {
        totalLogs: logs.length,
        totalCompleted,
        ratedCount,
        rawQualityScore,
        qualityPercentage,
        qualityDistribution,
      },
    });
  } catch (error) {
    console.error('Error calculating log analytics:', error);
    res.status(500).json({ error: 'Internal server error while generating analytics.' });
  }
}
