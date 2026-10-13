import React, { useRef, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import type { Html2PdfOptions } from 'html2pdf.js';
import type { MonthlyReportResponse, MonthlyReflection } from '../../types';

export interface PrintableReportProps {
  monthKey: string;
  reportData?: MonthlyReportResponse;
  reflection?: MonthlyReflection;
}

export function PrintableReport({
  monthKey,
  reportData,
  reflection,
}: PrintableReportProps): React.ReactElement {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExportPdf = () => {
    if (!reportRef.current) return;
    setExporting(true);
    const opt: Html2PdfOptions = {
      margin: 10,
      filename: `HabitPulse-Report-${monthKey}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    try {
      void html2pdf()
        .set(opt)
        .from(reportRef.current)
        .save()
        .then(() => setExporting(false))
        .catch(() => setExporting(false));
    } catch {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Exportable Summary for {monthKey}</span>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting}
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Generating PDF...' : 'Export to PDF'}</span>
        </button>
      </div>

      {/* Printable Report Canvas */}
      <div
        ref={reportRef}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-100 shadow-xl"
      >
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">HabitPulse Monthly Report</h2>
          <p className="text-xs text-slate-400 mt-1">Report Period: {monthKey}</p>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <p className="text-[10px] uppercase font-bold text-slate-400">Completion Rate</p>
            <p className="text-lg sm:text-xl font-extrabold text-indigo-400 mt-0.5">
              {reportData?.completionRate ?? 0}%
            </p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <p className="text-[10px] uppercase font-bold text-slate-400">Quality Score</p>
            <p className="text-lg sm:text-xl font-extrabold text-amber-400 mt-0.5">
              {reportData?.qualityScore ? reportData.qualityScore.toFixed(1) : '—'}/4
            </p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <p className="text-[10px] uppercase font-bold text-slate-400">Perfect Streak</p>
            <p className="text-lg sm:text-xl font-extrabold text-rose-400 mt-0.5">
              {reportData?.streakStats?.currentPerfectStreak ?? 0}d
            </p>
          </div>
        </div>

        {/* Habit Performance List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Habit Performance</h3>
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-800/20">
            {reportData?.habitBreakdowns?.map((item) => (
              <div key={item.habitId} className="flex items-center justify-between p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-slate-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <span>{item.completedDays}/{item.totalDays} days</span>
                  <span className="font-bold text-indigo-400">{item.completionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection Notes */}
        {reflection && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            {reflection.reflectionText && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Monthly Lessons</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-xl">
                  {reflection.reflectionText}
                </p>
              </div>
            )}
            {reflection.goalsNextMonth && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Goals for Next Month</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-xl">
                  {reflection.goalsNextMonth}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
