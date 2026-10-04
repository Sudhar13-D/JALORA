import React, { useState } from 'react';
import {
  Sliders,
  Scale,
  RotateCcw,
  Check
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { DEFAULT_WEIGHTS, DEFAULT_FHTC_WEIGHTS, DEFAULT_FHTC_THRESHOLDS } from '../engine/scoring';

export const SettingsPage: React.FC = () => {
  const {
    engineWeights,
    setEngineWeights,
    setFHTCWeights,
    fhtcThresholds,
    setFHTCThresholds,
    resetDemo,
  } = useAppStore();

  const [savedNotification, setSavedNotification] = useState(false);

  // Auto-normalize engine weights handler
  const handleEngineWeightChange = (key: 'w1_flow' | 'w2_pressure' | 'w3_complaints', val: number) => {
    const rawVal = Math.max(0.05, Math.min(1.0, val));
    setEngineWeights({ [key]: rawVal });
    showNotification();
  };

  const handleFhtcThresholdChange = (key: 'functionalMin' | 'atRiskMin', val: number) => {
    setFHTCThresholds({ [key]: Number(val) });
    showNotification();
  };

  const handleResetToDefaults = () => {
    setEngineWeights(DEFAULT_WEIGHTS);
    setFHTCWeights(DEFAULT_FHTC_WEIGHTS);
    setFHTCThresholds(DEFAULT_FHTC_THRESHOLDS);
    showNotification();
  };

  const showNotification = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  // Normalized weights for display
  const sum = engineWeights.w1_flow + engineWeights.w2_pressure + engineWeights.w3_complaints;
  const nw1 = (engineWeights.w1_flow / sum).toFixed(2);
  const nw2 = (engineWeights.w2_pressure / sum).toFixed(2);
  const nw3 = (engineWeights.w3_complaints / sum).toFixed(2);

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-jalora-navy dark:text-white flex items-center gap-2">
            System & Engine Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sensor Fusion Weights &bull; FHTC Scoring Thresholds &bull; Localization
          </p>
        </div>

        {savedNotification && (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Check size={14} />
            Parameters Updated Live
          </span>
        )}
      </div>

      {/* 1. Engine Weights Configuration */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale size={16} className="text-jalora-blue" />
              Hypothesis Fusion Scoring Formula Weights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              S(e) = w1 &times; F(e) + w2 &times; P(e) + w3 &times; C(e) &bull; Auto-normalized sum = 1.0
            </p>
          </div>
          <button
            type="button"
            id="reset-engine-weights-btn"
            onClick={handleResetToDefaults}
            className="text-xs text-jalora-blue hover:underline font-medium"
          >
            Reset to Defaults
          </button>
        </div>

        <div className="space-y-4 pt-2 text-xs">
          {/* w1: Flow */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                w1: Flow Imbalance Weight: {nw1}
              </span>
              <span className="font-mono text-slate-500">{(Number(nw1) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              id="w1-flow-slider"
              min="0.1"
              max="0.8"
              step="0.05"
              value={engineWeights.w1_flow}
              onChange={(e) => handleEngineWeightChange('w1_flow', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-jalora-blue"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Measures flow conservation mismatch between segment inlet and outlet probes.
            </p>
          </div>

          {/* w2: Pressure */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                w2: Pressure Deviation Weight: {nw2}
              </span>
              <span className="font-mono text-slate-500">{(Number(nw2) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              id="w2-pressure-slider"
              min="0.1"
              max="0.8"
              step="0.05"
              value={engineWeights.w2_pressure}
              onChange={(e) => handleEngineWeightChange('w2_pressure', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-jalora-blue"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Evaluates downstream hydraulic head collapse and upstream backpressure accumulation.
            </p>
          </div>

          {/* w3: Complaints */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                w3: Citizen Grievance Weight: {nw3}
              </span>
              <span className="font-mono text-slate-500">{(Number(nw3) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              id="w3-complaints-slider"
              min="0.1"
              max="0.8"
              step="0.05"
              value={engineWeights.w3_complaints}
              onChange={(e) => handleEngineWeightChange('w3_complaints', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-jalora-blue"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Weighted Jaccard index between predicted downstream households and verified complaints.
            </p>
          </div>
        </div>
      </div>

      {/* 2. FHTC Thresholds Configuration */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders size={16} className="text-jalora-blue" />
          FHTC Service Score Classification Cutoffs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label htmlFor="functional-threshold-input" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Functional Minimum Cutoff (Points):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="functional-threshold-input"
                min="50"
                max="90"
                value={fhtcThresholds.functionalMin}
                onChange={(e) => handleFhtcThresholdChange('functionalMin', Number(e.target.value))}
                className="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
              <span className="text-slate-500">Default: 75 pts (Green Status)</span>
            </div>
          </div>

          <div>
            <label htmlFor="atrisk-threshold-input" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              At Risk Minimum Cutoff (Points):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="atrisk-threshold-input"
                min="20"
                max="60"
                value={fhtcThresholds.atRiskMin}
                onChange={(e) => handleFhtcThresholdChange('atRiskMin', Number(e.target.value))}
                className="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
              <span className="text-slate-500">Default: 40 pts (Amber Status)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Global Reset Demo Button */}
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Reset Demo State
          </h3>
          <p className="text-xs text-slate-500">
            Reverts all simulations, parameters, complaints, and tickets back to clean 07:15 AM normal state.
          </p>
        </div>
        <button
          type="button"
          id="settings-reset-demo-btn"
          onClick={() => {
            resetDemo();
            showNotification();
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-rose-300 text-rose-600 dark:border-rose-900 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors shadow-xs"
        >
          <RotateCcw size={14} />
          Reset Demo
        </button>
      </div>
    </div>
  );
};
