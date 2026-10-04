import React from 'react';
import { Wrench } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getSegmentRiskEvaluations } from '../engine/scoring';

export const MaintenanceRiskPage: React.FC = () => {
  const { setSelectedSegmentId, setActiveTab } = useAppStore();
  const risks = getSegmentRiskEvaluations();

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white flex items-center gap-2">
            <Wrench size={18} className="text-jalora-blue" />
            Predictive Maintenance & Pipe Segment Risk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suggested Inspection Order &bull; 14-Day Transient Fatigue &bull; Repeat Fault History
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
          Risk indicator, rule-based (simulated history)
        </span>
      </div>

      {/* Suggested Inspection Order Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-800 dark:text-rose-300">Priority 1: Urgent Inspection</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200">High Risk</span>
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">Segment S7 (J1 - B1)</p>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1">
            4 pressure transients in 14 days, repeat stress at tee junction. Suggested next inspection: Tomorrow morning.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-800 dark:text-amber-300">Priority 2: Scheduled Audit</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Medium Risk</span>
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">Segment S4 & S8</p>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1">
            Tail-end attenuation and air-pocket accumulation. Suggested inspection: Within 7 calendar days.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">Priority 3: Routine Preventative</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Low Risk</span>
          </div>
          <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">Segments S1, S2, S3, S5, S6</p>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1">
            Stable laminar flow and healthy structural condition. Routine bi-monthly check.
          </p>
        </div>
      </div>

      {/* Prioritized Segments Table */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-3 font-semibold">Inspection Order</th>
                <th className="py-3 px-3 font-semibold">Segment</th>
                <th className="py-3 px-3 font-semibold">Risk Score</th>
                <th className="py-3 px-3 font-semibold">Risk Level</th>
                <th className="py-3 px-3 font-semibold">14d Anomalies</th>
                <th className="py-3 px-3 font-semibold">Avg Restoration</th>
                <th className="py-3 px-3 font-semibold">Primary Risk Drivers</th>
                <th className="py-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {risks.map((item) => (
                <tr
                  key={item.segmentId}
                  id={`risk-row-${item.segmentId}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    #{item.suggestedInspectionOrder}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {item.segmentName}
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-sm">
                    {item.points} / 100
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.riskLevel === 'High'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : item.riskLevel === 'Medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {item.anomalyFrequency14d} events
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {item.avgRestorationHours} hrs
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs">
                    <ul className="list-disc list-inside space-y-0.5">
                      {item.drivers.map((d, idx) => (
                        <li key={idx} className="text-[11px] leading-tight">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      id={`view-segment-${item.segmentId}-btn`}
                      onClick={() => {
                        setSelectedSegmentId(item.segmentId);
                        setActiveTab('overview');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-jalora-blue/10 text-jalora-blue hover:bg-jalora-blue hover:text-white transition-colors"
                    >
                      View on SVG
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
