import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Lightbulb } from 'lucide-react';

export default function InsightCard({ insight }) {
  if (!insight) return null;

  const typeConfig = {
    critical: {
      border: 'border-rose-200 bg-rose-50/40',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      label: 'High Priority Risk'
    },
    warning: {
      border: 'border-amber-200 bg-amber-50/40',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      label: 'Performance Alert'
    },
    opportunity: {
      border: 'border-indigo-200 bg-indigo-50/40',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Lightbulb,
      iconColor: 'text-indigo-600',
      label: 'Strategic Opportunity'
    },
    positive: {
      border: 'border-emerald-200 bg-emerald-50/40',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      label: 'Operational Benchmark'
    },
    info: {
      border: 'border-blue-200 bg-blue-50/40',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      label: 'Analytical Pattern'
    }
  };

  const config = typeConfig[insight.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-2xl border ${config.border} flex flex-col justify-between transition-all hover:shadow-xs`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${config.badge}`}>
            {config.label}
          </span>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>

        <h5 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
          {insight.title}
        </h5>

        <p className="text-xs text-slate-600 leading-relaxed font-normal mb-3">
          {insight.description}
        </p>
      </div>

      {insight.recommendation && (
        <div className="pt-2.5 border-t border-slate-200/60 flex items-start gap-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/40">
          <span className="text-indigo-600 font-bold shrink-0">Recommendation:</span>
          <span className="text-slate-600 font-medium">{insight.recommendation}</span>
        </div>
      )}
    </div>
  );
}
