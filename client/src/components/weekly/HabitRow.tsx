import React from 'react';
import { Check, MessageSquare } from 'lucide-react';
import type { Habit, HabitLog } from '../../types';
import { useHabits } from '../../context/HabitContext';

export interface DayCellProps {
  habitId: string;
  habitName: string;
  habitColor: string;
  date: string;
  log?: HabitLog;
  onToggle?: (habitId: string, date: string) => void;
  onOpenNote?: (habitId: string, date: string) => void;
  isToday?: boolean;
  disabled?: boolean;
}

export function DayCell({
  habitId,
  habitName,
  habitColor,
  date,
  log,
  onToggle,
  onOpenNote,
  isToday = false,
  disabled = false,
}: DayCellProps): React.ReactElement {
  const { getLog, toggleHabit } = useHabits();
  const currentLog = log ?? getLog(habitId, date);
  const isCompleted = currentLog?.completed ?? false;
  const quality = currentLog?.quality;
  const hasNote = Boolean(currentLog?.note && currentLog.note.trim().length > 0);

  return (
    <div
      role="checkbox"
      aria-checked={isCompleted}
      aria-label={`${habitName} on ${date}: ${isCompleted ? 'Completed' : 'Incomplete'}`}
      onClick={(e) => {
        e.preventDefault();
        if (disabled) return;
        if (onToggle) onToggle(habitId, date);
        else void toggleHabit(habitId, date);
      }}
      className={`group relative min-w-[44px] min-h-[44px] w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-95 ${
        isToday ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''
      } ${
        isCompleted
          ? 'shadow-lg shadow-black/30'
          : 'bg-slate-800/40 border-2 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/80'
      }`}
      style={isCompleted ? { backgroundColor: habitColor, boxShadow: `0 4px 14px -2px ${habitColor}66` } : undefined}
    >
      {isCompleted ? (
        <Check className="w-6 h-6 text-white stroke-[3] drop-shadow-sm transition-transform duration-150 group-hover:scale-110" />
      ) : (
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 group-hover:border-slate-400"
          style={{ borderColor: `${habitColor}66` }}
        />
      )}
      {quality && (
        <span
          className={`absolute bottom-1 left-1.5 text-[9px] font-bold px-1 rounded-sm leading-tight ${
            isCompleted ? 'bg-black/35 text-white' : 'bg-slate-700 text-indigo-300'
          }`}
        >
          Q{quality}
        </span>
      )}
      {(hasNote || onOpenNote) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenNote?.(habitId, date);
          }}
          className={`absolute top-1 right-1 p-0.5 rounded-full cursor-pointer ${
            hasNote ? 'opacity-100 text-amber-300' : 'opacity-0 group-hover:opacity-75 text-slate-400 hover:text-white'
          }`}
          title={hasNote ? `Note: ${currentLog?.note}` : 'Add note/rating'}
        >
          <MessageSquare className="w-3 h-3 fill-current" />
        </button>
      )}
    </div>
  );
}

export interface HabitRowProps {
  habit: Habit;
  weekDates: string[];
  todayDate: string;
  onOpenNote: (habitId: string, date: string) => void;
}

export function HabitRow({ habit, weekDates, todayDate, onOpenNote }: HabitRowProps): React.ReactElement {
  const { getLog } = useHabits();
  const completedCount = weekDates.reduce((acc, date) => (getLog(habit._id, date)?.completed ? acc + 1 : acc), 0);

  return (
    <div className="flex items-center gap-2 sm:gap-4 py-2 px-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 transition-colors">
      <div className="w-36 sm:w-48 shrink-0 flex items-center justify-between pr-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-3.5 h-3.5 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
          <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate" title={habit.name}>
            {habit.name}
          </span>
        </div>
        <span
          className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 border ${
            completedCount === 7
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
          }`}
        >
          {completedCount}/7
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {weekDates.map((date) => (
          <DayCell
            key={`${habit._id}_${date}`}
            habitId={habit._id}
            habitName={habit.name}
            habitColor={habit.color}
            date={date}
            isToday={date === todayDate}
            onOpenNote={onOpenNote}
          />
        ))}
      </div>
    </div>
  );
}
