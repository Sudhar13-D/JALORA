import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { HOUSEHOLDS } from '../data/topology';
import { StatusBadge } from '../components/common/StatusBadge';
import { HouseholdDrawer } from '../components/households/HouseholdDrawer';
import { StatusLevel } from '../types';

export const HouseholdsPage: React.FC = () => {
  const {
    getHouseholdScores,
    complaints,
    setSelectedHouseholdId,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusLevel>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'score' | 'branch'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const scores = getHouseholdScores();

  // Combine static household data with dynamic computed scores and complaints
  const householdData = useMemo(() => {
    return HOUSEHOLDS.map((hh) => {
      const scoreObj = scores[hh.id];
      const hhComplaints = complaints.filter((c) => c.householdId === hh.id);
      const lastComplaint = hhComplaints[0];

      return {
        ...hh,
        score: scoreObj ? scoreObj.totalScore : 0,
        status: scoreObj ? scoreObj.status : ('functional' as StatusLevel),
        forcedOutage: scoreObj ? scoreObj.forcedOutage : false,
        forcedReason: scoreObj?.forcedReason,
        complaintsCount: hhComplaints.length,
        lastComplaintDate: lastComplaint ? new Date(lastComplaint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None',
        riskFlag: scoreObj?.status === 'non_functional' ? 'High Risk' : scoreObj?.status === 'at_risk' ? 'Moderate Risk' : 'Normal',
      };
    });
  }, [scores, complaints]);

  // Filter and search
  const filteredData = useMemo(() => {
    return householdData.filter((hh) => {
      const matchesSearch =
        hh.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hh.officialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hh.segmentId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || hh.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [householdData, searchQuery, statusFilter]);

  // Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'id') comp = a.id.localeCompare(b.id);
      else if (sortBy === 'name') comp = a.name.localeCompare(b.name);
      else if (sortBy === 'score') comp = a.score - b.score;
      else if (sortBy === 'branch') comp = a.segmentId.localeCompare(b.segmentId);

      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortBy, sortDirection]);

  // Handle Sort Toggle
  const toggleSort = (col: 'id' | 'name' | 'score' | 'branch') => {
    if (sortBy === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDirection('asc');
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Household ID',
      'Official JJM ID',
      'Head of Household',
      'Feeding Segment',
      'FHTC Service Score',
      'Status',
      'Outage Override',
      'Recent Complaints',
      'Last Complaint Time',
      'Risk Flag',
      'Coordinates',
    ];

    const rows = sortedData.map((h) => [
      h.id,
      h.officialId,
      `"${h.name}"`,
      h.segmentId,
      h.score,
      h.status,
      h.forcedOutage ? 'Yes' : 'No',
      h.complaintsCount,
      `"${h.lastComplaintDate}"`,
      h.riskFlag,
      `"${h.latitude}, ${h.longitude}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jalora_Households_FHTC_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Title & CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white">
            Household Tap Connections (FHTC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            20 Registered Connections in Demo Village &bull; Real-time Hydraulic Service Health
          </p>
        </div>

        <button
          type="button"
          id="export-csv-btn"
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
        >
          <FileSpreadsheet size={15} />
          Export CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="households-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, resident name, branch..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-jalora-blue"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
          {(['all', 'functional', 'at_risk', 'non_functional'] as const).map((st) => (
            <button
              key={st}
              type="button"
              id={`filter-${st}-btn`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-jalora-blue text-white font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {st === 'all' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Households Table */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th
                  onClick={() => toggleSort('id')}
                  className="py-3 px-3 cursor-pointer hover:text-jalora-blue select-none"
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <span>ID</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-3 cursor-pointer hover:text-jalora-blue select-none"
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <span>Resident & Official ID</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('branch')}
                  className="py-3 px-3 cursor-pointer hover:text-jalora-blue select-none"
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <span>Branch Segment</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('score')}
                  className="py-3 px-3 cursor-pointer hover:text-jalora-blue select-none"
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <span>FHTC Score</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Recent Complaint</th>
                <th className="py-3 px-3 font-semibold">Risk Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No matching households found.
                  </td>
                </tr>
              ) : (
                sortedData.map((hh) => (
                  <tr
                    key={hh.id}
                    id={`household-row-${hh.id}`}
                    onClick={() => setSelectedHouseholdId(hh.id)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {hh.id}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{hh.name}</p>
                      <p className="font-mono text-[10px] text-slate-400">{hh.officialId}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {hh.segmentId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {hh.score}
                        </span>
                        <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 hidden sm:block">
                          <div
                            className={`h-1.5 rounded-full ${
                              hh.score >= 75
                                ? 'bg-emerald-500'
                                : hh.score >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${hh.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={hh.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {hh.complaintsCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {hh.complaintsCount} report(s) ({hh.lastComplaintDate})
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {hh.forcedOutage ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Upstream Failure
                        </span>
                      ) : hh.status === 'at_risk' ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pressure Drift
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          Stable
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Household Drawer for Score Breakdown */}
      <HouseholdDrawer />
    </div>
  );
};
