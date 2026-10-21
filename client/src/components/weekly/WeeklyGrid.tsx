import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles, Plus, X, Check } from 'lucide-react';
import { useHabits } from '../../context/HabitContext';
import { HabitRow } from './HabitRow';
import { NotePopover } from './NotePopover';

interface ActiveNoteModal {
  habitId: string;
  habitName: string;
  habitColor: string;
  date: string;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#F97316', // Orange
];

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WeeklyGrid(): React.ReactElement {
  const { habits, currentWeekDate, goToPreviousWeek, goToNextWeek, goToCurrentWeek, createHabit } = useHabits();
  const [activeNote, setActiveNote] = useState<ActiveNoteModal | null>(null);

  // Add Habit Dialog state
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState(COLOR_PALETTE[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const todayStr = useMemo(() => getTodayString(), []);

  const { weekDays, weekDates, dateRangeLabel } = useMemo(() => {
    const d = new Date(currentWeekDate.getFullYear(), currentWeekDate.getMonth(), currentWeekDate.getDate(), 12);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);

    const days: Date[] = [];
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(d);
      cur.setDate(d.getDate() + i);
      days.push(cur);
      dates.push(
        `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      );
    }
    const start = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { weekDays: days, weekDates: dates, dateRangeLabel: `${start} – ${end}` };
  }, [currentWeekDate]);

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order),
    [habits]
  );

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) {
      setAddError('Please enter a habit name.');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);
    try {
      await createHabit(newHabitName.trim(), newHabitColor);
      setNewHabitName('');
      setNewHabitColor(COLOR_PALETTE[0]);
      setIsAddingHabit(false);
    } catch (err) {
      console.error('Failed to create habit:', err);
      setAddError(err instanceof Error ? err.message : 'Failed to create habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Week Navigator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{dateRangeLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousWeek}
            className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToCurrentWeek}
            className="min-h-[44px] px-4 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goToNextWeek}
            className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Matrix Table Container */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[700px] sm:min-w-[800px] space-y-2">
          <div className="flex items-center gap-2 sm:gap-4 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="w-52 sm:w-64 shrink-0">Habit Commitment</div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {weekDates.map((date, idx) => (
                <div
                  key={date}
                  className={`w-12 sm:w-14 text-center py-1.5 rounded-xl ${
                    date === todayStr ? 'bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30' : ''
                  }`}
                >
                  <div>{DAY_NAMES[idx]}</div>
                  <div className="text-[11px] font-normal">{weekDays[idx].getDate()}</div>
                </div>
              ))}
            </div>
          </div>

          {activeHabits.length > 0 ? (
            activeHabits.map((habit) => (
              <HabitRow
                key={habit._id}
                habit={habit}
                weekDates={weekDates}
                todayDate={todayStr}
                onOpenNote={(id, date) =>
                  setActiveNote({ habitId: id, habitName: habit.name, habitColor: habit.color, date })
                }
              />
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-80" />
              <p className="text-sm font-medium">No habits yet. Click below to add your first habit!</p>
            </div>
          )}

          {/* Add Habit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setAddError(null);
                setIsAddingHabit(true);
              }}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/30 hover:bg-slate-900/70 text-slate-400 hover:text-indigo-300 font-semibold text-sm transition-all duration-150 cursor-pointer group"
            >
              <Plus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <span>Add Habit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Note & Quality Popover Modal */}
      {activeNote && (
        <NotePopover
          key={`${activeNote.habitId}_${activeNote.date}`}
          habitId={activeNote.habitId}
          habitName={activeNote.habitName}
          habitColor={activeNote.habitColor}
          date={activeNote.date}
          isOpen={true}
          onClose={() => setActiveNote(null)}
        />
      )}

      {/* Create New Habit Modal */}
      {isAddingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: newHabitColor }} />
                <h3 className="font-bold text-base text-white">Create New Habit</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateHabit(e)} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  {addError}
                </div>
              )}

              <div>
                <label htmlFor="habit-name-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Habit Name
                </label>
                <input
                  id="habit-name-input"
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g. Gym Workout, Read 10 Pages..."
                  maxLength={60}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_PALETTE.map((color) => {
                    const isSelected = newHabitColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewHabitColor(color)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingHabit(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newHabitName.trim()}
                  className="min-h-[40px] px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
