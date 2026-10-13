import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
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

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WeeklyGrid(): React.ReactElement {
  const { habits, currentWeekDate, goToPreviousWeek, goToNextWeek, goToCurrentWeek } = useHabits();
  const [activeNote, setActiveNote] = useState<ActiveNoteModal | null>(null);

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

      {/* 7x6 Matrix Table Container */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[660px] sm:min-w-[760px] space-y-2">
          <div className="flex items-center gap-2 sm:gap-4 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="w-36 sm:w-48 shrink-0">Habit Commitment</div>
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
              <p className="text-sm font-medium">No habits loaded. Please sign in or check connectivity.</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
