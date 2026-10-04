import { X, Network, Gauge, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SEGMENTS, DOWNSTREAM_HOUSEHOLDS, HOUSEHOLDS } from '../../data/topology';
import { getSegmentRiskEvaluations } from '../../engine/scoring';
import { StatusBadge } from '../common/StatusBadge';

export const SegmentDrawer: React.FC = () => {
  const {
    selectedSegmentId,
    setSelectedSegmentId,
    sensorReadings,
    getHouseholdScores,
    setSelectedHouseholdId,
  } = useAppStore();

  if (!selectedSegmentId) return null;

  const seg = SEGMENTS.find((s) => s.id === selectedSegmentId);
  if (!seg) return null;

  const householdScores = getHouseholdScores();
  const downstreamIds = DOWNSTREAM_HOUSEHOLDS[seg.id] || [];
  const riskEvaluations = getSegmentRiskEvaluations();
  const segmentRisk = riskEvaluations.find((r) => r.segmentId === seg.id);

  const upSensor = seg.upstreamSensorId ? sensorReadings[seg.upstreamSensorId] : undefined;
  const downSensor = seg.downstreamSensorId ? sensorReadings[seg.downstreamSensorId] : undefined;

  return (
    <div
      role="dialog"
      aria-label={`Segment Detail: ${seg.name}`}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-[#1C2541] shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col p-4 transition-transform overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-jalora-blue/10 dark:bg-jalora-blue/20 text-jalora-blue flex items-center justify-center">
            <Network size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {seg.name}
            </h2>
            <p className="text-[11px] text-slate-500">
              Length: {seg.lengthMeters}m | Dia: {seg.diameterMm}mm
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSelectedSegmentId(null)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          aria-label="Close drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Segment Risk Indicator */}
      {segmentRisk && (
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Maintenance Risk Level
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                segmentRisk.riskLevel === 'High'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : segmentRisk.riskLevel === 'Medium'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {segmentRisk.riskLevel} Risk ({segmentRisk.points} pts)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 italic mb-2">
            Risk indicator, rule-based (simulated history)
          </p>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {segmentRisk.drivers.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-jalora-blue">&bull;</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Telemetry at Boundary Sensors */}
      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Gauge size={14} className="text-jalora-blue" />
          Boundary Telemetry Sensors
        </h3>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Upstream ({seg.upstreamSensorId || seg.fromNode})
            </span>
            {upSensor ? (
              <div className="mt-1 font-mono text-xs">
                <p>Flow: {upSensor.flowLpm} LPM</p>
                <p>Press: {upSensor.pressureBar} bar</p>
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px] mt-1">No sensor</p>
            )}
          </div>
          <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Downstream ({seg.downstreamSensorId || seg.toNode})
            </span>
            {downSensor ? (
              <div className="mt-1 font-mono text-xs">
                <p>Flow: {downSensor.flowLpm} LPM</p>
                <p>Press: {downSensor.pressureBar} bar</p>
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px] mt-1">No sensor</p>
            )}
          </div>
        </div>
      </div>

      {/* Downstream Affected Households */}
      <div className="mt-4 flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-jalora-blue" />
            Downstream Households ({downstreamIds.length})
          </span>
        </h3>
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {downstreamIds.map((hid) => {
            const hh = HOUSEHOLDS.find((h) => h.id === hid);
            const scoreObj = householdScores[hid];
            return (
              <div
                key={hid}
                onClick={() => setSelectedHouseholdId(hid)}
                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-jalora-blue cursor-pointer text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {hid}: {hh?.name}
                  </span>
                  <p className="text-[10px] text-slate-400">Score: {scoreObj?.totalScore}/100</p>
                </div>
                {scoreObj && <StatusBadge status={scoreObj.status} size="sm" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
