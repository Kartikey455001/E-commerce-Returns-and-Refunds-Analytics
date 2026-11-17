import React, { useMemo, useState } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  Building2, 
  Globe2, 
  Compass,
  ArrowUpDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

import { useAnalytics } from '../context/AnalyticsContext';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { formatCurrency, formatCompactCurrency, formatPercent, formatNumber } from '../utils/formatters';

export default function GeographicAnalysis() {
  const { filteredOrders, filteredReturns, filteredRefunds } = useAnalytics();
  const [metricMode, setMetricMode] = useState('returnRate'); // 'returnRate' or 'returns' or 'refunds'

  // Map state to region
  const stateRegionMap = {
    'Maharashtra': 'West',
    'Gujarat': 'West',
    'Delhi': 'North',
    'Rajasthan': 'North',
    'Uttar Pradesh': 'North',
    'Punjab': 'North',
    'Karnataka': 'South',
    'Telangana': 'South',
    'Tamil Nadu': 'South',
    'Kerala': 'South',
    'West Bengal': 'East',
    'Madhya Pradesh': 'Central'
  };

  // State-wise aggregated analytics
  const stateStats = useMemo(() => {
    const stats = {};

    filteredOrders.forEach(o => {
      const st = o.State || 'Unknown';
      if (!stats[st]) {
        stats[st] = {
          state: st,
          region: stateRegionMap[st] || 'Other',
          orders: 0,
          revenue: 0,
          returns: 0,
          refunds: 0
        };
      }
      stats[st].orders += 1;
      stats[st].revenue += o.Order_Amount;
    });

    // Returns
    const returnOrderMap = {};
    filteredReturns.forEach(r => { returnOrderMap[r.Order_ID] = true; });

    filteredOrders.forEach(o => {
      const st = o.State || 'Unknown';
      if (stats[st] && returnOrderMap[o.Order_ID]) {
        stats[st].returns += 1;
      }
    });

    // Refunds
    const refundOrderMap = {};
    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        refundOrderMap[rf.Order_ID] = (refundOrderMap[rf.Order_ID] || 0) + rf.Refund_Amount;
      }
    });

    filteredOrders.forEach(o => {
      const st = o.State || 'Unknown';
      if (stats[st] && refundOrderMap[o.Order_ID]) {
        stats[st].refunds += refundOrderMap[o.Order_ID];
      }
    });

    return Object.values(stats).map(s => ({
      ...s,
      returnRate: s.orders > 0 ? Number(((s.returns / s.orders) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.returns - a.returns);
  }, [filteredOrders, filteredReturns, filteredRefunds]);

  // City-wise aggregated analytics
  const cityStats = useMemo(() => {
    const stats = {};

    filteredOrders.forEach(o => {
      const city = o.City || 'Unknown';
      if (!stats[city]) {
        stats[city] = {
          city,
          state: o.State,
          orders: 0,
          revenue: 0,
          returns: 0,
          refunds: 0
        };
      }
      stats[city].orders += 1;
      stats[city].revenue += o.Order_Amount;
    });

    const returnOrderMap = {};
    filteredReturns.forEach(r => { returnOrderMap[r.Order_ID] = true; });

    const refundOrderMap = {};
    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        refundOrderMap[rf.Order_ID] = (refundOrderMap[rf.Order_ID] || 0) + rf.Refund_Amount;
      }
    });

    filteredOrders.forEach(o => {
      const city = o.City || 'Unknown';
      if (stats[city]) {
        if (returnOrderMap[o.Order_ID]) stats[city].returns += 1;
        if (refundOrderMap[o.Order_ID]) stats[city].refunds += refundOrderMap[o.Order_ID];
      }
    });

    return Object.values(stats).map(c => ({
      ...c,
      returnRate: c.orders > 0 ? Number(((c.returns / c.orders) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.refunds - a.refunds);
  }, [filteredOrders, filteredReturns, filteredRefunds]);

  // Regional analysis
  const regionalData = useMemo(() => {
    const regMap = {};
    stateStats.forEach(s => {
      if (!regMap[s.region]) {
        regMap[s.region] = { region: s.region, orders: 0, returns: 0, refunds: 0, revenue: 0 };
      }
      regMap[s.region].orders += s.orders;
      regMap[s.region].returns += s.returns;
      regMap[s.region].refunds += s.refunds;
      regMap[s.region].revenue += s.revenue;
    });

    return Object.values(regMap).map(r => ({
      ...r,
      returnRate: r.orders > 0 ? Number(((r.returns / r.orders) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.returnRate - a.returnRate);
  }, [stateStats]);

  const topStatesByReturns = [...stateStats].sort((a, b) => b.returns - a.returns).slice(0, 10);
  const topStatesByRate = [...stateStats].sort((a, b) => b.returnRate - a.returnRate).slice(0, 10);

  const tableColumns = [
    { key: 'state', label: 'State' },
    { key: 'region', label: 'Region' },
    { key: 'orders', label: 'Orders Placed', render: (val) => formatNumber(val) },
    { key: 'returns', label: 'Returns', render: (val) => <span className="font-bold text-slate-900">{formatNumber(val)}</span> },
    { key: 'returnRate', label: 'Return Rate', render: (val) => <span className="font-bold text-rose-600">{val}%</span> },
    { key: 'revenue', label: 'Gross Revenue', render: (val) => formatCurrency(val) },
    { key: 'refunds', label: 'Completed Refunds', render: (val) => <span className="font-bold text-slate-900">{formatCurrency(val)}</span> }
  ];

  const cityTableColumns = [
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'orders', label: 'Orders', render: (val) => formatNumber(val) },
    { key: 'returns', label: 'Returns', render: (val) => <span className="font-bold text-slate-900">{val}</span> },
    { key: 'returnRate', label: 'Return %', render: (val) => `${val}%` },
    { key: 'refunds', label: 'Total Refund Loss', render: (val) => <span className="font-bold text-rose-700">{formatCurrency(val)}</span> }
  ];

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Markets (States)"
          value={`${stateStats.length} States`}
          subtitle="All Major Indian Territories"
          icon={Compass}
          color="indigo"
        />
        <KPICard
          title="Top Return State"
          value={topStatesByReturns[0]?.state || '-'}
          subtitle={`${topStatesByReturns[0]?.returns || 0} returned orders`}
          icon={MapPin}
          color="rose"
        />
        <KPICard
          title="Highest Return Rate"
          value={`${topStatesByRate[0]?.returnRate || 0}%`}
          subtitle={topStatesByRate[0]?.state || '-'}
          icon={TrendingUp}
          color="amber"
        />
        <KPICard
          title="Top Metro by Refunds"
          value={cityStats[0]?.city || '-'}
          subtitle={formatCurrency(cityStats[0]?.refunds || 0)}
          icon={Building2}
          color="purple"
        />
      </div>

      {/* 2. Charts Row 1: State-wise Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Return Rates */}
        <ChartCard
          title="State-wise Return Rate Benchmark (%)"
          subtitle="Percentage of placed orders resulting in return requests by state"
          badge="State Performance"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stateStats} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip 
                formatter={(val) => [`${val}%`, 'Return Rate']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="returnRate" fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 10 States by Absolute Returns Volume */}
        <ChartCard
          title="Top 10 States by Return Volume"
          subtitle="States generating the highest absolute return logistics workload"
          badge="Logistics Hubs"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topStatesByReturns} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip 
                formatter={(val) => [`${formatNumber(val)} Returns`, 'Returns']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="returns" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3. Charts Row 2: Sales vs Returns Comparison & Regional Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Return Volume by State */}
        <ChartCard
          title="Orders vs Returns by State"
          subtitle="Direct comparison between gross sales volume and reverse tickets"
          badge="Conversion vs Reversal"
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={stateStats.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="state" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="orders" name="Orders Placed" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="returns" name="Returns" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Regional Return Trends */}
        <ChartCard
          title="Regional Return Rates (%)"
          subtitle="Aggregated return propensities across Indian macroeconomic zones"
          badge="Regional Macro"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val) => [`${val}%`, 'Return Rate']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="returnRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 4. State & City Audit Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="State Performance Summary"
          data={stateStats}
          columns={tableColumns}
          filename="state_performance_summary.csv"
          searchPlaceholder="Search state or region..."
        />
        <DataTable
          title="City-wise Refund Losses"
          data={cityStats}
          columns={cityTableColumns}
          filename="city_refund_losses.csv"
          searchPlaceholder="Search city name..."
        />
      </div>
    </div>
  );
}
