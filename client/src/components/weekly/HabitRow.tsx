import React, { useState } from 'react';
import { Check, MessageSquare, Trash2, Award, ChevronDown, ChevronUp } from 'lucide-react';
import type { Habit, HabitLog, HabitQuality } from '../../types';
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

const QUALITY_NAMES: Record<number, string> = {
  1: 'Very poor',
  2: 'Good',
  3: 'Better',
  4: 'Best',
};

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
            isCompleted ? 'bg-black/40 text-white' : 'bg-slate-700 text-indigo-300'
          }`}
          title={`Quality: ${QUALITY_NAMES[quality] || quality}`}
        >
          {quality === 1 ? 'Poor' : quality === 2 ? 'Good' : quality === 3 ? 'Better' : 'Best'}
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

const INLINE_QUALITY_OPTIONS: { value: HabitQuality; label: string; activeClass: string; hoverClass: string }[] = [
  { value: 1, label: 'Very poor', activeClass: 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-600/30', hoverClass: 'hover:border-rose-500/50 hover:text-rose-300' },
  { value: 2, label: 'Good', activeClass: 'bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-600/30', hoverClass: 'hover:border-amber-500/50 hover:text-amber-300' },
  { value: 3, label: 'Better', activeClass: 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/30', hoverClass: 'hover:border-blue-500/50 hover:text-blue-300' },
  { value: 4, label: 'Best', activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/30', hoverClass: 'hover:border-emerald-500/50 hover:text-emerald-300' },
];

export function HabitRow({ habit, weekDates, todayDate, onOpenNote }: HabitRowProps): React.ReactElement {
  const { getLog, updateLogQuality, toggleHabit, deleteHabit } = useHabits();
  const [showQuality, setShowQuality] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const completedCount = weekDates.reduce((acc, date) => (getLog(habit._id, date)?.completed ? acc + 1 : acc), 0);
  const todayLog = getLog(habit._id, todayDate);
  const currentQuality = todayLog?.quality ?? null;

  const handleSelectQuality = async (val: HabitQuality) => {
    // If clicking already selected, toggle off (set to null)
    const nextVal = currentQuality === val ? null : val;
    // If not completed yet and selecting quality, also mark completed
    if (nextVal !== null && !todayLog?.completed) {
      await toggleHabit(habit._id, todayDate);
    }
    await updateLogQuality(habit._id, todayDate, nextVal);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the habit "${habit.name}"?`)) {
      setIsDeleting(true);
      try {
        await deleteHabit(habit._id);
      } catch (err) {
        console.error('Failed to delete habit:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 py-2.5 px-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 transition-colors group/row">
      {/* Habit Info & Quality Column */}
      <div className="w-52 sm:w-64 shrink-0 flex flex-col justify-center pr-2 gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3.5 h-3.5 shrink-0 rounded-full shadow-xs" style={{ backgroundColor: habit.color }} />
            <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate" title={habit.name}>
              {habit.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                completedCount === 7
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
              }`}
            >
              {completedCount}/7
            </span>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="opacity-0 group-hover/row:opacity-60 hover:opacity-100! p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-opacity"
              title="Delete habit"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quality Rating Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowQuality((prev) => !prev)}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none"
            >
              <Award className="w-3 h-3" />
              <span>{currentQuality ? `Today: ${QUALITY_NAMES[currentQuality]}` : 'Add Quality'}</span>
              {showQuality ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {currentQuality && (
              <span className="text-[10px] text-slate-400 font-semibold">
                Rated
              </span>
            )}
          </div>

          {(showQuality || currentQuality !== null) && (
            <div className="flex items-center gap-1 pt-0.5 animate-in fade-in duration-150">
              {INLINE_QUALITY_OPTIONS.map((opt) => {
                const isSelected = currentQuality === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => void handleSelectQuality(opt.value)}
                    className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg border font-medium transition-all cursor-pointer ${
                      isSelected
                        ? opt.activeClass
                        : `bg-slate-800/60 border-slate-700/60 text-slate-300 ${opt.hoverClass}`
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7 Checkboxes for Weekdays */}
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
