import React, { useState } from 'react';
import {
  Send,
  Camera,
  MapPin,
  WifiOff,
  Wifi,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { HOUSEHOLDS } from '../data/topology';
import { ComplaintIssue, Language } from '../types';

export const CitizenReportsPage: React.FC = () => {
  const {
    complaints,
    submitComplaint,
    isOfflineMode,
    setIsOfflineMode,
    syncPendingComplaintsQueue,
    language: appLanguage,
  } = useAppStore();

  const [selectedHhId, setSelectedHhId] = useState('H14');
  const [issue, setIssue] = useState<ComplaintIssue>('no_water');
  const [description, setDescription] = useState('');
  const [simulateWrongGps, setSimulateWrongGps] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formLanguage, setFormLanguage] = useState<Language>(appLanguage);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'merge' } | null>(null);

  const selectedHousehold = HOUSEHOLDS.find((h) => h.id === selectedHhId) || HOUSEHOLDS[0];

  // GPS coordinates calculation
  const lat = simulateWrongGps ? (selectedHousehold.latitude + 0.008) : selectedHousehold.latitude;
  const lon = simulateWrongGps ? (selectedHousehold.longitude + 0.008) : selectedHousehold.longitude;
  const distanceFromTapM = simulateWrongGps ? 320 : 8;

  // Handle Photo selection with local preview only
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setDescription(
        issue === 'no_water'
          ? 'No water coming out of household tap during morning supply window'
          : issue === 'low_pressure'
          ? 'Water flow is an extremely weak trickle, buckets take 40 minutes to fill'
          : 'Water appears turbid and discolored with suspended red silt'
      );
    }

    const result = submitComplaint({
      householdId: selectedHhId,
      issue,
      description: description || (issue === 'no_water' ? 'Zero tap flow' : issue),
      photoUrl: photoPreview || undefined,
      gpsValid: !simulateWrongGps,
      distanceFromTapM,
      language: formLanguage,
    });

    if (result.wasMerged) {
      setNotification({
        message: 'Duplicate report detected within 60 simulated minutes: Merged with existing ticket!',
        type: 'merge'
      });
    } else {
      setNotification({
        message: isOfflineMode
          ? 'Report saved locally to offline sync queue (Pending sync).'
          : 'Report filed successfully and synced to live engine evidence.',
        type: 'success'
      });
    }

    // Reset fields
    setDescription('');
    setPhotoPreview(null);
    setTimeout(() => setNotification(null), 5000);
  };

  const pendingSyncCount = complaints.filter((c) => c.status === 'pending_sync').length;

  return (
    <div className="space-y-4">
      {/* Title & Offline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white">
            Citizen Grievance & Water Loss Reporting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Field Reports &bull; GPS Geofencing Validation &bull; Offline Queue &bull; Duplicate Merging
          </p>
        </div>

        {/* Offline Toggle & Sync Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="toggle-offline-mode-btn"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isOfflineMode
                ? 'bg-amber-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span>{isOfflineMode ? 'Offline Queue Active' : 'Online Mode'}</span>
          </button>

          {pendingSyncCount > 0 && (
            <button
              type="button"
              id="sync-offline-queue-btn"
              onClick={syncPendingComplaintsQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-jalora-blue text-white hover:bg-jalora-blue-dark shadow-xs"
            >
              <RefreshCw size={14} />
              <span>Sync {pendingSyncCount} Pending Reports</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === 'merge'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'merge' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notification.message}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Layout Grid: Form (Mobile Optimized) + Live Complaints Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Mobile-Style Submission Form (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send size={16} className="text-jalora-blue" />
              File Citizen Grievance Form
            </h2>

            {/* Language Toggle */}
            <div className="flex items-center rounded border border-slate-200 dark:border-slate-700 text-[10px]">
              {(['en', 'ta', 'hi'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setFormLanguage(l)}
                  className={`px-1.5 py-0.5 uppercase ${
                    formLanguage === l
                      ? 'bg-jalora-blue text-white font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            {/* 1. Pick Household */}
            <div>
              <label htmlFor="complaint-household-select" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Household Connection:
              </label>
              <select
                id="complaint-household-select"
                value={selectedHhId}
                onChange={(e) => setSelectedHhId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-jalora-blue"
              >
                {HOUSEHOLDS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.id} - {h.name} (Branch {h.segmentId})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Issue Type */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Issue Encountered:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'no_water', label: 'No Water' },
                  { id: 'low_pressure', label: 'Low Pressure' },
                  { id: 'dirty_water', label: 'Dirty Water' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    id={`issue-btn-${item.id}`}
                    onClick={() => setIssue(item.id as ComplaintIssue)}
                    className={`py-2 px-2 rounded-lg border text-center font-medium transition-colors ${
                      issue === item.id
                        ? 'border-jalora-blue bg-blue-50 text-jalora-blue dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label htmlFor="complaint-description-input" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Complaint Notes:
              </label>
              <textarea
                id="complaint-description-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tap condition (e.g. no flow since 07:00, or muddy water)..."
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-jalora-blue"
              />
            </div>

            {/* 4. GPS Auto-fill & Mismatch Simulation */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin size={13} className="text-jalora-blue" />
                  GPS Validation ({distanceFromTapM}m from tap)
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  simulateWrongGps
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {simulateWrongGps ? 'Mismatch (wt 0.3)' : 'Verified (wt 1.0)'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-500">
                {lat.toFixed(6)}° N, {lon.toFixed(6)}° E
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="simulate-wrong-gps-checkbox"
                  checked={simulateWrongGps}
                  onChange={(e) => setSimulateWrongGps(e.target.checked)}
                  className="rounded text-jalora-blue focus:ring-jalora-blue"
                />
                <label htmlFor="simulate-wrong-gps-checkbox" className="text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                  Simulate report filed away from tap (&gt;50m away)
                </label>
              </div>
            </div>

            {/* 5. Optional Photo with Local Preview Only */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Tap Photo (Local Preview Only):
              </label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="photo-upload-input"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300 text-xs"
                >
                  <Camera size={14} />
                  <span>Choose Photo</span>
                </label>
                <input
                  id="photo-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {photoPreview && (
                  <div className="relative w-10 h-10 rounded border overflow-hidden">
                    <img src={photoPreview} alt="Tap preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-0 right-0 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="submit-complaint-btn"
              className="w-full py-2.5 px-4 rounded-lg font-bold text-white bg-jalora-blue hover:bg-jalora-blue-dark shadow-sm transition-colors"
            >
              Submit Report {isOfflineMode ? '(Queue Offline)' : '(Sync Live)'}
            </button>
          </form>
        </div>

        {/* Right: Live Complaints Feed (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Citizen Grievances Feed
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                {complaints.length} Total
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Auto-merges duplicates &le; 60m
            </span>
          </div>

          <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
            {complaints.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No citizen grievances have been submitted yet.
              </div>
            ) : (
              complaints.map((c) => {
                const hh = HOUSEHOLDS.find((h) => h.id === c.householdId);
                return (
                  <div
                    key={c.id}
                    id={`complaint-feed-item-${c.id}`}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs transition-colors hover:border-jalora-blue"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.householdId} ({hh?.name})
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Branch {hh?.segmentId}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            c.status === 'synced'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {c.status === 'synced' ? 'Synced' : 'Pending Sync'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      <span className="capitalize px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-jalora-blue text-[10px]">
                        {c.issue.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] font-normal leading-relaxed">{c.description}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className={c.gpsValid ? 'text-emerald-500' : 'text-amber-500'} />
                        {c.gpsValid ? 'GPS Verified (<50m, wt 1.0)' : `GPS Mismatch (${c.distanceFromTapM}m, wt 0.3)`}
                      </span>
                      <span>Reporting Wt: {c.reportingWeight}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
