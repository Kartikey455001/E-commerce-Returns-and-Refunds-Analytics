import React, { createContext, useContext, useState, useMemo } from 'react';
import rawOrders from '../data/orders.json';
import rawReturns from '../data/returns.json';
import rawRefunds from '../data/refunds.json';
import rawProducts from '../data/products.json';
import rawCustomers from '../data/customers.json';

import { applyFilters } from '../utils/filters';
import { calculateKPIs, calculateComparisonDeltas, generateBusinessInsights } from '../utils/calculations';

const AnalyticsContext = createContext();

const initialFilters = {
  dateRange: { start: '', end: '' },
  category: 'All',
  product: 'All',
  returnReason: 'All',
  returnStatus: 'All',
  refundStatus: 'All',
  state: 'All',
  salesChannel: 'All',
  searchQuery: ''
};

export function AnalyticsProvider({ children }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Available unique options for filter dropdowns
  const filterOptions = useMemo(() => {
    const categories = ['All', ...new Set(rawProducts.map(p => p.Product_Category))].sort();
    const products = ['All', ...new Set(rawProducts.map(p => p.Product_Name))].sort();
    const returnReasons = ['All', ...new Set(rawReturns.map(r => r.Return_Reason))].sort();
    const returnStatuses = ['All', ...new Set(rawReturns.map(r => r.Return_Status))].sort();
    const refundStatuses = ['All', ...new Set(rawRefunds.map(r => r.Refund_Status))].sort();
    const states = ['All', ...new Set(rawOrders.map(o => o.State))].sort();
    const salesChannels = ['All', ...new Set(rawOrders.map(o => o.Sales_Channel))].sort();

    return {
      categories,
      products,
      returnReasons,
      returnStatuses,
      refundStatuses,
      states,
      salesChannels
    };
  }, []);

  // Filtered dataset memoization
  const { filteredOrders, filteredReturns, filteredRefunds } = useMemo(() => {
    return applyFilters(rawOrders, rawReturns, rawRefunds, filters);
  }, [filters]);

  // KPIs memoization
  const kpis = useMemo(() => {
    return calculateKPIs(filteredOrders, filteredReturns, filteredRefunds, rawCustomers);
  }, [filteredOrders, filteredReturns, filteredRefunds]);

  // Comparison deltas memoization
  const deltas = useMemo(() => {
    return calculateComparisonDeltas(filteredOrders, filteredReturns, filteredRefunds);
  }, [filteredOrders, filteredReturns, filteredRefunds]);

  // Business Insights memoization
  const insights = useMemo(() => {
    return generateBusinessInsights(filteredOrders, filteredReturns, filteredRefunds, rawProducts);
  }, [filteredOrders, filteredReturns, filteredRefunds]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count++;
    if (filters.product !== 'All') count++;
    if (filters.returnReason !== 'All') count++;
    if (filters.returnStatus !== 'All') count++;
    if (filters.refundStatus !== 'All') count++;
    if (filters.state !== 'All') count++;
    if (filters.salesChannel !== 'All') count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  const value = {
    // Raw Datasets
    rawOrders,
    rawReturns,
    rawRefunds,
    rawProducts,
    rawCustomers,

    // Filtered Datasets
    filteredOrders,
    filteredReturns,
    filteredRefunds,

    // Metrics & Insights
    kpis,
    deltas,
    insights,

    // Navigation & Filters
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    filterOptions,
    activeFilterCount,
    isFilterOpen,
    setIsFilterOpen
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
