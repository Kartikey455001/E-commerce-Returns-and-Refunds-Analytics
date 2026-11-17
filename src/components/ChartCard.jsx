import React from 'react';

export default function ChartCard({
  title,
  subtitle,
  badge,
  action,
  children,
  className = ''
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900 tracking-tight">{title}</h4>
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="w-full flex-1 min-h-[260px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
