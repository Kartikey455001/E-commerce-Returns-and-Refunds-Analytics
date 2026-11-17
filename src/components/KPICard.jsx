import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  delta,
  deltaType = 'neutral', // 'positive', 'negative', 'neutral' (determines if positive delta is good or bad)
  deltaLabel = 'vs previous period',
  color = 'indigo'
}) {
  // Determine if delta is favorable
  // For Return Rate, negative delta is actually GOOD (fewer returns)
  let isGood = false;
  if (deltaType === 'lowerIsBetter') {
    isGood = delta < 0;
  } else {
    isGood = delta > 0;
  }

  const isZero = delta === 0 || delta === undefined || isNaN(delta);

  const colorStyles = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100'
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colorStyles[color] || colorStyles.indigo}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {delta !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold text-xs ${
              isZero
                ? 'bg-slate-100 text-slate-600'
                : isGood
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {isZero ? (
                <Minus className="w-3 h-3" />
              ) : delta > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isZero ? '0.0%' : `${Math.abs(delta).toFixed(1)}%`}
            </span>
            <span className="text-slate-400 font-medium">{deltaLabel}</span>
          </div>
        )}

        {subtitle && (
          <span className="text-slate-500 font-medium ml-auto">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
