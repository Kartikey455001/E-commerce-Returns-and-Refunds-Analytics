import React, { useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Repeat, 
  Percent, 
  ShieldAlert, 
  Crown,
  HeartHandshake
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

import { useAnalytics } from '../context/AnalyticsContext';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

const SEGMENT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

export default function CustomerAnalysis() {
  const { kpis, filteredOrders, filteredReturns, filteredRefunds, rawCustomers } = useAnalytics();

  // Customer mapping
  const customerMap = useMemo(() => {
    const map = {};
    rawCustomers.forEach(c => { map[c.Customer_ID] = c; });
    return map;
  }, [rawCustomers]);

  // Build Customer behavioral profiles based on filtered orders
  const customerProfiles = useMemo(() => {
    const stats = {};

    filteredOrders.forEach(o => {
      const c = customerMap[o.Customer_ID] || {
        Customer_ID: o.Customer_ID,
        Customer_Name: 'Anonymous Shopper',
        Customer_Segment: 'Regular',
        City: o.City,
        State: o.State
      };

      if (!stats[o.Customer_ID]) {
        stats[o.Customer_ID] = {
          id: c.Customer_ID,
          name: c.Customer_Name,
          segment: c.Customer_Segment,
          gender: c.Gender || 'Female',
          ageGroup: c.Age_Group || '25-34',
          city: c.City,
          state: c.State,
          orders: 0,
          grossSpend: 0,
          returns: 0,
          unitsReturned: 0,
          refundAmount: 0
        };
      }
      stats[o.Customer_ID].orders += 1;
      stats[o.Customer_ID].grossSpend += o.Order_Amount;
    });

    // Returns mapping
    const orderCustomerLookup = {};
    filteredOrders.forEach(o => { orderCustomerLookup[o.Order_ID] = o.Customer_ID; });

    filteredReturns.forEach(r => {
      const custId = orderCustomerLookup[r.Order_ID];
      if (custId && stats[custId]) {
        stats[custId].returns += 1;
        stats[custId].unitsReturned += r.Returned_Quantity;
      }
    });

    // Refunds mapping
    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        const custId = orderCustomerLookup[rf.Order_ID];
        if (custId && stats[custId]) {
          stats[custId].refundAmount += rf.Refund_Amount;
        }
      }
    });

    return Object.values(stats).map(c => ({
      ...c,
      returnRate: c.orders > 0 ? Number(((c.returns / c.orders) * 100).toFixed(1)) : 0,
      isRepeatReturner: c.returns > 1
    }));
  }, [filteredOrders, filteredReturns, filteredRefunds, customerMap]);

  // 1. Customer Segment Analysis
  const segmentData = useMemo(() => {
    const segMap = {};
    customerProfiles.forEach(c => {
      if (!segMap[c.segment]) {
        segMap[c.segment] = { segment: c.segment, customers: 0, orders: 0, returns: 0, refunds: 0 };
      }
      segMap[c.segment].customers += 1;
      segMap[c.segment].orders += c.orders;
      segMap[c.segment].returns += c.returns;
      segMap[c.segment].refunds += c.refundAmount;
    });

    return Object.values(segMap).map(s => ({
      ...s,
      returnRate: s.orders > 0 ? Number(((s.returns / s.orders) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.returnRate - a.returnRate);
  }, [customerProfiles]);

  // 2. Return Frequency Distribution
  const frequencyData = useMemo(() => {
    const buckets = [
      { frequency: '0 Returns (Zero Friction)', count: 0 },
      { frequency: '1 Return (Single Incident)', count: 0 },
      { frequency: '2 Returns (Repeat Returner)', count: 0 },
      { frequency: '3+ Returns (Chronic Returner)', count: 0 }
    ];

    customerProfiles.forEach(c => {
      if (c.returns === 0) buckets[0].count += 1;
      else if (c.returns === 1) buckets[1].count += 1;
      else if (c.returns === 2) buckets[2].count += 1;
      else buckets[3].count += 1;
    });

    return buckets;
  }, [customerProfiles]);

  // 3. Top Customers by Refund Amount
  const topRefundCustomers = useMemo(() => {
    return [...customerProfiles]
      .filter(c => c.refundAmount > 0)
      .sort((a, b) => b.refundAmount - a.refundAmount);
  }, [customerProfiles]);

  const tableColumns = [
    { key: 'id', label: 'Customer ID' },
    { 
      key: 'name', 
      label: 'Customer Name',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{val}</span>
          <span className="text-[11px] text-slate-400">{row.city}, {row.state}</span>
        </div>
      )
    },
    { 
      key: 'segment', 
      label: 'Segment',
      render: (val) => {
        let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
        if (val === 'VIP') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
        if (val === 'Regular') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        if (val === 'Frequent Returner') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
            {val}
          </span>
        );
      }
    },
    { 
      key: 'orders', 
      label: 'Orders',
      render: (val) => formatNumber(val)
    },
    { 
      key: 'returns', 
      label: 'Returns',
      render: (val) => <span className="font-bold text-slate-900">{val}</span>
    },
    { 
      key: 'returnRate', 
      label: 'Return %',
      render: (val) => `${val}%`
    },
    { 
      key: 'grossSpend', 
      label: 'Total Orders Spend',
      render: (val) => formatCurrency(val)
    },
    { 
      key: 'refundAmount', 
      label: 'Total Refund Received',
      render: (val) => <span className="font-bold text-rose-700">{formatCurrency(val)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Customers"
          value={formatNumber(kpis.totalCustomers)}
          subtitle="Unique Purchasing Accounts"
          icon={Users}
          color="indigo"
        />
        <KPICard
          title="Returning Customers"
          value={formatNumber(kpis.customersWithReturns)}
          subtitle={`${formatPercent(kpis.customerReturnRate)} of customer base`}
          icon={UserCheck}
          color="rose"
        />
        <KPICard
          title="Repeat Returners"
          value={formatNumber(kpis.repeatReturnCustomers)}
          subtitle={`${formatPercent(kpis.repeatReturnRate)} of returning shoppers`}
          icon={Repeat}
          color="amber"
        />
        <KPICard
          title="Customer Return Rate"
          value={formatPercent(kpis.customerReturnRate)}
          subtitle="Shoppers with ≥ 1 Return"
          icon={Percent}
          color="purple"
        />
      </div>

      {/* Synthetic Data Disclaimer Note */}
      <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>
          ℹ️ <strong>Analytics Note:</strong> Customer profiles and demographic segments are based on synthetic e-commerce modeling representing Indian fashion shoppers.
        </span>
        <span className="font-semibold text-slate-600">Synthetic Cohort Engine</span>
      </div>

      {/* 2. Charts Row 1: Segment Return Rates & Frequency Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segment Return Rates */}
        <ChartCard
          title="Return Rate by Customer Segment (%)"
          subtitle="Analysis of return propensities across customer loyalty tiers"
          badge="Cohort Analysis"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={segmentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="segment" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val) => [`${val}%`, 'Return Rate']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="returnRate" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Return Frequency Breakdown */}
        <ChartCard
          title="Return Frequency Distribution"
          subtitle="How often individual customers trigger return requests"
          badge="Loyalty vs Friction"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={frequencyData} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="frequency" 
                tick={{ fontSize: 11, fill: '#475569' }} 
                axisLine={false} 
                tickLine={false} 
                width={130} 
              />
              <Tooltip 
                formatter={(val) => [`${formatNumber(val)} Customers`, 'Count']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3. Top Customers by Refund Amount Table */}
      <DataTable
        title="Top Customers by Cumulative Refund Disbursements"
        data={topRefundCustomers}
        columns={tableColumns}
        filename="top_refund_customers.csv"
        searchPlaceholder="Search customer name, ID, or city..."
      />
    </div>
  );
}
