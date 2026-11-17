import React, { useMemo } from 'react';
import { 
  ShoppingBag, 
  RotateCcw, 
  Percent, 
  Banknote, 
  TrendingDown, 
  CheckCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

import { useAnalytics } from '../context/AnalyticsContext';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import InsightCard from '../components/InsightCard';
import { formatCurrency, formatCompactCurrency, formatPercent, formatNumber } from '../utils/formatters';

const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function Overview() {
  const { kpis, deltas, insights, filteredOrders, filteredReturns, filteredRefunds, setActiveTab } = useAnalytics();

  // 1. Monthly Orders vs Returned Orders
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map((m, idx) => ({
      month: m,
      monthNum: idx,
      orders: 0,
      returns: 0,
      refunds: 0,
      returnRate: 0
    }));

    const returnOrderMap = {};
    filteredReturns.forEach(r => { returnOrderMap[r.Order_ID] = true; });

    filteredOrders.forEach(o => {
      const d = new Date(o.Order_Date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        data[mIdx].orders += 1;
        if (returnOrderMap[o.Order_ID]) {
          data[mIdx].returns += 1;
        }
      }
    });

    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        const d = new Date(rf.Refund_Date);
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          data[mIdx].refunds += rf.Refund_Amount;
        }
      }
    });

    data.forEach(d => {
      d.returnRate = d.orders > 0 ? Number(((d.returns / d.orders) * 100).toFixed(1)) : 0;
    });

    return data;
  }, [filteredOrders, filteredReturns, filteredRefunds]);

  // 2. Returns by Product Category
  const categoryData = useMemo(() => {
    const catMap = {};
    const returnOrderMap = {};
    filteredReturns.forEach(r => { returnOrderMap[r.Order_ID] = true; });

    filteredOrders.forEach(o => {
      if (!catMap[o.Product_Category]) {
        catMap[o.Product_Category] = { category: o.Product_Category, orders: 0, returns: 0 };
      }
      catMap[o.Product_Category].orders += 1;
      if (returnOrderMap[o.Order_ID]) {
        catMap[o.Product_Category].returns += 1;
      }
    });

    return Object.values(catMap).map(c => ({
      ...c,
      returnRate: c.orders > 0 ? Number(((c.returns / c.orders) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.returns - a.returns);
  }, [filteredOrders, filteredReturns]);

  // 3. Return Reasons Distribution
  const reasonData = useMemo(() => {
    const rMap = {};
    filteredReturns.forEach(r => {
      rMap[r.Return_Reason] = (rMap[r.Return_Reason] || 0) + 1;
    });
    return Object.entries(rMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredReturns]);

  // 4. Refund Status Distribution
  const refundStatusData = useMemo(() => {
    const sMap = {};
    filteredRefunds.forEach(rf => {
      sMap[rf.Refund_Status] = (sMap[rf.Refund_Status] || 0) + 1;
    });
    return Object.entries(sMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRefunds]);

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-slate-300">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold flex items-center justify-between gap-4">
              <span>{entry.name}:</span>
              <span>
                {entry.name.includes('Amount') || entry.name.includes('Refund') 
                  ? formatCurrency(entry.value)
                  : entry.name.includes('Rate') 
                  ? `${entry.value}%` 
                  : formatNumber(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Orders"
          value={formatNumber(kpis.totalOrders)}
          subtitle="All Sales Channels"
          icon={ShoppingBag}
          delta={deltas.ordersDelta}
          color="indigo"
        />
        <KPICard
          title="Returned Orders"
          value={formatNumber(kpis.returnedOrdersCount)}
          subtitle={`${formatPercent(kpis.returnRate)} of orders`}
          icon={RotateCcw}
          delta={deltas.returnsDelta}
          deltaType="lowerIsBetter"
          color="rose"
        />
        <KPICard
          title="Return Rate"
          value={formatPercent(kpis.returnRate)}
          subtitle="Orders Return %"
          icon={Percent}
          delta={deltas.returnRateDelta}
          deltaType="lowerIsBetter"
          color="amber"
        />
        <KPICard
          title="Total Refund"
          value={formatCompactCurrency(kpis.totalRefundAmount)}
          subtitle={`${kpis.completedRefundsCount} fulfilled`}
          icon={Banknote}
          delta={deltas.refundDelta}
          deltaType="lowerIsBetter"
          color="purple"
        />
        <KPICard
          title="Avg Refund Value"
          value={formatCurrency(kpis.averageRefundAmount)}
          subtitle="Per Completed Ticket"
          icon={TrendingDown}
          color="blue"
        />
        <KPICard
          title="Refund Completion"
          value={formatPercent(kpis.refundCompletionRate)}
          subtitle={`Avg SLA: ${kpis.averageProcessingDays.toFixed(1)} days`}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* 2. Rule-Based Executive Insights Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                Rule-Based Automated Intelligence & Executive Highlights
              </h3>
              <p className="text-xs text-indigo-200">
                Dynamically calculated from {formatNumber(kpis.totalOrders)} orders and {formatNumber(kpis.returnedOrdersCount)} returns
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors self-start md:self-auto"
          >
            <span>Full Insights Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.slice(0, 3).map((insight) => (
            <div key={insight.id} className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                  {insight.title.split(':')[0]}
                </span>
              </div>
              <p className="text-xs font-semibold text-white mb-1">{insight.title}</p>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2">{insight.description}</p>
              <p className="text-[11px] text-emerald-300 font-medium bg-emerald-950/40 p-1.5 rounded border border-emerald-800/30">
                💡 {insight.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Charts Row 1: Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Orders vs Returns */}
        <ChartCard
          title="Monthly Orders vs Returned Orders"
          subtitle="Volume comparison of gross sales orders and initiated returns"
          badge="12-Month Trend"
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="returns" name="Returned Orders" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Return Rate Trend */}
        <ChartCard
          title="Monthly Return Rate Trend (%)"
          subtitle="Percentage of placed orders resulting in return requests"
          badge="Target < 15%"
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="returnRate" name="Return Rate %" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 4. Charts Row 2: Financial Refund Trend & Returns by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refund Amount Trend */}
        <ChartCard
          title="Refund Payout Trend (₹)"
          subtitle="Completed monthly cash outflows incurred due to accepted returns"
          badge="Financial Loss"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="refundColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => formatCompactCurrency(val)} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Area type="monotone" dataKey="refunds" name="Completed Refunds" stroke="#8b5cf6" fillOpacity={1} fill="url(#refundColor)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Returns by Category */}
        <ChartCard
          title="Returns by Product Category"
          subtitle="Distribution of returns across the 8 fashion & jewellery lines"
          badge="Category Breakdown"
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="returns" name="Returned Orders" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 5. Charts Row 3: Return Reasons & Refund Status Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Return Reasons Donut */}
        <ChartCard
          title="Return Reasons Distribution"
          subtitle="Root causes articulated by customers upon filing return requests"
          badge="Voice of Customer"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between w-full">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={customTooltip} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full sm:w-60 text-xs space-y-1.5 pl-2">
              {reasonData.slice(0, 5).map((r, i) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                    <span className="text-slate-600 truncate">{r.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 ml-2">{formatNumber(r.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Refund Status Distribution */}
        <ChartCard
          title="Refund Status Distribution"
          subtitle="Breakdown of refund disbursements across all processing phases"
          badge="Settlement Pipeline"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between w-full">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={refundStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {refundStatusData.map((entry, index) => {
                    let color = '#10b981'; // Completed
                    if (entry.name === 'Pending') color = '#f59e0b';
                    if (entry.name === 'Approved') color = '#3b82f6';
                    if (entry.name === 'Rejected') color = '#ef4444';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip content={customTooltip} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full sm:w-56 text-xs space-y-2 pl-2">
              {refundStatusData.map((s) => {
                let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (s.name === 'Pending') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                if (s.name === 'Approved') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                if (s.name === 'Rejected') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div key={s.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {s.name}
                    </span>
                    <span className="font-bold text-slate-800">{formatNumber(s.value)} tickets</span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
