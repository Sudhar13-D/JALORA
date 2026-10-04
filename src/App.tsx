import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { DemoController } from './components/demo/DemoController';
import { OverviewPage } from './pages/OverviewPage';
import { HouseholdsPage } from './pages/HouseholdsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { CitizenReportsPage } from './pages/CitizenReportsPage';
import { WaterQualityPage } from './pages/WaterQualityPage';
import { MaintenanceRiskPage } from './pages/MaintenanceRiskPage';
import { IntegrationPage } from './pages/IntegrationPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatePage } from './pages/StatePage';
import { VillagerPage } from './pages/VillagerPage';

export const App: React.FC = () => {
  const { role, activeTab, isPlaying, advanceSimulatedTime, speed } = useAppStore();
  const [isDemoControllerOpen, setIsDemoControllerOpen] = useState(false);

  // Simulated clock ticker when isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;

    // Advance 5 simulated minutes every tick interval based on speed
    // 1x = 3000ms, 10x = 800ms, 60x = 250ms
    const intervalMs = speed === 60 ? 250 : speed === 10 ? 800 : 3000;
    const timer = setInterval(() => {
      advanceSimulatedTime(5);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, advanceSimulatedTime]);

  const renderActivePage = () => {
    if (role === 'villager') {
      return <VillagerPage />;
    }
    if (role === 'state') {
      return <StatePage />;
    }

    // Role VWSC / Gram Panchayat
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'households':
        return <HouseholdsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'reports':
        return <CitizenReportsPage />;
      case 'water_quality':
        return <WaterQualityPage />;
      case 'maintenance':
        return <MaintenanceRiskPage />;
      case 'integration':
        return <IntegrationPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-jalora-bg dark:bg-[#0B132B] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Keyboard Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-jalora-blue focus:text-white focus:rounded-md shadow-md text-xs font-semibold"
      >
        Skip to main content
      </a>

      {/* Top Bar Header */}
      <TopBar
        onToggleDemoController={() => setIsDemoControllerOpen(!isDemoControllerOpen)}
        isDemoControllerOpen={isDemoControllerOpen}
      />

      {/* App Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) / Bottom Nav (Mobile) */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-3 sm:p-5 pb-20 md:pb-6 focus:outline-none"
        >
          <div className="max-w-7xl mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Floating Demo Scenarios Controller Drawer */}
      <DemoController
        isOpen={isDemoControllerOpen}
        onClose={() => setIsDemoControllerOpen(false)}
      />
    </div>
  );
};

export default App;
