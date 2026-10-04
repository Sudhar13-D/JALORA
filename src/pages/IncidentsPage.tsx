import React, { useState } from 'react';
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TicketStatus } from '../types';

export const IncidentsPage: React.FC = () => {
  const {
    tickets,
    assignTechnician,
    markRepaired,
    confirmCitizen,
  } = useAppStore();

  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [selectedTechs, setSelectedTechs] = useState<Record<string, string>>({});
  const [repairNotesInput, setRepairNotesInput] = useState<Record<string, string>>({});

  const technicians = [
    'M. Suresh (Field Technician)',
    'R. Velu (Pipeline Supervisor)',
    'S. Anitha (Electro-Mechanical Engineer)',
    'K. Ganesan (Valve Operator)'
  ];

  const statusColumns: { id: TicketStatus; label: string; color: string }[] = [
    { id: 'detected', label: 'Detected', color: 'border-slate-300 dark:border-slate-700' },
    { id: 'localized', label: 'Localized', color: 'border-amber-400 dark:border-amber-600' },
    { id: 'assigned', label: 'Assigned', color: 'border-blue-400 dark:border-blue-600' },
    { id: 'in_repair', label: 'In Repair', color: 'border-indigo-400 dark:border-indigo-600' },
    { id: 'citizen_confirmed', label: 'Citizen Confirmed', color: 'border-emerald-400 dark:border-emerald-600' },
    { id: 'closed', label: 'Closed', color: 'border-slate-400 dark:border-slate-600' },
  ];

  const handleAssign = (ticketId: string) => {
    const tech = selectedTechs[ticketId] || technicians[0];
    assignTechnician(ticketId, tech);
  };

  const handleMarkRepaired = (ticketId: string) => {
    const notes = repairNotesInput[ticketId] || 'Physical blockage removed and branch flushed';
    markRepaired(ticketId, notes);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white flex items-center gap-2">
            Incident Operations & Ticket Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated Detection &bull; Field Dispatch &bull; Citizen Confirmation &bull; Lifecycle Auditing
          </p>
        </div>
      </div>

      {/* Ticket Board Status Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {statusColumns.map((col) => {
          const count = tickets.filter((t) => t.status === col.id).length;
          return (
            <div
              key={col.id}
              className={`p-2.5 rounded-xl bg-white dark:bg-[#1C2541] border ${col.color} shadow-xs text-center`}
            >
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                {col.label}
              </span>
              <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tickets List / Board */}
      {tickets.length === 0 ? (
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Active Incident Tickets
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            All pipe segments are operating within normal baseline limits. Tickets are auto-created when an anomaly achieves Moderate or High confidence for 3 consecutive samples.
          </p>
          <p className="text-[11px] text-slate-400 mt-3 font-mono">
            Tip: Open the Demo Controller and select "Blockage on S8" or "Leak on S3" to simulate incident lifecycle.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicketId === ticket.id;
            return (
              <div
                key={ticket.id}
                id={`ticket-card-${ticket.id}`}
                className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                      <AlertTriangle size={18} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {ticket.title}
                        </h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ticket.officialId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Segment {ticket.segmentId} &bull; {ticket.affectedHouseholdsCount} Downstream Households Affected &bull; Confidence: {ticket.confidenceBand} ({ticket.confidencePercent}%)
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                        ticket.status === 'closed' || ticket.status === 'citizen_confirmed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : ticket.status === 'in_repair'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : ticket.status === 'assigned'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Technician Assignment and Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  {/* Step 1: Assign Technician if Detected/Localized */}
                  {(ticket.status === 'detected' || ticket.status === 'localized') && (
                    <div className="flex items-center gap-2">
                      <label htmlFor={`tech-select-${ticket.id}`} className="sr-only">Assign Technician</label>
                      <select
                        id={`tech-select-${ticket.id}`}
                        value={selectedTechs[ticket.id] || technicians[0]}
                        onChange={(e) => setSelectedTechs({ ...selectedTechs, [ticket.id]: e.target.value })}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        {technicians.map((tech) => (
                          <option key={tech} value={tech}>
                            {tech}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        id={`assign-tech-btn-${ticket.id}`}
                        onClick={() => handleAssign(ticket.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-jalora-blue text-white hover:bg-jalora-blue-dark shadow-xs"
                      >
                        Dispatch Crew
                      </button>
                    </div>
                  )}

                  {/* Step 2: Mark Repaired if Assigned */}
                  {ticket.status === 'assigned' && (
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Enter repair work done (e.g. flushed pipe, cleared joint)..."
                        value={repairNotesInput[ticket.id] || ''}
                        onChange={(e) => setRepairNotesInput({ ...repairNotesInput, [ticket.id]: e.target.value })}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        id={`mark-repaired-btn-${ticket.id}`}
                        onClick={() => handleMarkRepaired(ticket.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0"
                      >
                        <Wrench size={13} />
                        Mark Repaired (Restores Flow)
                      </button>
                    </div>
                  )}

                  {/* Step 3: Citizen Confirmation if In Repair */}
                  {ticket.status === 'in_repair' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 italic">
                        Repairs done &bull; Awaiting citizen tap confirmation
                      </span>
                      <button
                        type="button"
                        id={`confirm-citizen-btn-${ticket.id}`}
                        onClick={() => confirmCitizen(ticket.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <CheckCircle2 size={14} />
                        Citizen Confirm & Close Ticket
                      </button>
                    </div>
                  )}

                  {/* Step 4: Closed / Confirmed */}
                  {(ticket.status === 'closed' || ticket.status === 'citizen_confirmed') && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={15} />
                      Ticket fully closed. Household service scores recovered.
                    </div>
                  )}

                  {/* Toggle Timeline */}
                  <button
                    type="button"
                    onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                    className="ml-auto text-xs font-semibold text-slate-500 hover:text-jalora-blue flex items-center gap-1"
                  >
                    <span>Timeline ({ticket.timeline.length})</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Timestamped Timeline */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Timestamped Incident Timeline
                    </h4>
                    <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3 ml-2">
                      {ticket.timeline.map((evt) => (
                        <div key={evt.id} className="relative">
                          <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-jalora-blue border-2 border-white dark:border-slate-900" />
                          <div className="flex items-baseline justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                              {evt.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {evt.note}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Actor: <em>{evt.actor}</em>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
