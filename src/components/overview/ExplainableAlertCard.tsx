import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Wrench,
  Radio,
  FileCheck2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../data/translations';

export const ExplainableAlertCard: React.FC = () => {
  const {
    getEngineResult,
    engineWeights,
    language,
    tickets,
  } = useAppStore();

  const [isWhyExpanded, setIsWhyExpanded] = useState(false);
  const engineResult = getEngineResult();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const topHypothesis = engineResult.topHypothesis;
  const unresolvedSensors = engineResult.unresolvedSensors;

  // Check if active ticket exists
  const activeTicket = tickets.find(
    (tk) => tk.status !== 'closed' && tk.status !== 'citizen_confirmed'
  );

  // If outside supply window, show off-schedule notice
  if (!engineResult.isSupplyWindow) {
    return (
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Info size={16} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Off-Schedule Period (Zero Flow is Normal)
          </h3>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            {t.simulatedData}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          The village drinking-water supply operates on two scheduled windows: 06:00-08:00 and 17:00-19:00. Outside these hours, pipeline valves are closed and pumps are idle. Zero telemetry flow is standard operating procedure and will never raise failure alerts.
        </p>
      </div>
    );
  }

  // If there is an unresolved sensor anomaly (sensor abnormal, but no complaints)
  if (unresolvedSensors.length > 0 && (!topHypothesis || topHypothesis.confidenceBand === 'Low')) {
    return (
      <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-amber-600 dark:text-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              {t.unresolvedAnomaly}: {unresolvedSensors.join(', ')}
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {t.sensorHealthCheck}
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-mono">
            {t.simulatedData}
          </span>
        </div>
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          Telemetry at sensor {unresolvedSensors.join(', ')} drifted &gt;3.5 MAD from historical baseline for 3 consecutive samples. However, zero downstream villagers have reported water loss. Jalora rules classify this as an <strong>Unresolved Sensor Anomaly</strong> rather than a physical pipeline rupture.
        </p>
        <div className="mt-3 p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-800 text-xs">
          <strong>Recommended Action:</strong> Dispatch electrical lineman to inspect transducer calibration, solar battery charge, and telemetry signal integrity at node {unresolvedSensors.join(', ')}.
        </div>
      </div>
    );
  }

  // Normal supply state
  if (!topHypothesis || !engineResult.hasActiveAlert) {
    return (
      <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-emerald-200 dark:border-emerald-800/60 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Supply Operating Normally
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
              All 8 Segments Pressurized
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            {t.simulatedData}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Sensor telemetry is tracking within rolling robust MAD baselines. Zero localized hydraulic anomalies detected across Demo Village.
        </p>
      </div>
    );
  }

  // Active Anomaly Alert Card
  const faultTitle = topHypothesis.faultType === 'blockage'
    ? `Possible blockage: segment ${topHypothesis.segmentName}`
    : topHypothesis.faultType === 'leak'
    ? `Possible underground leak: segment ${topHypothesis.segmentName}`
    : `Localized anomaly: segment ${topHypothesis.segmentName}`;

  // Top 3 segments for comparison bar chart
  const top3Segments = engineResult.hypotheses.slice(0, 3);
  const maxScore = Math.max(...top3Segments.map((s) => s.score), 0.01);

  return (
    <div
      id="explainable-alert-card"
      className="bg-white dark:bg-[#1C2541] rounded-xl border-2 border-rose-300 dark:border-rose-900 p-4 shadow-sm"
      role="alert"
    >
      {/* Alert Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            <AlertTriangle size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {faultTitle}
              </h3>
              {topHypothesis.isIndistinguishable && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {t.indistinguishable}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confidence Band:{' '}
              <strong className={
                topHypothesis.confidenceBand === 'High'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : topHypothesis.confidenceBand === 'Moderate'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500'
              }>
                {topHypothesis.confidenceBand}
              </strong>{' '}
              ({topHypothesis.confidencePercent}% {t.confidenceCalibration})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTicket && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
              <FileCheck2 size={12} />
              Ticket: {activeTicket.officialId} ({activeTicket.status})
            </span>
          )}
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-mono border border-amber-300 dark:border-amber-700">
            {t.simulatedData}
          </span>
        </div>
      </div>

      {/* Computed Evidence Bullets */}
      <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Layers size={13} className="text-jalora-blue" />
          {t.evidence}:
        </h4>
        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
          {topHypothesis.evidence.map((ev) => (
            <li key={ev.id} className="leading-relaxed">
              <span>{ev.description}</span>
              {ev.observedValue && (
                <span className="font-mono text-[11px] ml-1.5 px-1 py-0.2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  {ev.observedValue}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Top-3 Ranked Segments Bar Comparison */}
      <div className="mt-3">
        <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Top-3 Segment Hypotheses Ranking
        </h4>
        <div className="space-y-1.5">
          {top3Segments.map((seg, idx) => {
            const barWidthPercent = Math.max(8, Math.round((seg.score / maxScore) * 100));
            const isWinner = idx === 0;
            return (
              <div key={seg.segmentId} className="flex items-center gap-2 text-xs">
                <span className="w-14 font-mono font-medium text-slate-700 dark:text-slate-300">
                  #{idx + 1} {seg.segmentId}
                </span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isWinner ? 'bg-jalora-blue' : 'bg-slate-400'
                    }`}
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 w-16 text-right">
                  {seg.confidencePercent}% ({seg.confidenceBand})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Action */}
      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs">
        <Wrench size={15} className="text-jalora-blue shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 dark:text-slate-200">{t.recommendedAction}: </strong>
          <span className="text-slate-600 dark:text-slate-300">{topHypothesis.recommendedAction}</span>
        </div>
      </div>

      {/* Expandable "Why this segment?" Drawer */}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          id="why-this-segment-toggle-btn"
          onClick={() => setIsWhyExpanded(!isWhyExpanded)}
          className="flex items-center justify-between w-full text-xs font-semibold text-jalora-blue hover:text-jalora-blue-dark py-1"
        >
          <span>{t.whyThisSegment}</span>
          {isWhyExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {isWhyExpanded && (
          <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              S(e) = (w1 &times; F) + (w2 &times; P) + (w3 &times; C)<br />
              S({topHypothesis.segmentId}) = ({engineWeights.w1_flow.toFixed(2)} &times; {topHypothesis.flowScore.toFixed(2)}) + ({engineWeights.w2_pressure.toFixed(2)} &times; {topHypothesis.pressureScore.toFixed(2)}) + ({engineWeights.w3_complaints.toFixed(2)} &times; {topHypothesis.complaintScore.toFixed(2)}) = <strong>{topHypothesis.score.toFixed(3)}</strong>
            </p>
            <div className="text-[11px] text-slate-500 space-y-1">
              <p>&bull; <strong>F ({topHypothesis.flowScore.toFixed(2)}):</strong> Similarity to flow deviation signature across segment {topHypothesis.segmentId}.</p>
              <p>&bull; <strong>P ({topHypothesis.pressureScore.toFixed(2)}):</strong> Pressure collapse downstream + backpressure build-up upstream.</p>
              <p>&bull; <strong>C ({topHypothesis.complaintScore.toFixed(2)}):</strong> Weighted Jaccard between affected downstream households and verified complaints (GPS inside 50m = 1.0, outside = 0.3).</p>
              <p>&bull; <strong>Confidence ({topHypothesis.confidencePercent}%):</strong> S({topHypothesis.segmentId}) normalized over sum of all segment scores.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
