import React from 'react';
import { X, Home, MapPin, AlertCircle, Droplets, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { HOUSEHOLDS } from '../../data/topology';
import { StatusBadge } from '../common/StatusBadge';

export const HouseholdDrawer: React.FC = () => {
  const {
    selectedHouseholdId,
    setSelectedHouseholdId,
    getHouseholdScores,
    complaints,
    setActiveTab,
  } = useAppStore();

  if (!selectedHouseholdId) return null;

  const hh = HOUSEHOLDS.find((h) => h.id === selectedHouseholdId);
  const scores = getHouseholdScores();
  const scoreObj = scores[selectedHouseholdId];

  if (!hh || !scoreObj) return null;

  const hhComplaints = complaints.filter((c) => c.householdId === selectedHouseholdId);

  return (
    <div
      role="dialog"
      aria-label={`Household Detail: ${hh.id}`}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-[#1C2541] shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col p-4 transition-transform overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-jalora-blue/10 dark:bg-jalora-blue/20 text-jalora-blue flex items-center justify-center">
            <Home size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {hh.name} ({hh.id})
            </h2>
            <p className="text-[11px] font-mono text-slate-500">{hh.officialId}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedHouseholdId(null)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          aria-label="Close drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Score Banner */}
      <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              FHTC Service Score
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-jalora-navy dark:text-white">
                {scoreObj.totalScore}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <StatusBadge status={scoreObj.status} size="lg" />
        </div>

        {scoreObj.forcedOutage && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong>Forced Outage Override:</strong>
              <p className="mt-0.5 leading-relaxed">{scoreObj.forcedReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Score Formula Breakdown */}
      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Score Components Breakdown
        </h3>
        <div className="space-y-2.5 text-xs">
          {/* 1. Supply Share */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Droplets size={13} className="text-jalora-blue" />
                Scheduled Supply (Weight: 35%)
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {(scoreObj.components.supplyShare * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-jalora-blue h-1.5 rounded-full"
                style={{ width: `${scoreObj.components.supplyShare * 100}%` }}
              />
            </div>
          </div>

          {/* 2. Flow / Pressure */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Flow & Pressure Health (Weight: 25%)
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {(scoreObj.components.flowPressureHealth * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-emerald-600 h-1.5 rounded-full"
                style={{ width: `${scoreObj.components.flowPressureHealth * 100}%` }}
              />
            </div>
          </div>

          {/* 3. Complaints Penalty */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-amber-500" />
                Verified Complaint Impact (Weight: 20%)
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {(scoreObj.components.complaintPenalty * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{ width: `${scoreObj.components.complaintPenalty * 100}%` }}
              />
            </div>
          </div>

          {/* 4. Historical Outage Penalty */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <History size={13} className="text-slate-500" />
                30-Day Reliability History (Weight: 20%)
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {(scoreObj.components.historyHealth * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full"
                style={{ width: `${scoreObj.components.historyHealth * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Household Metadata */}
      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Feeding Segment:</span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{hh.segmentId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">FHTC Connection ID:</span>
          <span className="font-mono text-slate-800 dark:text-slate-200">{hh.fhtcId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center gap-1">
            <MapPin size={12} /> Coordinates:
          </span>
          <span className="font-mono text-slate-800 dark:text-slate-200">
            {hh.latitude.toFixed(4)}° N, {hh.longitude.toFixed(4)}° E
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Reporting Reliability:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {(hh.reportingRate * 100).toFixed(0)}% (Seeded)
          </span>
        </div>
      </div>

      {/* Recent Complaints from this household */}
      <div className="mt-4 flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Complaints History ({hhComplaints.length})
        </h3>
        {hhComplaints.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No recent complaints filed.</p>
        ) : (
          <div className="space-y-1.5">
            {hhComplaints.map((c) => (
              <div
                key={c.id}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {c.issue.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{c.description}</p>
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {c.gpsValid ? 'GPS Verified' : 'GPS Mismatch'} (wt: {c.gpsWeight})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            setSelectedHouseholdId(null);
            setActiveTab('reports');
          }}
          className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-jalora-blue text-white hover:bg-jalora-blue-dark text-center"
        >
          File Report for this Household
        </button>
      </div>
    </div>
  );
};
