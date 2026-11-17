import React from 'react';
import { 
  LayoutDashboard, 
  RotateCcw, 
  Banknote, 
  Package, 
  Users, 
  MapPin, 
  FileSpreadsheet, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';

const navItems = [
  { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
  { id: 'returns', label: 'Returns Analysis', icon: RotateCcw },
  { id: 'refunds', label: 'Refund Analytics', icon: Banknote },
  { id: 'products', label: 'Product Analysis', icon: Package },
  { id: 'customers', label: 'Customer Analysis', icon: Users },
  { id: 'geographic', label: 'Geographic Analysis', icon: MapPin },
  { id: 'reports', label: 'Reports & Insights', icon: FileSpreadsheet },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { activeTab, setActiveTab, activeFilterCount } = useAnalytics();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-xl">💎</span>
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                OmniReturn
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  BI Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Returns & Refunds Analytics</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Analytics Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive ? (
                  <ChevronRight className="w-4 h-4 text-white/80" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* System & Data Integrity Status Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="rounded-xl p-3 bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">Static BI Data Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              7,600 verified orders & 1,484 returns loaded in-memory. Zero backend latency.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-700/50">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Vercel Static
              </span>
              <span className="font-mono text-slate-300">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
