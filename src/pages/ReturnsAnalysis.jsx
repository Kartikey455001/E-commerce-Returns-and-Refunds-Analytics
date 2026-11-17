import React, { useMemo } from 'react';
import { 
  RotateCcw, 
  Percent, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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
import { formatNumber, formatPercent, formatDate } from '../utils/formatters';

const REASON_COLORS = ['#6366f1', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
const CONDITION_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

export default function ReturnsAnalysis() {
  const { kpis, deltas, filteredOrders, filteredReturns, rawProducts } = useAnalytics();

  // Create lookup for Product details
  const orderProductMap = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      map[o.Order_ID] = {
        name: o.Product_Name,
        category: o.Product_Category,
        unitPrice: o.Unit_Price
      };
    });
    return map;
  }, [filteredOrders]);

  // 1. Returns by Reason
  const reasonData = useMemo(() => {
    const counts = {};
    filteredReturns.forEach(r => {
      counts[r.Return_Reason] = (counts[r.Return_Reason] || 0) + 1;
    });
    return Object.entries(counts).map(([reason, count]) => ({
      reason,
      count,
      pct: filteredReturns.length > 0 ? ((count / filteredReturns.length) * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count);
  }, [filteredReturns]);

  // 2. Returns by Category
  const categoryData = useMemo(() => {
    const counts = {};
    filteredReturns.forEach(r => {
      const p = orderProductMap[r.Order_ID];
      const cat = p ? p.category : 'Unknown';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count);
  }, [filteredReturns, orderProductMap]);

  // 3. Monthly Return Trends
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ month: m, returns: 0, approved: 0, rejected: 0 }));

    filteredReturns.forEach(r => {
      const d = new Date(r.Return_Date);
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        data[mIdx].returns += 1;
        if (r.Return_Status === 'Approved') data[mIdx].approved += 1;
        if (r.Return_Status === 'Rejected') data[mIdx].rejected += 1;
      }
    });
    return data;
  }, [filteredReturns]);

  // 4. Product Condition Distribution
  const conditionData = useMemo(() => {
    const counts = {};
    filteredReturns.forEach(r => {
      counts[r.Product_Condition] = (counts[r.Product_Condition] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredReturns]);

  // 5. Top 10 Most Returned Products
  const topReturnedProducts = useMemo(() => {
    const counts = {};
    filteredReturns.forEach(r => {
      const p = orderProductMap[r.Order_ID];
      if (p) {
        counts[p.name] = (counts[p.name] || 0) + r.Returned_Quantity;
      }
    });

    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [filteredReturns, orderProductMap]);

  // 6. Return Status Distribution
  const statusData = useMemo(() => {
    const counts = {};
    filteredReturns.forEach(r => {
      counts[r.Return_Status] = (counts[r.Return_Status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredReturns]);

  // Table columns
  const tableColumns = [
    { key: 'Return_ID', label: 'Return ID' },
    { key: 'Order_ID', label: 'Order ID' },
    { 
      key: 'Product_Name', 
      label: 'Product Name',
      render: (_, row) => orderProductMap[row.Order_ID]?.name || '-'
    },
    { 
      key: 'Product_Category', 
      label: 'Category',
      render: (_, row) => orderProductMap[row.Order_ID]?.category || '-'
    },
    { key: 'Return_Reason', label: 'Return Reason' },
    { key: 'Returned_Quantity', label: 'Qty' },
    { key: 'Product_Condition', label: 'Condition' },
    { 
      key: 'Return_Date', 
      label: 'Return Date',
      render: (val) => formatDate(val)
    },
    { key: 'Return_Status', label: 'Status', isBadge: true }
  ];

  return (
    <div className="space-y-6">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Returns"
          value={formatNumber(kpis.returnedOrdersCount)}
          subtitle="Unique Returned Orders"
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
          title="Approved Returns"
          value={formatNumber(kpis.approvedReturns)}
          subtitle={`${((kpis.approvedReturns / (filteredReturns.length || 1)) * 100).toFixed(1)}% of requests`}
          icon={CheckCircle}
          color="emerald"
        />
        <KPICard
          title="Rejected Returns"
          value={formatNumber(kpis.rejectedReturns)}
          subtitle="Failed Inspection / Window"
          icon={XCircle}
          color="purple"
        />
        <KPICard
          title="Pending / In-Review"
          value={formatNumber(kpis.pendingReturns + kpis.processingReturns)}
          subtitle="Reverse Logistics Pipeline"
          icon={Clock}
          color="blue"
        />
      </div>

      {/* 2. Charts Row 1: Return Reasons & Top 10 Returned Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Returns by Reason */}
        <ChartCard
          title="Returns by Root Reason"
          subtitle="Primary driver behind reverse customer requests"
          badge="Pareto Root Causes"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reasonData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="reason" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip 
                formatter={(val) => [`${formatNumber(val)} returns`, 'Volume']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 10 Most Returned Products */}
        <ChartCard
          title="Top 10 Most Returned Products"
          subtitle="Highest cumulative returned units across catalog"
          badge="Actionable High-Risk SKU"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topReturnedProducts} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#475569' }} 
                axisLine={false} 
                tickLine={false} 
                width={130} 
                tickFormatter={(val) => val.length > 18 ? `${val.substring(0, 18)}...` : val}
              />
              <Tooltip 
                formatter={(val) => [`${val} Units Returned`, 'Quantity']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="qty" fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 3. Charts Row 2: Monthly Trends & Product Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Return Trend */}
        <ChartCard
          title="Monthly Return Velocity"
          subtitle="Monthly return volume trajectory"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }} />
              <Line type="monotone" dataKey="returns" name="Total Returns" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Product Condition Breakdown */}
        <ChartCard
          title="Product Condition at Inbound Inspection"
          subtitle="Physical state of received packages"
        >
          <div className="flex flex-col items-center justify-center w-full">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {conditionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CONDITION_COLORS[index % CONDITION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full text-xs space-y-1 mt-2">
              {conditionData.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CONDITION_COLORS[i % CONDITION_COLORS.length] }}></span>
                    <span className="text-slate-600 truncate">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{formatNumber(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 4. Detailed Returns Transaction Table */}
      <DataTable
        title="Returns Transaction Master Log"
        data={filteredReturns}
        columns={tableColumns}
        filename="returns_master_log.csv"
        searchPlaceholder="Search Return ID, Order ID, or reason..."
      />
    </div>
  );
}
