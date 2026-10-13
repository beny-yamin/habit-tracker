import { get, set, del } from 'idb-keyval';
import type { Habit, HabitLog, MonthlyReflection, BatchLogItem } from '../types';

const HABITS_KEY_PREFIX = 'habits:';
const LOGS_KEY_PREFIX = 'logs:';
const SYNC_QUEUE_KEY_PREFIX = 'sync_queue:';
const REFLECTIONS_KEY_PREFIX = 'reflections:';

/**
 * Retrieves cached habits for the given user.
 */
export async function getCachedHabits(userId: string): Promise<Habit[]> {
  try {
    const habits = await get<Habit[]>(`${HABITS_KEY_PREFIX}${userId}`);
    return habits ?? [];
  } catch (error) {
    console.error('Failed to get cached habits from IndexedDB:', error);
    return [];
  }
}

/**
 * Saves habits to IndexedDB cache for the given user.
 */
export async function saveCachedHabits(userId: string, habits: Habit[]): Promise<void> {
  try {
    await set(`${HABITS_KEY_PREFIX}${userId}`, habits);
  } catch (error) {
    console.error('Failed to save habits to IndexedDB cache:', error);
  }
}

/**
 * Retrieves the full map of cached logs for the given user.
 * Keys in the map are formatted as `${habitId}_${date}`.
 */
export async function getCachedLogsMap(userId: string): Promise<Record<string, HabitLog>> {
  try {
    const logsMap = await get<Record<string, HabitLog>>(`${LOGS_KEY_PREFIX}${userId}`);
    return logsMap ?? {};
  } catch (error) {
    console.error('Failed to get cached logs map from IndexedDB:', error);
    return {};
  }
}

/**
 * Retrieves all cached logs as a flat array for the given user.
 */
export async function getCachedLogs(userId: string): Promise<HabitLog[]> {
  const map = await getCachedLogsMap(userId);
  return Object.values(map);
}

/**
 * Retrieves cached logs within a specific date range [startDate, endDate] inclusive.
 */
export async function getCachedLogsForRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<HabitLog[]> {
  const map = await getCachedLogsMap(userId);
  return Object.values(map).filter((log) => log.date >= startDate && log.date <= endDate);
}

/**
 * Merges an array of logs into the user's cached log store.
 */
export async function saveCachedLogs(userId: string, logs: HabitLog[]): Promise<void> {
  try {
    const currentMap = await getCachedLogsMap(userId);
    for (const log of logs) {
      currentMap[`${log.habitId}_${log.date}`] = log;
    }
    await set(`${LOGS_KEY_PREFIX}${userId}`, currentMap);
  } catch (error) {
    console.error('Failed to save logs to IndexedDB cache:', error);
  }
}

/**
 * Fast upsert for a single habit log into IndexedDB (zero-latency contract).
 */
export async function upsertCachedLog(userId: string, log: HabitLog): Promise<void> {
  try {
    const currentMap = await getCachedLogsMap(userId);
    currentMap[`${log.habitId}_${log.date}`] = log;
    await set(`${LOGS_KEY_PREFIX}${userId}`, currentMap);
  } catch (error) {
    console.error('Failed to upsert log into IndexedDB cache:', error);
  }
}

/**
 * Retrieves the pending offline/background sync queue for mutations.
 */
export async function getSyncQueue(userId: string): Promise<BatchLogItem[]> {
  try {
    const queue = await get<BatchLogItem[]>(`${SYNC_QUEUE_KEY_PREFIX}${userId}`);
    return queue ?? [];
  } catch (error) {
    console.error('Failed to get sync queue from IndexedDB:', error);
    return [];
  }
}

/**
 * Enqueues a log mutation into the sync queue, deduplicating by habitId and date.
 */
export async function enqueueSyncItem(userId: string, item: BatchLogItem): Promise<void> {
  try {
    const queue = await getSyncQueue(userId);
    const existingIndex = queue.findIndex(
      (q) => q.habitId === item.habitId && q.date === item.date
    );

    if (existingIndex >= 0) {
      queue[existingIndex] = item;
    } else {
      queue.push(item);
    }

    await set(`${SYNC_QUEUE_KEY_PREFIX}${userId}`, queue);
  } catch (error) {
    console.error('Failed to enqueue sync item into IndexedDB:', error);
  }
}

/**
 * Removes successfully synced items from the sync queue.
 */
export async function removeSyncedItems(
  userId: string,
  syncedItems: BatchLogItem[]
): Promise<void> {
  try {
    const queue = await getSyncQueue(userId);
    const remaining = queue.filter(
      (q) => !syncedItems.some((s) => s.habitId === q.habitId && s.date === q.date)
    );
    await set(`${SYNC_QUEUE_KEY_PREFIX}${userId}`, remaining);
  } catch (error) {
    console.error('Failed to remove synced items from sync queue:', error);
  }
}

/**
 * Clears the entire sync queue for the user.
 */
export async function clearSyncQueue(userId: string): Promise<void> {
  try {
    await del(`${SYNC_QUEUE_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Failed to clear sync queue in IndexedDB:', error);
  }
}

/**
 * Retrieves a cached monthly reflection for a given monthKey ("YYYY-MM").
 */
export async function getCachedReflection(
  userId: string,
  monthKey: string
): Promise<MonthlyReflection | undefined> {
  try {
    const map = await get<Record<string, MonthlyReflection>>(`${REFLECTIONS_KEY_PREFIX}${userId}`);
    return map ? map[monthKey] : undefined;
  } catch (error) {
    console.error('Failed to get cached reflection from IndexedDB:', error);
    return undefined;
  }
}

/**
 * Saves a monthly reflection to IndexedDB cache.
 */
export async function saveCachedReflection(
  userId: string,
  reflection: MonthlyReflection
): Promise<void> {
  try {
    const map = (await get<Record<string, MonthlyReflection>>(`${REFLECTIONS_KEY_PREFIX}${userId}`)) ?? {};
    map[reflection.monthKey] = reflection;
    await set(`${REFLECTIONS_KEY_PREFIX}${userId}`, map);
  } catch (error) {
    console.error('Failed to save reflection to IndexedDB cache:', error);
  }
}

/**
 * Clears all cached data for a user upon sign-out or account reset.
 */
export async function clearUserStorage(userId: string): Promise<void> {
  try {
    await Promise.all([
      del(`${HABITS_KEY_PREFIX}${userId}`),
      del(`${LOGS_KEY_PREFIX}${userId}`),
      del(`${SYNC_QUEUE_KEY_PREFIX}${userId}`),
      del(`${REFLECTIONS_KEY_PREFIX}${userId}`),
    ]);
  } catch (error) {
    console.error('Failed to clear user storage in IndexedDB:', error);
  }
}
