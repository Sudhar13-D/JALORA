import React, { useState } from 'react';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { HOUSEHOLDS } from '../data/topology';
import { StatusBadge } from '../components/common/StatusBadge';
import { Household, CitizenComplaint } from '../types';

export const VillagerPage: React.FC = () => {
  const {
    getHouseholdScores,
    complaints,
    setActiveTab,
  } = useAppStore();

  const [myHouseholdId, setMyHouseholdId] = useState('H14');

  const scores = getHouseholdScores();
  const myScore = scores[myHouseholdId];

  const myComplaints = complaints.filter((c: CitizenComplaint) => c.householdId === myHouseholdId);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Title & Household Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white flex items-center gap-2">
            My Tap Water Status (Villager Portal)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jal Jeevan Mission &bull; Individual Household Tap Connection Status
          </p>
        </div>

        {/* Change Household Selector */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <label htmlFor="villager-select" className="text-slate-500 font-medium">My Household:</label>
          <select
            id="villager-select"
            value={myHouseholdId}
            onChange={(e) => setMyHouseholdId(e.target.value)}
            className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
          >
            {HOUSEHOLDS.map((h: Household) => (
              <option key={h.id} value={h.id} className="dark:bg-slate-800">
                {h.id} - {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div className="bg-white dark:bg-[#1C2541] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 bg-slate-100 dark:bg-slate-800">
          {myScore?.status === 'functional' ? (
            <CheckCircle2 size={36} className="text-emerald-500" />
          ) : myScore?.status === 'at_risk' ? (
            <AlertTriangle size={36} className="text-amber-500" />
          ) : (
            <XCircle size={36} className="text-rose-500" />
          )}
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
          Your Tap is {myScore?.status === 'functional' ? 'Functional' : myScore?.status === 'at_risk' ? 'At Risk' : 'Experiencing Outage'}
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {myScore?.status === 'functional'
            ? 'Water pressure and volume are tracking normal operational standards.'
            : myScore?.status === 'at_risk'
            ? 'Mild pressure reduction detected on your branch. Technicians are monitoring.'
            : 'Service disruption confirmed on your feeder pipe. Field repair ticket is active.'}
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          <StatusBadge status={myScore?.status || 'functional'} size="lg" />
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Score: {myScore?.totalScore ?? 85} / 100
          </span>
        </div>

        {myScore?.forcedOutage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 text-left">
            <strong>Active Disruption Notice:</strong> {myScore.forcedReason}
          </div>
        )}

        {/* Quick Report Button */}
        <div className="mt-6">
          <button
            type="button"
            id="villager-report-btn"
            onClick={() => setActiveTab('reports')}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-xl bg-jalora-blue hover:bg-jalora-blue-dark text-white shadow-md transition-all inline-flex items-center justify-center gap-2"
          >
            <Send size={16} />
            Report Water Problem at My Tap
          </button>
        </div>
      </div>

      {/* Water Supply Schedule Info */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs text-xs space-y-2">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Clock size={15} className="text-jalora-blue" />
          Daily Village Supply Timetable
        </h3>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Morning Supply</span>
            <p className="text-sm font-extrabold text-jalora-navy dark:text-blue-300 mt-0.5">06:00 - 08:00 AM</p>
            <p className="text-[10px] text-slate-400">Peak domestic cooking & cleaning draw</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Evening Supply</span>
            <p className="text-sm font-extrabold text-jalora-navy dark:text-blue-300 mt-0.5">05:00 - 07:00 PM</p>
            <p className="text-[10px] text-slate-400">Secondary replenishment draw</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          Notice: Outside these windows, pumps are off to protect groundwater recharge. Zero flow is normal.
        </p>
      </div>

      {/* My Past Reports */}
      {myComplaints.length > 0 && (
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">
            My Recent Grievances ({myComplaints.length})
          </h3>
          <div className="space-y-2">
            {myComplaints.map((c: CitizenComplaint) => (
              <div
                key={c.id}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {c.issue.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
