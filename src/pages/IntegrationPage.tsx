import React, { useState } from 'react';
import {
  Network,
  Database,
  KeyRound
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const IntegrationPage: React.FC = () => {
  const { syncLogs, retrySync } = useAppStore();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleManualRetry = (logId: string) => {
    setRetryingId(logId);
    setTimeout(() => {
      retrySync(logId);
      setRetryingId(null);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Title & Permanent Mock Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white flex items-center gap-2">
            JJM IMIS & Sujal Gaon Integration Gateway
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise Adapter Panel &bull; Upstream State Reporting &bull; Idempotent Payload Transmission
          </p>
        </div>

        {/* Mandatory Mock Integration Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
          <Database size={13} />
          Mock API - integration-ready
        </span>
      </div>

      {/* Architecture Overview Card */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs text-xs space-y-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Network size={16} className="text-jalora-blue" />
          Adapter Architecture & Data Contract
        </h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Jalora features a decoupled API adapter complying with Ministry of Jal Shakti electronic telemetry standards. Every edge event (sensor anomaly, ticket status transition, or citizen grievance) is assigned an UUID-v4 idempotency key to prevent double-posting across intermittent rural 2G/4G connectivity.
        </p>

        {/* Official Identifier Registry Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Official Village ID</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">VIL-TN-04-V01</p>
            <p className="text-[10px] text-slate-500">Demo Village (Kallakurichi)</p>
          </div>
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">FHTC Connection Schema</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">JJM-TN-04-V01-H[01-20]</p>
            <p className="text-[10px] text-slate-500">Mapped to 20 Village Taps</p>
          </div>
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">IoT Telemetry Node IDs</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">SN-T0 &bull; SN-J1 &bull; SN-B2</p>
            <p className="text-[10px] text-slate-500">6 Pressure & Flow Probes</p>
          </div>
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Sujal Gaon Incident Dispatch</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">JJM-INC-2026-0881</p>
            <p className="text-[10px] text-slate-500">Field Ticket Protocol</p>
          </div>
        </div>
      </div>

      {/* Sync Log Table */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Mock IMIS Upstream Transaction Log
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {syncLogs.length} Transactions Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-3 font-semibold">Transaction ID</th>
                <th className="py-3 px-3 font-semibold">Idempotency Key</th>
                <th className="py-3 px-3 font-semibold">Entity Type</th>
                <th className="py-3 px-3 font-semibold">Action</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Attempts</th>
                <th className="py-3 px-3 font-semibold">Payload Summary</th>
                <th className="py-3 px-3 font-semibold text-right">Manual Retry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {syncLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {log.id}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 max-w-[140px] truncate" title={log.idempotencyKey}>
                    <div className="flex items-center gap-1">
                      <KeyRound size={11} className="text-slate-400" />
                      <span>{log.idempotencyKey}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 uppercase font-semibold text-[10px] text-slate-600 dark:text-slate-300">
                    {log.entityType.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-jalora-blue">
                    {log.action}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'synced'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : log.status === 'retrying'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {log.attempts}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs">
                    <p className="truncate" title={log.payloadSummary}>{log.payloadSummary}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{log.responseMessage}</p>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      id={`retry-sync-btn-${log.id}`}
                      onClick={() => handleManualRetry(log.id)}
                      disabled={retryingId === log.id}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-jalora-blue hover:text-white transition-colors disabled:opacity-50"
                    >
                      {retryingId === log.id ? 'Retrying...' : 'Re-transmit'}
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
