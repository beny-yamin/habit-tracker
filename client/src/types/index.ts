import type { User } from 'firebase/auth';

/**
 * Quality rating scale for completed habits:
 * 1 = Poor, 2 = Fair, 3 = Good, 4 = Excellent
 */
export type HabitQuality = 1 | 2 | 3 | 4;

/**
 * Habit entity interface matching Mongoose Habit schema
 */
export interface Habit {
  _id: string;
  userId: string;
  name: string;
  color: string;
  order: number;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Daily log record for a habit
 */
export interface HabitLog {
  _id?: string;
  userId: string;
  habitId: string;
  date: string; // Format: "YYYY-MM-DD"
  completed: boolean;
  quality: HabitQuality | null;
  note: string; // Max 280 characters
  createdAt?: string;
  updatedAt?: string;
  synced?: boolean;
}

/**
 * Monthly reflection entry
 */
export interface MonthlyReflection {
  _id?: string;
  userId: string;
  monthKey: string; // Format: "YYYY-MM"
  reflectionText: string;
  goalsNextMonth: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Auth user interface representation
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Application authentication state
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error?: string | null;
}

/**
 * React Auth Context contract
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

/**
 * Individual item in an offline queue or batch log sync payload
 */
export interface BatchLogItem {
  habitId: string;
  date: string; // "YYYY-MM-DD"
  completed: boolean;
  quality?: HabitQuality | null;
  note?: string;
}

/**
 * Batch payload for POST /api/logs/batch
 */
export interface BatchLogPayload {
  logs: BatchLogItem[];
}

/**
 * Batch response from POST /api/logs/batch
 */
export interface BatchLogResponse {
  success: boolean;
  processedCount: number;
}

/**
 * Response for GET /api/habits
 */
export interface HabitsResponse {
  habits: Habit[];
}

/**
 * Response for GET /api/logs/range
 */
export interface LogsResponse {
  logs: HabitLog[];
}

/**
 * Habit breakdown metrics for analytics
 */
export interface HabitBreakdown {
  habitId: string;
  name: string;
  color: string;
  completedDays: number;
  totalDays: number;
  completionRate: number;
  averageQuality: number | null;
}

/**
 * Streak calculation statistics
 */
export interface StreakStats {
  currentPerfectStreak: number;
  longestPerfectStreak: number;
  habitStreaks: Record<string, { current: number; longest: number }>;
}

/**
 * Monthly report aggregation response for GET /api/reports/monthly
 */
export interface MonthlyReportResponse {
  completionRate: number;
  qualityScore: number;
  habitBreakdowns: HabitBreakdown[];
  streakStats: StreakStats;
}

/**
 * Payload for POST /api/reports/reflections
 */
export interface ReflectionPayload {
  monthKey: string; // "YYYY-MM"
  reflectionText: string;
  goalsNextMonth: string;
}

/**
 * Response for POST /api/reports/reflections
 */
export interface ReflectionResponse {
  success: boolean;
  reflection: MonthlyReflection;
}
