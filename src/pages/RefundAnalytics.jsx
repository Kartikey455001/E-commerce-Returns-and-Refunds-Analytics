import React, { useMemo } from 'react';
import { 
  Banknote, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  Hourglass,
  CreditCard
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
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
import { formatCurrency, formatCompactCurrency, formatNumber, formatDate } from '../utils/formatters';

const METHOD_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'];

export default function RefundAnalytics() {
  const { kpis, deltas, filteredOrders, filteredRefunds } = useAnalytics();

  // Create lookup for Product / Order details
  const orderMap = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      map[o.Order_ID] = o;
    });
    return map;
  }, [filteredOrders]);

  // 1. Monthly Refund Trends
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ month: m, amount: 0, count: 0 }));

    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        const d = new Date(rf.Refund_Date);
        const mIdx = d.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          data[mIdx].amount += rf.Refund_Amount;
          data[mIdx].count += 1;
        }
      }
    });
    return data;
  }, [filteredRefunds]);

  // 2. Refund Amount by Product Category
  const categoryRefunds = useMemo(() => {
    const catMap = {};
    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        const ord = orderMap[rf.Order_ID];
        const cat = ord ? ord.Product_Category : 'Other';
        catMap[cat] = (catMap[cat] || 0) + rf.Refund_Amount;
      }
    });

    return Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredRefunds, orderMap]);

  // 3. Refund Method Analysis
  const methodData = useMemo(() => {
    const counts = {};
    const amounts = {};
    filteredRefunds.forEach(rf => {
      counts[rf.Refund_Method] = (counts[rf.Refund_Method] || 0) + 1;
      if (rf.Refund_Status === 'Completed') {
        amounts[rf.Refund_Method] = (amounts[rf.Refund_Method] || 0) + rf.Refund_Amount;
      }
    });

    return Object.keys(counts).map(method => ({
      name: method,
      count: counts[method],
      amount: amounts[method] || 0
    })).sort((a, b) => b.count - a.count);
  }, [filteredRefunds]);

  // 4. Processing Time Distribution (Histogram)
  const processingTimeData = useMemo(() => {
    const buckets = [
      { range: '1-2 Days', count: 0 },
      { range: '3-4 Days', count: 0 },
      { range: '5-6 Days', count: 0 },
      { range: '7-9 Days', count: 0 },
      { range: '10+ Days', count: 0 }
    ];

    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        const days = rf.Processing_Days || 1;
        if (days <= 2) buckets[0].count += 1;
        else if (days <= 4) buckets[1].count += 1;
        else if (days <= 6) buckets[2].count += 1;
        else if (days <= 9) buckets[3].count += 1;
        else buckets[4].count += 1;
      }
    });
    return buckets;
  }, [filteredRefunds]);

  // 5. Refund Status Breakdown
  const statusData = useMemo(() => {
    const counts = {};
    filteredRefunds.forEach(rf => {
      counts[rf.Refund_Status] = (counts[rf.Refund_Status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredRefunds]);

  // Table columns
  const tableColumns = [
    { key: 'Refund_ID', label: 'Refund ID' },
    { key: 'Order_ID', label: 'Order ID' },
    { 
      key: 'Product_Name', 
      label: 'Product',
      render: (_, row) => orderMap[row.Order_ID]?.Product_Name || '-'
    },
    { 
      key: 'Refund_Amount', 
      label: 'Amount (₹)',
      render: (val) => <span className="font-bold text-slate-900">{formatCurrency(val)}</span>
    },
    { key: 'Refund_Method', label: 'Settlement Method' },
    { 
      key: 'Processing_Days', 
      label: 'Turnaround',
      render: (val) => `${val} days`
    },
    { 
      key: 'Refund_Date', 
      label: 'Refund Date',
      render: (val) => formatDate(val)
    },
    { key: 'Refund_Status', label: 'Status', isBadge: true }
  ];

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Refund Paid"
          value={formatCompactCurrency(kpis.totalRefundAmount)}
          subtitle="Realized Financial Loss"
          icon={Banknote}
          delta={deltas.refundDelta}
          deltaType="lowerIsBetter"
          color="rose"
        />
        <KPICard
          title="Completed Refunds"
          value={formatNumber(kpis.completedRefundsCount)}
          subtitle="Settled Disbursements"
          icon={CheckCircle2}
          color="emerald"
        />
        <KPICard
          title="Pending Settlement"
          value={formatNumber(kpis.pendingRefunds + kpis.approvedRefunds)}
          subtitle="In Banking Queue"
          icon={Hourglass}
          color="amber"
        />
        <KPICard
          title="Average Refund Ticket"
          value={formatCurrency(kpis.averageRefundAmount)}
          subtitle="Per Approved Claim"
          icon={TrendingDown}
          color="blue"
        />
        <KPICard
          title="Average Processing SLA"
          value={`${kpis.averageProcessingDays.toFixed(1)} Days`}
          subtitle="Return to Settlement Cycle"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* 2. Charts Row 1: Monthly Trend & Category Refund Amounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Refund Amount */}
        <ChartCard
          title="Monthly Refund Disbursements (₹)"
          subtitle="Total completed refund capital disbursed month-over-month"
          badge="Cash Outflow"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="refundFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => formatCompactCurrency(val)} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val) => [formatCurrency(val), 'Disbursed']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="amount" name="Refund Amount" stroke="#ef4444" fillOpacity={1} fill="url(#refundFlow)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category-wise Refund Amount */}
        <ChartCard
          title="Total Refund Loss by Product Category"
          subtitle="Aggregate financial refund payouts per jewelry department"
          badge="Exposure by Line"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryRefunds} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(val) => formatCompactCurrency(val)} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip 
                formatter={(val) => [formatCurrency(val), 'Refund Loss']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3. Charts Row 2: Method & Turnaround Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refund Method Analysis */}
        <ChartCard
          title="Refund Disbursement Channels"
          subtitle="Payment mechanisms chosen for returning funds"
          badge="Settlement Channels"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between w-full">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {methodData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name, entry) => [`${formatNumber(val)} tickets (${formatCompactCurrency(entry.payload.amount)})`, 'Volume']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full sm:w-60 text-xs space-y-2 pl-2">
              {methodData.map((m, i) => (
                <div key={m.name} className="flex flex-col p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: METHOD_COLORS[i % METHOD_COLORS.length] }}></span>
                      <span className="font-semibold text-slate-700 truncate">{m.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatNumber(m.count)}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium pl-4">
                    {formatCurrency(m.amount)} paid
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Processing Turnaround SLA */}
        <ChartCard
          title="Refund Turnaround Time Distribution"
          subtitle="Days elapsed between return authorization and bank clearance"
          badge="SLA Performance"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={processingTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val) => [`${formatNumber(val)} transactions`, 'Count']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 4. Searchable & Filterable Transactions Table */}
      <DataTable
        title="Refund Disbursements Audit Ledger"
        data={filteredRefunds}
        columns={tableColumns}
        filename="refund_transactions_ledger.csv"
        searchPlaceholder="Search Refund ID, Order ID, or settlement method..."
      />
    </div>
  );
}
