import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  badge?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = '#6366f1',
  badge,
}: StatCardProps): React.ReactElement {
  return (
    <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all duration-200">
      {/* Background Glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Card Header with Icon & Optional Badge */}
      <div className="flex items-center justify-between mb-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
          style={{
            backgroundColor: `${accentColor}1f`,
            color: accentColor,
            border: `1px solid ${accentColor}33`,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>

        {badge && (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/70">
            {badge}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="space-y-0.5">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </h3>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </p>
      </div>

      {/* Subtitle / Context Note */}
      {subtitle && (
        <p className="mt-2.5 text-xs text-slate-400/90 border-t border-slate-800/80 pt-2.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
