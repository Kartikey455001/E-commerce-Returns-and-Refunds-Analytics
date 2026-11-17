import React, { useMemo, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  BarChart3,
  Search
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  ComposedChart, 
  Line, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

import { useAnalytics } from '../context/AnalyticsContext';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { formatCurrency, formatCompactCurrency, formatPercent, formatNumber } from '../utils/formatters';

export default function ProductAnalysis() {
  const { filteredOrders, filteredReturns, filteredRefunds, rawProducts } = useAnalytics();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Compute rich product performance analytics
  const productPerformance = useMemo(() => {
    const stats = {};

    // Initialize with all products
    rawProducts.forEach(p => {
      stats[p.Product_ID] = {
        id: p.Product_ID,
        name: p.Product_Name,
        category: p.Product_Category,
        price: p.Product_Price,
        brand: p.Brand,
        supplier: p.Supplier_Name,
        orders: 0,
        unitsOrdered: 0,
        revenue: 0,
        returns: 0,
        unitsReturned: 0,
        defectReturns: 0,
        fitReturns: 0,
        refundAmount: 0
      };
    });

    const returnOrderMap = {};
    filteredReturns.forEach(r => {
      returnOrderMap[r.Order_ID] = r;
    });

    const refundOrderMap = {};
    filteredRefunds.forEach(rf => {
      if (rf.Refund_Status === 'Completed') {
        refundOrderMap[rf.Order_ID] = (refundOrderMap[rf.Order_ID] || 0) + rf.Refund_Amount;
      }
    });

    // Populate order metrics
    filteredOrders.forEach(o => {
      const p = stats[o.Product_ID];
      if (p) {
        p.orders += 1;
        p.unitsOrdered += o.Quantity;
        p.revenue += o.Order_Amount;

        const ret = returnOrderMap[o.Order_ID];
        if (ret) {
          p.returns += 1;
          p.unitsReturned += ret.Returned_Quantity;
          if (ret.Return_Reason === 'Damaged Product' || ret.Return_Reason === 'Quality Issues') {
            p.defectReturns += 1;
          }
          if (ret.Return_Reason === 'Size or Fit Issues') {
            p.fitReturns += 1;
          }
        }

        if (refundOrderMap[o.Order_ID]) {
          p.refundAmount += refundOrderMap[o.Order_ID];
        }
      }
    });

    return Object.values(stats)
      .map(p => {
        const returnRate = p.orders > 0 ? (p.returns / p.orders) * 100 : 0;
        const unitReturnRate = p.unitsOrdered > 0 ? (p.unitsReturned / p.unitsOrdered) * 100 : 0;
        const refundToRevenueRatio = p.revenue > 0 ? (p.refundAmount / p.revenue) * 100 : 0;
        const isAnomalous = returnRate > 22 || unitReturnRate > 22;

        return {
          ...p,
          returnRate: Number(returnRate.toFixed(1)),
          unitReturnRate: Number(unitReturnRate.toFixed(1)),
          refundToRevenueRatio: Number(refundToRevenueRatio.toFixed(1)),
          isAnomalous
        };
      })
      .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
      .sort((a, b) => b.unitsReturned - a.unitsReturned);
  }, [rawProducts, filteredOrders, filteredReturns, filteredRefunds, selectedCategory]);

  // Category summary
  const categoryRates = useMemo(() => {
    const catMap = {};
    productPerformance.forEach(p => {
      if (!catMap[p.category]) {
        catMap[p.category] = { category: p.category, orders: 0, returns: 0, revenue: 0, refunds: 0 };
      }
      catMap[p.category].orders += p.orders;
      catMap[p.category].returns += p.returns;
      catMap[p.category].revenue += p.revenue;
      catMap[p.category].refunds += p.refundAmount;
    });

    return Object.values(catMap).map(c => ({
      ...c,
      returnRate: c.orders > 0 ? Number(((c.returns / c.orders) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.returnRate - a.returnRate);
  }, [productPerformance]);

  // Scatter data: Revenue vs Return Rate
  const scatterData = useMemo(() => {
    return productPerformance.filter(p => p.orders > 0).map(p => ({
      name: p.name,
      category: p.category,
      revenue: p.revenue,
      returnRate: p.returnRate,
      unitsReturned: p.unitsReturned
    }));
  }, [productPerformance]);

  // Categories list
  const categoryList = useMemo(() => {
    return ['All', ...new Set(rawProducts.map(p => p.Product_Category))].sort();
  }, [rawProducts]);

  const anomalousProducts = productPerformance.filter(p => p.isAnomalous);

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700 max-w-xs">
          <p className="font-bold text-slate-200">{data.name}</p>
          <p className="text-slate-400 font-medium">Category: {data.category}</p>
          <div className="pt-1.5 border-t border-slate-700/80 space-y-0.5">
            <p className="flex justify-between gap-4 text-emerald-400">
              <span>Gross Sales:</span>
              <span className="font-bold">{formatCurrency(data.revenue)}</span>
            </p>
            <p className="flex justify-between gap-4 text-rose-400">
              <span>Return Rate:</span>
              <span className="font-bold">{data.returnRate}%</span>
            </p>
            <p className="flex justify-between gap-4 text-amber-400">
              <span>Returned Units:</span>
              <span className="font-bold">{data.unitsReturned} pcs</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const tableColumns = [
    { key: 'id', label: 'SKU ID' },
    { 
      key: 'name', 
      label: 'Product Name',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{val}</span>
          <span className="text-[11px] text-slate-400">{row.brand} • {row.category}</span>
        </div>
      )
    },
    { 
      key: 'price', 
      label: 'Unit Price',
      render: (val) => formatCurrency(val)
    },
    { 
      key: 'orders', 
      label: 'Orders',
      render: (val) => formatNumber(val)
    },
    { 
      key: 'unitsReturned', 
      label: 'Returned Units',
      render: (val) => <span className="font-bold text-slate-900">{val}</span>
    },
    { 
      key: 'returnRate', 
      label: 'Order Return %',
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${val > 22 ? 'text-rose-600' : 'text-slate-700'}`}>
            {val}%
          </span>
          {row.isAnomalous && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
              HIGH RISK
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'defectReturns', 
      label: 'Defect Returns',
      render: (val) => (
        <span className={val > 10 ? 'font-bold text-amber-600' : 'text-slate-600'}>
          {val}
        </span>
      )
    },
    { 
      key: 'refundAmount', 
      label: 'Refund Loss',
      render: (val) => <span className="font-bold text-rose-700">{formatCurrency(val)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Category Pills Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">Filter Category:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {categoryList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly Alert Callout */}
      {anomalousProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 tracking-tight">
              Quality & Sizing Risk Anomaly: {anomalousProducts.length} Products Exceed 22% Return Rate
            </h4>
            <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
              Products like <span className="font-semibold">{anomalousProducts.slice(0, 3).map(p => p.name).join(', ')}</span> exhibit severe reverse logistics friction caused predominantly by customer sizing variance and transit delicate fragility.
            </p>
          </div>
        </div>
      )}

      {/* 1. Charts Row 1: Category Return Rates & Top 10 High-Risk Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Return Rate */}
        <ChartCard
          title="Category-wise Return Rate Benchmark (%)"
          subtitle="Proportion of orders resulting in reverse logistics tickets"
          badge="Category Risk Index"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryRates} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip 
                formatter={(val) => [`${val}%`, 'Return Rate']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Bar dataKey="returnRate" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 10 Most Returned Products */}
        <ChartCard
          title="Top 10 Most Returned Products (Units)"
          subtitle="Products responsible for highest reverse logistics volume"
          badge="Product Volume Offender"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={productPerformance.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 20, left: 35, bottom: 0 }}>
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
              <Bar dataKey="unitsReturned" fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2. Charts Row 2: Revenue vs Return Rate Scatter Plot */}
      <ChartCard
        title="Product Revenue vs Return Rate Analysis"
        subtitle="Identifies high-revenue jewelry lines generating disproportionate return liabilities"
        badge="Quadrant Exposure Analysis"
      >
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              dataKey="revenue" 
              name="Gross Sales" 
              tickFormatter={(val) => formatCompactCurrency(val)} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Gross Sales Revenue (₹)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#94a3b8' }}
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              type="number" 
              dataKey="returnRate" 
              name="Return Rate" 
              unit="%" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Return Rate (%)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#94a3b8' }}
              axisLine={false} 
              tickLine={false} 
            />
            <ZAxis type="number" dataKey="unitsReturned" range={[50, 400]} name="Units Returned" />
            <Tooltip content={customTooltip} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Products" data={scatterData} fill="#6366f1" />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Detailed Product Performance Table */}
      <DataTable
        title="Product Performance & Quality Matrix"
        data={productPerformance}
        columns={tableColumns}
        filename="product_performance_analytics.csv"
        searchPlaceholder="Search product name, SKU ID, or brand..."
      />
    </div>
  );
}
