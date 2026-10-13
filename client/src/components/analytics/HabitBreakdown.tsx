import React from 'react';
import { Flame, Star, CheckCircle2 } from 'lucide-react';
import type { HabitBreakdown as HabitBreakdownType } from '../../types';

export interface HabitBreakdownProps {
  breakdowns: HabitBreakdownType[];
  streakMap?: Record<string, { current: number; longest: number }>;
}

export function HabitBreakdown({ breakdowns, streakMap = {} }: HabitBreakdownProps): React.ReactElement {
  if (breakdowns.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
        No habit performance metrics available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {breakdowns.map((item) => {
        const streak = streakMap[item.habitId];
        const currentStreak = streak?.current ?? 0;
        const longestStreak = streak?.longest ?? 0;

        return (
          <div
            key={item.habitId}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 backdrop-blur-md shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all duration-200"
          >
            {/* Header: Dot, Name, Completion % */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <h4 className="font-bold text-sm text-slate-100 truncate" title={item.name}>
                  {item.name}
                </h4>
              </div>
              <span
                className="text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0 border"
                style={{
                  backgroundColor: `${item.color}1a`,
                  color: item.color,
                  borderColor: `${item.color}33`,
                }}
              >
                {item.completionRate}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden mb-3.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(item.completionRate, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>

            {/* Metric Details */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                  <span>Days</span>
                </div>
                <p className="text-xs font-extrabold text-slate-200">
                  {item.completedDays}/{item.totalDays}
                </p>
              </div>

              <div className="space-y-0.5 border-x border-slate-800">
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>Quality</span>
                </div>
                <p className="text-xs font-extrabold text-slate-200">
                  {item.averageQuality ? `${item.averageQuality.toFixed(1)}/4` : '—'}
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-400">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Streak</span>
                </div>
                <p className="text-xs font-extrabold text-slate-200" title={`Best: ${longestStreak} days`}>
                  {currentStreak}d
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
