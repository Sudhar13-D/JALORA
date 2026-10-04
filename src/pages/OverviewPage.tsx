import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Radio
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { NetworkSchematic } from '../components/network/NetworkSchematic';
import { ExplainableAlertCard } from '../components/overview/ExplainableAlertCard';
import { SensorTelemetryChart } from '../components/overview/SensorTelemetryChart';
import { HouseholdDrawer } from '../components/households/HouseholdDrawer';
import { SegmentDrawer } from '../components/network/SegmentDrawer';
import { HelpTooltip } from '../components/common/HelpTooltip';
import { HouseholdFHTCScore, IncidentTicket, SensorReading } from '../types';

export const OverviewPage: React.FC = () => {
  const {
    getHouseholdScores,
    tickets,
    sensorReadings,
    setActiveTab,
  } = useAppStore();

  const householdScores = getHouseholdScores();
  const scoresList = Object.values(householdScores) as HouseholdFHTCScore[];

  const functionalCount = scoresList.filter((s: HouseholdFHTCScore) => s.status === 'functional').length;
  const atRiskCount = scoresList.filter((s: HouseholdFHTCScore) => s.status === 'at_risk').length;
  const nonFunctionalCount = scoresList.filter((s: HouseholdFHTCScore) => s.status === 'non_functional').length;

  const avgScore = scoresList.length > 0
    ? Math.round(scoresList.reduce((acc: number, s: HouseholdFHTCScore) => acc + s.totalScore, 0) / scoresList.length)
    : 0;

  const activeIncidentsCount = tickets.filter(
    (tk: IncidentTicket) => tk.status !== 'closed' && tk.status !== 'citizen_confirmed'
  ).length;

  const onlineSensorsCount = (Object.values(sensorReadings) as SensorReading[]).filter(
    (s: SensorReading) => s.status === 'online'
  ).length;

  return (
    <div className="space-y-4">
      {/* Page Title & Scope */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white">
            Water Supply Overview: Demo Village
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jal Jeevan Mission (PS 26255) &bull; Continuous Hydraulic & Quality Surveillance
          </p>
        </div>
      </div>

      {/* KPI Cards Row (8px grid rounded cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Functional */}
        <div
          onClick={() => setActiveTab('households')}
          className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs hover:border-emerald-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Functional</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{functionalCount}</span>
            <span className="text-xs text-slate-400">/ 20</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tap pressure &gt; 0.2 bar</p>
        </div>

        {/* 2. At Risk */}
        <div
          onClick={() => setActiveTab('households')}
          className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs hover:border-amber-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">At Risk</span>
            <AlertTriangle size={16} />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{atRiskCount}</span>
            <span className="text-xs text-slate-400">/ 20</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Score 40 - 74</p>
        </div>

        {/* 3. Non-Functional */}
        <div
          onClick={() => setActiveTab('households')}
          className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs hover:border-rose-500 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Non-functional</span>
            <XCircle size={16} />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{nonFunctionalCount}</span>
            <span className="text-xs text-slate-400">/ 20</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Zero flow or score &lt;40</p>
        </div>

        {/* 4. Average Score */}
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <div className="flex items-center justify-between text-jalora-blue dark:text-blue-400">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Avg FHTC Score</span>
            <HelpTooltip content="FHTC Score: 35% supply share + 25% flow/pressure + 20% citizen complaints + 20% 30-day reliability." />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-jalora-navy dark:text-white">{avgScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Target &ge; 75 points</p>
        </div>

        {/* 5. Active Incidents */}
        <div
          onClick={() => setActiveTab('incidents')}
          className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs hover:border-jalora-blue cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs font-semibold">Active Incidents</span>
            <Activity size={16} className="text-jalora-blue" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeIncidentsCount}</span>
            <span className="text-xs text-slate-400">tickets</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Dispatched to technician</p>
        </div>

        {/* 6. Online Sensors */}
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs font-semibold">Sensors Online</span>
            <Radio size={16} className="text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{onlineSensorsCount}</span>
            <span className="text-xs text-slate-400">/ 6</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Flow & pressure telemetry</p>
        </div>
      </div>

      {/* Explainable Alert Card */}
      <ExplainableAlertCard />

      {/* SVG Network Schematic */}
      <NetworkSchematic />

      {/* Live Telemetry vs Historical Baseline Chart */}
      <SensorTelemetryChart />

      {/* Detail Drawers */}
      <HouseholdDrawer />
      <SegmentDrawer />
    </div>
  );
};
