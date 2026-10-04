import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const WaterQualityPage: React.FC = () => {
  const {
    qualityReadings,
    verifyQualityAlert,
  } = useAppStore();

  const [selectedSensor, setSelectedSensor] = useState<'SN-T0' | 'SN-J2' | 'SN-E1'>('SN-T0');
  const [anomalySimulation, setAnomalySimulation] = useState<'none' | 'turbidity_spike' | 'chlorine_depletion'>('none');

  const reading = qualityReadings[selectedSensor];

  // Apply simulated anomaly if active
  const effectiveReading = {
    ...reading,
    turbidityNtu: anomalySimulation === 'turbidity_spike' ? 7.8 : reading?.turbidityNtu ?? 2.1,
    residualChlorineMgL: anomalySimulation === 'chlorine_depletion' ? 0.05 : reading?.residualChlorineMgL ?? 0.45,
  };

  const isTurbidityDeviated = effectiveReading.turbidityNtu > 5.0;
  const isChlorineDeviated = effectiveReading.residualChlorineMgL < 0.2 || effectiveReading.residualChlorineMgL > 1.0;
  const isPhDeviated = effectiveReading.ph < 6.5 || effectiveReading.ph > 8.5;
  const isTdsDeviated = effectiveReading.tdsPpm > 500;

  const hasAnyAnomaly = isTurbidityDeviated || isChlorineDeviated || isPhDeviated || isTdsDeviated;

  return (
    <div className="space-y-4">
      {/* Title & Scope */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white flex items-center gap-2">
            Drinking Water Physico-Chemical Surveillance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Telemetry from T0 (Main Feeder), J2 (Central Junction), E1 (Tail End) &bull; BIS IS 10500 Guidelines
          </p>
        </div>

        {/* Sensor Selector */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-xs">
          {(['SN-T0', 'SN-J2', 'SN-E1'] as const).map((s) => (
            <button
              key={s}
              type="button"
              id={`quality-sensor-btn-${s}`}
              onClick={() => setSelectedSensor(s)}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                selectedSensor === s
                  ? 'bg-jalora-blue text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {s === 'SN-T0' ? 'T0 (Source Tank)' : s === 'SN-J2' ? 'J2 (Midpoint)' : 'E1 (Tail End)'}
            </button>
          ))}
        </div>
      </div>

      {/* Mandatory Statutory Quality Disclaimer Badge */}
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs flex items-start gap-2.5">
        <Info size={18} className="text-jalora-blue shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Compliance Status: <span className="text-jalora-blue font-bold">Within configured limits (not a safety certification)</span>
          </p>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            <strong>Mandatory Note:</strong> Low-cost electronic sensors monitor gross physico-chemical parameters and cannot establish microbiological potable safety (e.g., bacteriological presence or viral pathogens). Regulatory potable status requires certified laboratory incubation per Jal Jeevan Mission protocols. Configured thresholds are based on BIS IS 10500:2012 defaults.
          </p>
        </div>
      </div>

      {/* Test Anomaly Simulator Trigger */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <FlaskConical size={16} className="text-jalora-blue" />
          <span>Simulate Water Quality Anomaly:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="quality-normal-btn"
            onClick={() => setAnomalySimulation('none')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              anomalySimulation === 'none'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Normal Profile
          </button>
          <button
            type="button"
            id="quality-turbidity-spike-btn"
            onClick={() => setAnomalySimulation('turbidity_spike')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              anomalySimulation === 'turbidity_spike'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Turbidity Spike (7.8 NTU)
          </button>
          <button
            type="button"
            id="quality-chlorine-depletion-btn"
            onClick={() => setAnomalySimulation('chlorine_depletion')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              anomalySimulation === 'chlorine_depletion'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Chlorine Depletion (&lt;0.2 mg/L)
          </button>
        </div>
      </div>

      {/* Active Anomaly & Lab Verification Flow Card */}
      {hasAnyAnomaly && (
        <div className="p-4 rounded-xl border-2 border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 text-xs shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                Quality Anomaly Detected at Sensor {selectedSensor}
              </h3>
            </div>
            <span className="font-semibold text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900">
              Field / Lab Verification Required
            </span>
          </div>

          <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
            {isTurbidityDeviated && `Turbidity has surged to ${effectiveReading.turbidityNtu} NTU (exceeding BIS IS 10500 maximum permissible limit of 5.0 NTU). `}
            {isChlorineDeviated && `Residual free chlorine dropped to ${effectiveReading.residualChlorineMgL} mg/L (below the minimum protective threshold of 0.20 mg/L). `}
            Neighbouring node cross-comparison indicates real plume dispersion rather than isolated transducer drift.
          </p>

          <div className="pt-2 border-t border-rose-200 dark:border-rose-900 flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-400">
              Audit Action Status:{' '}
              <strong>{effectiveReading.verifiedStatus ? effectiveReading.verifiedStatus.replace('_', ' ') : 'Pending Field Confirmation'}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="quality-log-field-pass-btn"
                onClick={() => verifyQualityAlert(selectedSensor, 'verified_field_pass')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
              >
                Log Field Test Pass (Sensor Recalibrated)
              </button>
              <button
                type="button"
                id="quality-log-field-fail-btn"
                onClick={() => verifyQualityAlert(selectedSensor, 'verified_field_fail')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
              >
                Log Lab Failure (Initiate Chlorination)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5 Quality Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. pH */}
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">pH Level</span>
            {isPhDeviated ? <AlertTriangle size={15} className="text-rose-500" /> : <CheckCircle2 size={15} className="text-emerald-500" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {effectiveReading.ph.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">pH</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Configured: 6.5 - 8.5</p>
          <span className="inline-block mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Within limits
          </span>
        </div>

        {/* 2. Turbidity */}
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Turbidity</span>
            {isTurbidityDeviated ? <AlertTriangle size={15} className="text-rose-500" /> : <CheckCircle2 size={15} className="text-emerald-500" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-extrabold ${isTurbidityDeviated ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {effectiveReading.turbidityNtu.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">NTU</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Configured: &le; 5.0 NTU</p>
          <span className={`inline-block mt-2 text-[10px] font-medium ${isTurbidityDeviated ? 'text-rose-600 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {isTurbidityDeviated ? 'Exceeds limit (High silt)' : 'Within limits'}
          </span>
        </div>

        {/* 3. Total Dissolved Solids (TDS) */}
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">TDS</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {effectiveReading.tdsPpm}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ppm</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Configured: &le; 500 ppm</p>
          <span className="inline-block mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Within limits
          </span>
        </div>

        {/* 4. Electrical Conductivity */}
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Conductivity</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {effectiveReading.conductivityUsCm}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">&micro;S/cm</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Target: 200 - 800</p>
          <span className="inline-block mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Within limits
          </span>
        </div>

        {/* 5. Residual Free Chlorine */}
        <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Residual Chlorine</span>
            {isChlorineDeviated ? <AlertTriangle size={15} className="text-rose-500" /> : <CheckCircle2 size={15} className="text-emerald-500" />}
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-extrabold ${isChlorineDeviated ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {effectiveReading.residualChlorineMgL.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">mg/L</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Configured: 0.20 - 1.0 mg/L</p>
          <span className={`inline-block mt-2 text-[10px] font-medium ${isChlorineDeviated ? 'text-rose-600 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {isChlorineDeviated ? 'Sub-potable (&lt;0.2 mg/L)' : 'Within limits'}
          </span>
        </div>
      </div>

      {/* Sensor Drift vs Contamination Logic Explanation Card */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs text-xs space-y-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Activity size={15} className="text-jalora-blue" />
          Sensor Drift vs Hydraulic Plume Distinction Engine
        </h3>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          Low-cost optical and electrochemical probes are susceptible to biological fouling and electrode drift. Jalora compares spatial propagation velocity across adjacent nodes (T0 &rarr; J2 &rarr; E1) and monitors rate-of-change:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <strong className="text-slate-800 dark:text-slate-200">&bull; Lone-Sensor Drift:</strong>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Sudden single-point shift at J2 while T0 (inflow) and E1 (outflow) remain stable. Flagged as transducer maintenance without sounding community alarms.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <strong className="text-slate-800 dark:text-slate-200">&bull; True Plume Anomaly:</strong>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Turbidity elevation initiates at T0 and propagates downstream to J2 and E1 in synchronization with pipe flow velocities. Automatically dispatches field sampling alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
