import { auth } from '../config/firebase';
import type {
  BatchLogItem,
  BatchLogResponse,
  HabitsResponse,
  LogsResponse,
  MonthlyReportResponse,
  ReflectionPayload,
  ReflectionResponse,
} from '../types';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:5173/api';
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const BASE_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

/**
 * Retrieves the current user's Firebase ID token for Authorization header injection.
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};

  try {
    const token = await user.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Failed to resolve Firebase ID token:', error);
    return {};
  }
}

/**
 * Standard fetch wrapper with Bearer token injection and defensive error parsing.
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errorData = (await response.json()) as { message?: string; error?: string };
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // JSON parse failed; retain default status message
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetches habits for the authenticated user (or auto-seeds if new).
 */
export async function getHabits(): Promise<HabitsResponse> {
  return apiRequest<HabitsResponse>('/habits');
}

/**
 * Fetches daily logs falling between startDate and endDate inclusive.
 */
export async function getLogsRange(startDate: string, endDate: string): Promise<LogsResponse> {
  const query = new URLSearchParams({ startDate, endDate }).toString();
  return apiRequest<LogsResponse>(`/logs/range?${query}`);
}

/**
 * Executes atomic batch upsert for habit logs.
 */
export async function batchSyncLogs(logs: BatchLogItem[]): Promise<BatchLogResponse> {
  return apiRequest<BatchLogResponse>('/logs/batch', {
    method: 'POST',
    body: JSON.stringify({ logs }),
  });
}

/**
 * Retrieves aggregated monthly completion and quality metrics.
 */
export async function getMonthlyReport(month: string): Promise<MonthlyReportResponse> {
  const query = new URLSearchParams({ month }).toString();
  return apiRequest<MonthlyReportResponse>(`/reports/monthly?${query}`);
}

/**
 * Upserts monthly reflection notes and commitments.
 */
export async function saveReflection(payload: ReflectionPayload): Promise<ReflectionResponse> {
  return apiRequest<ReflectionResponse>('/reports/reflections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const api = {
  request: apiRequest,
  getHabits,
  getLogsRange,
  batchSyncLogs,
  getMonthlyReport,
  saveReflection,
};
