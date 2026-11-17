import React, { useState } from 'react';
import { AnalyticsProvider, useAnalytics } from './context/AnalyticsContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';

import Overview from './pages/Overview';
import ReturnsAnalysis from './pages/ReturnsAnalysis';
import RefundAnalytics from './pages/RefundAnalytics';
import ProductAnalysis from './pages/ProductAnalysis';
import CustomerAnalysis from './pages/CustomerAnalysis';
import GeographicAnalysis from './pages/GeographicAnalysis';
import Reports from './pages/Reports';

function DashboardContent() {
  const { activeTab } = useAnalytics();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'returns': return <ReturnsAnalysis />;
      case 'refunds': return <RefundAnalytics />;
      case 'products': return <ProductAnalysis />;
      case 'customers': return <CustomerAnalysis />;
      case 'geographic': return <GeographicAnalysis />;
      case 'reports': return <Reports />;
      default: return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>

        <footer className="py-4 px-6 sm:px-8 border-t border-slate-200/80 text-center text-xs text-slate-400 bg-white/50">
          <p>© 2024 OmniReturn Analytics • E-commerce Returns & Refunds Intelligence • Static Frontend Architecture</p>
        </footer>
      </div>

      {/* Global Filter Slide-Over Drawer */}
      <FilterPanel />
    </div>
  );
}

export default function App() {
  return (
    <AnalyticsProvider>
      <DashboardContent />
    </AnalyticsProvider>
  );
}
