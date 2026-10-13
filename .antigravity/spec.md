
# SECTION 4: SPEC-DRIVEN ARCHITECTURE (HABIT TRACKER)

## 4.1 Data Models (Mongoose & TypeScript Schemas)

### Habit Schema (`Habit`)
- `_id`: ObjectId (MongoDB auto-generated)
- `userId`: String (Firebase UID, indexed)
- `name`: String (e.g., "Bible study", "Coding", "Prayer", "Reading", "Exercise", "Planning")
- `color`: String (Hex color code, e.g., "#3B82F6")
- `order`: Number (0 to 5, integer index for sorting)
- `archived`: Boolean (default: false)
- `createdAt`: Date / ISO string
- Index: `{ userId: 1, order: 1 }`

### HabitLog Schema (`HabitLog`)
- `_id`: ObjectId (MongoDB auto-generated)
- `userId`: String (Firebase UID)
- `habitId`: ObjectId (References `Habit._id`)
- `date`: String (Format: "YYYY-MM-DD", strictly enforced)
- `completed`: Boolean (default: false)
- `quality`: Number | null (Restricted to enum: `[1, 2, 3, 4, null]`)
  * 1 = Poor, 2 = Fair, 3 = Good, 4 = Excellent
- `note`: String (Max length: 280 characters, default: "")
- `updatedAt`: Date / ISO string
- Compound Unique Index: `{ userId: 1, habitId: 1, date: 1 }` (Enforces 1 record per user/habit/day)

### MonthlyReflection Schema (`MonthlyReflection`)
- `_id`: ObjectId (MongoDB auto-generated)
- `userId`: String (Firebase UID)
- `monthKey`: String (Format: "YYYY-MM", e.g., "2026-10")
- `reflectionText`: String (Lessons, hurdles, personal notes)
- `goalsNextMonth`: String (Target commitments for the upcoming month)
- `updatedAt`: Date / ISO string
- Compound Unique Index: `{ userId: 1, monthKey: 1 }`

## 4.2 API Contracts & Endpoint Definitions

### Base URL: `/api`
All protected endpoints require Header: `Authorization: Bearer <Firebase_ID_Token>`

### Endpoints
1. `GET /api/habits`
   - Response: `{ habits: Habit[] }`
   - Logic: Return all 6 habits for `userId`. If user is new (0 habits), auto-seed the default 6 habits.
2. `GET /api/logs/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
   - Response: `{ logs: HabitLog[] }`
   - Logic: Fetches logs matching `userId` where date falls between `startDate` and `endDate` inclusive.
3. `POST /api/logs/batch`
   - Payload: `{ logs: Array<{ habitId: string, date: string, completed: boolean, quality?: number|null, note?: string }> }`
   - Response: `{ success: true, processedCount: number }`
   - Logic: Executes atomic MongoDB `bulkWrite` with `updateOne` and `{ upsert: true }`.
4. `GET /api/reports/monthly?month=YYYY-MM`
   - Response: `{ completionRate: number, qualityScore: number, habitBreakdowns: object[], streakStats: object }`
   - Logic: Aggregates daily logs for the selected month to produce monthly totals.
5. `POST /api/reports/reflections`
   - Payload: `{ monthKey: string, reflectionText: string, goalsNextMonth: string }`
   - Response: `{ success: true, reflection: MonthlyReflection }`
   - Logic: Upserts reflection entry for `monthKey`.

## 4.3 Core Business Logic & Mathematical Formulas
- 6 Core Habits: Bible study, Coding, Prayer, Reading, Exercise, Planning.
- Completion Rate (%):
  Completion Rate = (Completed Habit Logs / (6 habits * Days in Interval)) * 100
- Raw Quality Score (1.0 to 4.0):
  Quality Score = Sum(Quality of Rated Completed Logs) / Count of Rated Completed Logs
- Quality Percentage (%):
  Quality Percentage = (Raw Quality Score / 4) * 100
- Streaks Engine:
  * Habit Streak: Consecutive days an individual habit has completed = true.
  * Perfect Day Streak: Consecutive days where all 6 habits have completed = true.
- Trigger Celebration: Fire `canvas-confetti` when a user marks the 6th habit completed on the current calendar day.

## 4.4 Step-by-Step Implementation Sequence

Phase 1: Server Infrastructure
- Step 1.1: `server/src/config/db.ts` & `server/src/config/firebaseAdmin.ts`
- Step 1.2: `server/src/middleware/auth.ts`
- Step 1.3: `server/src/models/Habit.ts` & `server/src/models/HabitLog.ts`
- Step 1.4: `server/src/models/Reflection.ts`
- Step 1.5: `server/src/controllers/habitController.ts` & `server/src/routes/habitRoutes.ts`
- Step 1.6: `server/src/controllers/logController.ts` & `server/src/routes/logRoutes.ts`
- Step 1.7: `server/src/controllers/reportController.ts` & `server/src/routes/reportRoutes.ts`
- Step 1.8: `server/src/server.ts` integration and health check verification

Phase 2: Client Foundation & Local Storage
- Step 2.1: `client/src/config/firebase.ts` & `client/src/types/index.ts`
- Step 2.2: `client/src/types/declarations.d.ts` (declare module 'html2pdf.js')
- Step 2.3: `client/src/lib/storage.ts` (`idb-keyval` wrapper) & `client/src/lib/api.ts`
- Step 2.4: `client/src/lib/dateUtils.ts` (Monday-Sunday calculation, week switching)
- Step 2.5: `client/src/context/AuthContext.tsx`
- Step 2.6: `client/src/context/HabitContext.tsx` (Optimistic writes to IndexedDB + queue sync)

Phase 3: Interactive Weekly Matrix (The Core UI)
- Step 3.1: `client/src/components/layout/Navbar.tsx` & `TabNavigation.tsx`
- Step 3.2: `client/src/components/weekly/DayCell.tsx` (Click to toggle, displays status)
- Step 3.3: `client/src/components/weekly/NotePopover.tsx` (Quality 1-4 buttons + note textarea)
- Step 3.4: `client/src/components/weekly/HabitRow.tsx` & `WeeklyGrid.tsx` (7x6 matrix)

Phase 4: Analytics & Monthly Reports
- Step 4.1: `client/src/lib/analytics.ts` (Streaks, quality %, completion %)
- Step 4.2: `client/src/components/analytics/StatCard.tsx` & `TrendChart.tsx` (Recharts integration)
- Step 4.3: `client/src/components/analytics/HabitBreakdown.tsx`
- Step 4.4: `client/src/components/monthly/ReflectionEditor.tsx` & `PrintableReport.tsx` (PDF export)

Phase 5: Cloud Deployment
- Step 5.1: `render.yaml` configuration for static client and web service API
- Step 5.2: End-to-end cloud smoke test
'@