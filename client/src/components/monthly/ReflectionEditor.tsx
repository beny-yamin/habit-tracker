import React, { useState, useEffect } from 'react';
import { BookOpen, Save, Check } from 'lucide-react';
import { useHabits } from '../../context/HabitContext';

export interface ReflectionEditorProps {
  monthKey: string;
  onSaved?: () => void;
}

export function ReflectionEditor({ monthKey, onSaved }: ReflectionEditorProps): React.ReactElement {
  const { getMonthlyReflection, saveMonthlyReflection } = useHabits();
  const [reflectionText, setReflectionText] = useState<string>('');
  const [goalsNextMonth, setGoalsNextMonth] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedBadge, setSavedBadge] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    void getMonthlyReflection(monthKey).then((res) => {
      if (active && res) {
        setReflectionText(res.reflectionText ?? '');
        setGoalsNextMonth(res.goalsNextMonth ?? '');
      }
    });
    return () => {
      active = false;
    };
  }, [monthKey, getMonthlyReflection]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMonthlyReflection(monthKey, reflectionText, goalsNextMonth);
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2500);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-lg shadow-black/20 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Monthly Reflection & Commitments</h3>
            <p className="text-xs text-slate-400">Target notes for {monthKey}</p>
          </div>
        </div>

        {savedBadge && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="reflection-text" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Lessons, Hurdles & Observations
          </label>
          <textarea
            id="reflection-text"
            rows={4}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="What went well this month? Which hurdles stood in your way?"
            className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
        </div>

        <div>
          <label htmlFor="goals-text" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Commitments & Goals for Next Month
          </label>
          <textarea
            id="goals-text"
            rows={3}
            value={goalsNextMonth}
            onChange={(e) => setGoalsNextMonth(e.target.value)}
            placeholder="What are your highest priority targets for the upcoming month?"
            className="w-full px-4 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Monthly Reflection'}</span>
        </button>
      </div>
    </form>
  );
}
