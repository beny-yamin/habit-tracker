import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { DailyTrendPoint } from '../../lib/analytics';

export interface TrendChartProps {
  data: DailyTrendPoint[];
  title?: string;
}

export function TrendChart({ data, title = 'Consistency Trends' }: TrendChartProps): React.ReactElement {
  const [metric, setMetric] = useState<'completion' | 'quality'>('completion');

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-lg shadow-black/20">
      {/* Header with Metric Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400">Daily performance throughout the selected timeframe</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-800/80 border border-slate-700/60 rounded-xl">
          <button
            type="button"
            onClick={() => setMetric('completion')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              metric === 'completion'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completion %
          </button>
          <button
            type="button"
            onClick={() => setMetric('quality')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              metric === 'quality'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quality Rating
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      {data.length > 0 ? (
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={metric === 'completion' ? '#6366f1' : '#10b981'}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={metric === 'completion' ? '#6366f1' : '#10b981'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                domain={metric === 'completion' ? [0, 100] : [1, 4]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as DailyTrendPoint;
                  return (
                    <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-white">{item.label}</p>
                      <p className="text-indigo-400 font-medium">
                        Completion: {item.completionRate}% ({item.completedCount} habits)
                      </p>
                      <p className="text-emerald-400 font-medium">
                        Quality: {item.qualityScore ? `${item.qualityScore}/4` : 'Unrated'}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey={metric === 'completion' ? 'completionRate' : 'qualityScore'}
                stroke={metric === 'completion' ? '#6366f1' : '#10b981'}
                strokeWidth={2.5}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
          No historical activity logged for this interval yet.
        </div>
      )}
    </div>
  );
}
