import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { HabitQuality } from '../../types';
import { useHabits } from '../../context/HabitContext';

export interface NotePopoverProps {
  habitId: string;
  habitName: string;
  habitColor: string;
  date: string;
  isOpen: boolean;
  onClose: () => void;
}

const QUALITY_LEVELS: { value: HabitQuality; label: string; activeClass: string }[] = [
  { value: 1, label: 'Very Poor', activeClass: 'bg-rose-600 text-white border-rose-500' },
  { value: 2, label: 'Good', activeClass: 'bg-amber-600 text-white border-amber-500' },
  { value: 3, label: 'Better', activeClass: 'bg-blue-600 text-white border-blue-500' },
  { value: 4, label: 'Best', activeClass: 'bg-emerald-600 text-white border-emerald-500' },
];

export function NotePopover({
  habitId,
  habitName,
  habitColor,
  date,
  isOpen,
  onClose,
}: NotePopoverProps): React.ReactElement | null {
  const { getLog, updateLogQuality, updateLogNote } = useHabits();
  const currentLog = getLog(habitId, date);

  const [quality, setQuality] = useState<HabitQuality | null>(() => currentLog?.quality ?? null);
  const [note, setNote] = useState<string>(() => currentLog?.note ?? '');

  if (!isOpen) return null;

  const handleSave = async () => {
    await updateLogQuality(habitId, date, quality);
    await updateLogNote(habitId, date, note.slice(0, 280));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: habitColor }} />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{habitName}</h3>
              <p className="text-xs text-slate-400">{date}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Quality Rating (1–4)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUALITY_LEVELS.map((level) => {
                const isSelected = quality === level.value;
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setQuality(isSelected ? null : level.value)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? level.activeClass
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="note-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Daily Reflection Note
              </label>
              <span className={`text-xs ${note.length > 250 ? 'text-amber-400' : 'text-slate-500'}`}>
                {note.length}/280
              </span>
            </div>
            <textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 280))}
              placeholder="What went well or what held you back today?"
              rows={3}
              maxLength={280}
              className="w-full px-3.5 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
          >
            Save Reflection
          </button>
        </div>
      </div>
    </div>
  );
}
