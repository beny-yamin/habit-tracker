import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Cloud,
  RefreshCw,
  LogOut,
  LogIn,
  User,
  Calendar,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flame,
  Star,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitProvider, useHabits } from './context/HabitContext';
import { WeeklyGrid } from './components/weekly/WeeklyGrid';
import { StatCard } from './components/analytics/StatCard';
import { TrendChart } from './components/analytics/TrendChart';
import { HabitBreakdown } from './components/analytics/HabitBreakdown';
import { ReflectionEditor } from './components/monthly/ReflectionEditor';
import { PrintableReport } from './components/monthly/PrintableReport';
import {
  calculateStreakStats,
  calculateHabitBreakdowns,
  generateDailyTrendData,
  calculateCompletionRate,
  calculateQualityScore,
} from './lib/analytics';
import type { HabitLog, MonthlyReflection, MonthlyReportResponse } from './types';

type ActiveTab = 'weekly' | 'analytics' | 'reflections';

function Navbar(): React.ReactElement {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { syncing } = useHabits();

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              HabitPulse
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              6-Core Matrix
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <div className="hidden sm:flex items-center">
              {syncing ? (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Synced</span>
                </span>
              )}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User'}
                    className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="text-sm font-medium hidden md:inline text-slate-300 max-w-[140px] truncate">
                  {user.displayName ?? user.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="min-w-[44px] min-h-[44px] px-3 py-2 flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="min-w-[44px] min-h-[44px] px-4 py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}): React.ReactElement {
  const tabs = [
    { id: 'weekly' as const, label: 'Weekly Matrix', icon: Calendar },
    { id: 'analytics' as const, label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'reflections' as const, label: 'Monthly Reflection', icon: BookOpen },
  ];

  return (
    <nav className="w-full max-w-2xl mx-auto p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-1.5 backdrop-blur-md shadow-lg shadow-black/20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
              isActive
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard(): React.ReactElement {
  const [tab, setTab] = useState<ActiveTab>('weekly');
  const { habits, logs, currentWeekDate, selectedMonth, getMonthlyReflection } = useHabits();
  const [reflection, setReflection] = useState<MonthlyReflection | undefined>(undefined);

  const fetchReflection = useCallback(() => {
    void getMonthlyReflection(selectedMonth).then(setReflection);
  }, [selectedMonth, getMonthlyReflection]);

  useEffect(() => {
    fetchReflection();
  }, [fetchReflection]);

  const { weekDates, monthDates } = useMemo(() => {
    const d = new Date(currentWeekDate.getFullYear(), currentWeekDate.getMonth(), currentWeekDate.getDate(), 12);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    const w: string[] = [];
    for (let i = 0; i < 7; i++) {
      const c = new Date(d);
      c.setDate(d.getDate() + i);
      w.push(`${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, '0')}-${String(c.getDate()).padStart(2, '0')}`);
    }

    const [y, m] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(y, m, 0).getDate();
    const mDates: string[] = [];
    for (let i = 1; i <= totalDays; i++) {
      mDates.push(`${selectedMonth}-${String(i).padStart(2, '0')}`);
    }
    return { weekDates: w, monthDates: mDates };
  }, [currentWeekDate, selectedMonth]);

  const streakStats = useMemo(() => calculateStreakStats(habits, logs), [habits, logs]);
  const habitBreakdowns = useMemo(() => calculateHabitBreakdowns(habits, logs, monthDates), [habits, logs, monthDates]);
  const trendData = useMemo(() => generateDailyTrendData(habits, logs, weekDates), [habits, logs, weekDates]);

  const activeHabitCount = useMemo(() => habits.filter((h) => !h.archived).length, [habits]);
  const monthCompletedCount = useMemo(
    () => monthDates.reduce((acc, dt) => acc + habits.filter((h) => !h.archived && logs[`${h._id}_${dt}`]?.completed).length, 0),
    [habits, logs, monthDates]
  );
  const completionRate = useMemo(
    () => calculateCompletionRate(monthCompletedCount, activeHabitCount, monthDates.length),
    [monthCompletedCount, activeHabitCount, monthDates.length]
  );

  const qualityStats = useMemo(() => {
    const l = monthDates.flatMap((dt) => habits.map((h) => logs[`${h._id}_${dt}`]).filter(Boolean) as HabitLog[]);
    return calculateQualityScore(l);
  }, [habits, logs, monthDates]);

  const monthlyReportData = useMemo<MonthlyReportResponse>(
    () => ({ completionRate, qualityScore: qualityStats.rawScore, habitBreakdowns, streakStats }),
    [completionRate, qualityStats.rawScore, habitBreakdowns, streakStats]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        <TabNavigation activeTab={tab} onTabChange={setTab} />

        {tab === 'weekly' && <WeeklyGrid />}

        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard title="Completion Rate" value={`${completionRate}%`} subtitle="Month overall" icon={CheckCircle2} accentColor="#6366f1" />
              <StatCard title="Perfect Day Streak" value={`${streakStats.currentPerfectStreak}d`} subtitle={`Best: ${streakStats.longestPerfectStreak}d`} icon={Flame} accentColor="#f43f5e" />
              <StatCard title="Quality Rating" value={qualityStats.rawScore ? `${qualityStats.rawScore}/4` : '—'} subtitle={`${qualityStats.percentage}% quality`} icon={Star} accentColor="#f59e0b" />
              <StatCard title="Core Commitments" value={activeHabitCount} subtitle="Active daily habits" icon={Sparkles} accentColor="#10b981" />
            </div>
            <TrendChart data={trendData} title="Weekly Completion & Quality Trends" />
            <HabitBreakdown breakdowns={habitBreakdowns} streakMap={streakStats.habitStreaks} />
          </div>
        )}

        {tab === 'reflections' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <ReflectionEditor monthKey={selectedMonth} onSaved={fetchReflection} />
            <PrintableReport monthKey={selectedMonth} reportData={monthlyReportData} reflection={reflection} />
          </div>
        )}
      </main>
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        HabitPulse • 6-Core Habit Matrix • Offline-First Spec Architecture
      </footer>
    </div>
  );
}

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <HabitProvider>
        <Dashboard />
      </HabitProvider>
    </AuthProvider>
  );
}
