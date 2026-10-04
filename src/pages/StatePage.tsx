import React from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { MOCK_STATE_VILLAGES } from '../data/mockVillages';
import { StatusBadge } from '../components/common/StatusBadge';
import { HouseholdFHTCScore, IncidentTicket, StateVillageSummary } from '../types';

export const StatePage: React.FC = () => {
  const { setRole, setActiveTab, getHouseholdScores, tickets } = useAppStore();

  const scores = getHouseholdScores();
  const scoreValues = Object.values(scores) as HouseholdFHTCScore[];
  const liveDemoFunctional = scoreValues.filter((s: HouseholdFHTCScore) => s.status === 'functional').length;
  const liveDemoAtRisk = scoreValues.filter((s: HouseholdFHTCScore) => s.status === 'at_risk').length;
  const liveDemoNonFunctional = scoreValues.filter((s: HouseholdFHTCScore) => s.status === 'non_functional').length;
  const liveDemoAvg = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a: number, b: HouseholdFHTCScore) => a + b.totalScore, 0) / scoreValues.length) : 85;
  const liveActiveIncidents = tickets.filter((t: IncidentTicket) => t.status !== 'closed' && t.status !== 'citizen_confirmed').length;

  const villages = MOCK_STATE_VILLAGES.map((v: StateVillageSummary) => {
    if (v.villageId === 'VIL-TN-04-001') {
      return {
        ...v,
        functionalCount: liveDemoFunctional,
        atRiskCount: liveDemoAtRisk,
        nonFunctionalCount: liveDemoNonFunctional,
        avgScore: liveDemoAvg,
        activeIncidents: liveActiveIncidents,
        overallStatus: (liveDemoNonFunctional > 3 ? 'non_functional' : liveDemoAtRisk > 3 ? 'at_risk' : 'functional') as 'functional' | 'at_risk' | 'non_functional',
      };
    }
    return v;
  });

  const handleSelectVillage = (villageId: string) => {
    if (villageId === 'VIL-TN-04-001') {
      setRole('vwsc');
      setActiveTab('overview');
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white flex items-center gap-2">
            State Directorate Surveillance Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            District: Kallakurichi &bull; 6 Panchayats Monitored &bull; Click to Inspect Local Scheme
          </p>
        </div>
      </div>

      {/* Villages Table */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Panchayat Village Performance Matrix (6 Schemes)
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            State Telemetry Sync Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-3 font-semibold">Village / Scheme</th>
                <th className="py-3 px-3 font-semibold">Block</th>
                <th className="py-3 px-3 font-semibold">Total FHTCs</th>
                <th className="py-3 px-3 font-semibold">Functional</th>
                <th className="py-3 px-3 font-semibold">At Risk</th>
                <th className="py-3 px-3 font-semibold">Non-functional</th>
                <th className="py-3 px-3 font-semibold">Avg Score</th>
                <th className="py-3 px-3 font-semibold">Active Incidents</th>
                <th className="py-3 px-3 font-semibold">Overall Status</th>
                <th className="py-3 px-3 font-semibold text-right">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {villages.map((v) => {
                const isDemo = v.villageId === 'VIL-TN-04-001';
                return (
                  <tr
                    key={v.villageId}
                    id={`state-village-row-${v.villageId}`}
                    onClick={() => handleSelectVillage(v.villageId)}
                    className={`transition-colors ${
                      isDemo
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 cursor-pointer font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={15} className={isDemo ? 'text-jalora-blue' : 'text-slate-400'} />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {v.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">{v.villageId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {v.block}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {v.totalHouseholds}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {v.functionalCount}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {v.atRiskCount}
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {v.nonFunctionalCount}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {v.avgScore} / 100
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {v.activeIncidents > 0 ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {v.activeIncidents} active
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={v.overallStatus} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isDemo ? (
                        <button
                          type="button"
                          id="inspect-demo-village-btn"
                          onClick={() => handleSelectVillage(v.villageId)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-jalora-blue text-white hover:bg-jalora-blue-dark shadow-xs"
                        >
                          <span>Inspect Scheme</span>
                          <ArrowRight size={12} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Static Mock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
