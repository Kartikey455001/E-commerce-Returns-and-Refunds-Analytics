import React from 'react';
import { 
  Menu, 
  Filter, 
  Download, 
  Calendar, 
  RotateCcw, 
  Search,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';
import { exportToCSV } from '../utils/exportCSV';

export default function Header({ onMenuClick }) {
  const { 
    activeTab, 
    activeFilterCount, 
    setIsFilterOpen, 
    filters, 
    updateFilter,
    resetFilters,
    filteredOrders,
    filteredReturns,
    filteredRefunds
  } = useAnalytics();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return { title: 'Executive Overview', desc: 'Holistic KPI performance, return ratios, and refund loss intelligence' };
      case 'returns': return { title: 'Returns Analysis', desc: 'Granular diagnosis of return reasons, product conditions, and return rates' };
      case 'refunds': return { title: 'Refund Analytics', desc: 'Financial refund tracking, settlement channels, and SLA duration' };
      case 'products': return { title: 'Product Analysis', desc: 'High-risk product identification, defect frequencies, and unit return rates' };
      case 'customers': return { title: 'Customer Analysis', desc: 'Cohort return behaviors, repeat offender profiling, and segment trends' };
      case 'geographic': return { title: 'Geographic Analysis', desc: 'Regional state & city breakdown of return hotspots and financial exposure' };
      case 'reports': return { title: 'Executive Reports & Insights', desc: 'Rule-based business insights, automated audit summaries, and downloads' };
      default: return { title: 'Analytics Dashboard', desc: 'E-commerce Returns & Refunds Intelligence' };
    }
  };

  const { title, desc } = getPageTitle();

  const handleExportSummary = () => {
    // Export combined analytical summary
    const summaryData = filteredOrders.slice(0, 1000).map(o => {
      const ret = filteredReturns.find(r => r.Order_ID === o.Order_ID);
      const ref = filteredRefunds.find(rf => rf.Order_ID === o.Order_ID);
      return {
        Order_ID: o.Order_ID,
        Order_Date: o.Order_Date,
        Customer_ID: o.Customer_ID,
        Product_Name: o.Product_Name,
        Category: o.Product_Category,
        Quantity: o.Quantity,
        Order_Amount: o.Order_Amount,
        Is_Returned: ret ? 'YES' : 'NO',
        Return_Reason: ret ? ret.Return_Reason : '-',
        Return_Status: ret ? ret.Return_Status : '-',
        Refund_Amount: ref ? ref.Refund_Amount : 0,
        Refund_Status: ref ? ref.Refund_Status : '-',
        State: o.State,
        City: o.City
      };
    });

    exportToCSV(summaryData, `OmniReturn_${activeTab}_export.csv`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              FY 2024 Audited
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">{desc}</p>
        </div>
      </div>

      {/* Right: Actions, Filters & Quick Exports */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Quick Search */}
        <div className="relative flex-1 sm:flex-initial sm:w-48 md:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search orders, SKU, city..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-700"
          />
        </div>

        {/* Global Filter Button */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
            activeFilterCount > 0 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Reset button if active */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Export Data Button */}
        <button
          onClick={handleExportSummary}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Report</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  );
}
