import React from 'react';
import {
  LayoutDashboard,
  Home,
  AlertTriangle,
  MessageSquareQuote,
  Activity,
  Wrench,
  Network,
  Settings
} from 'lucide-react';
import { useAppStore, NavigationTab } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../data/translations';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, language, tickets, complaints } = useAppStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const activeTicketsCount = tickets.filter(
    (tk) => tk.status !== 'closed' && tk.status !== 'citizen_confirmed'
  ).length;

  const pendingComplaintsCount = complaints.filter(
    (c) => c.status === 'pending_sync'
  ).length;

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ size: number; className?: string }>; badge?: number }[] = [
    { id: 'overview', label: t.tabOverview, icon: LayoutDashboard },
    { id: 'households', label: t.tabHouseholds, icon: Home },
    { id: 'incidents', label: t.tabIncidents, icon: AlertTriangle, badge: activeTicketsCount > 0 ? activeTicketsCount : undefined },
    { id: 'reports', label: t.tabReports, icon: MessageSquareQuote, badge: pendingComplaintsCount > 0 ? pendingComplaintsCount : undefined },
    { id: 'water_quality', label: t.tabWaterQuality, icon: Activity },
    { id: 'maintenance', label: t.tabMaintenance, icon: Wrench },
    { id: 'integration', label: t.tabIntegration, icon: Network },
    { id: 'settings', label: t.tabSettings, icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar (Hidden on mobile <768px) */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-[#1C2541] border-r border-slate-200 dark:border-slate-800 shrink-0 select-none py-3 px-2 justify-between">
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-jalora-blue/10 text-jalora-blue dark:bg-jalora-blue/25 dark:text-blue-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? 'text-jalora-blue dark:text-blue-400' : 'text-slate-500'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Integration Status Note */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-300">JJM PS 26255</p>
          <p className="mt-0.5">Mock API - integration-ready</p>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (Visible on screens <768px, perfect for 390px phone) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1C2541]/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-1 py-1.5 shadow-lg overflow-x-auto"
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-md text-[10px] ${
                isActive
                  ? 'text-jalora-blue dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={17} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1 text-[8px] font-bold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[62px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Tab for remaining items on mobile */}
        <button
          type="button"
          id="mobile-nav-more"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-md text-[10px] ${
            ['maintenance', 'integration', 'settings'].includes(activeTab)
              ? 'text-jalora-blue dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Settings size={17} />
          <span className="mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
