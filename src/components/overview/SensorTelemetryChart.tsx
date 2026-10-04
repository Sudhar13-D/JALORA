import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { SENSOR_BASELINES, isSupplyWindow } from '../../engine/scoring';

export const SensorTelemetryChart: React.FC = () => {
  const {
    selectedSensorId,
    setSelectedSensorId,
    sensorHistory,
    simulatedTime,
  } = useAppStore();

  const [metricTab, setMetricTab] = useState<'flow' | 'pressure'>('flow');

  const sensorIds = ['SN-T0', 'SN-J1', 'SN-J2', 'SN-E1', 'SN-B1', 'SN-B2'];
  const { windowName } = isSupplyWindow(simulatedTime);
  const activeWindow = windowName === 'off_schedule' ? 'morning' : windowName;
  const baseline = SENSOR_BASELINES[selectedSensorId]?.[activeWindow];

  const history = sensorHistory[selectedSensorId] || [];

  // Format chart data points
  const chartData = history.map((pt, idx) => {
    const timeStr = new Date(pt.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      index: idx,
      time: timeStr,
      flow: pt.flowLpm,
      baselineFlow: baseline ? baseline.medianFlow : 0,
      flowUpperMad: baseline ? baseline.medianFlow + 3.5 * (1.4826 * baseline.madFlow) : 0,
      flowLowerMad: baseline ? Math.max(0, baseline.medianFlow - 3.5 * (1.4826 * baseline.madFlow)) : 0,
      pressure: pt.pressureBar,
      baselinePressure: baseline ? baseline.medianPressure : 0,
      pressureUpperMad: baseline ? baseline.medianPressure + 3.5 * (1.4826 * baseline.madPressure) : 0,
      pressureLowerMad: baseline ? Math.max(0, baseline.medianPressure - 3.5 * (1.4826 * baseline.madPressure)) : 0,
    };
  });

  return (
    <div className="bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Sensor Telemetry vs Historical Baseline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            5-minute sampling interval with robust rolling MAD bounds
          </p>
        </div>

        {/* Sensor and Metric Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sensor Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 font-medium">Sensor:</span>
            <label htmlFor="telemetry-sensor-select" className="sr-only">Select Sensor</label>
            <select
              id="telemetry-sensor-select"
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {sensorIds.map((sid) => (
                <option key={sid} value={sid} className="dark:bg-slate-800">
                  {sid}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            <button
              type="button"
              id="metric-flow-btn"
              onClick={() => setMetricTab('flow')}
              className={`px-3 py-1 font-medium transition-colors ${
                metricTab === 'flow'
                  ? 'bg-jalora-blue text-white font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              Flow (LPM)
            </button>
            <button
              type="button"
              id="metric-pressure-btn"
              onClick={() => setMetricTab('pressure')}
              className={`px-3 py-1 font-medium transition-colors ${
                metricTab === 'pressure'
                  ? 'bg-jalora-blue text-white font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              Pressure (bar)
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              domain={metricTab === 'flow' ? [0, 'auto'] : [0, 3.5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {metricTab === 'flow' ? (
              <>
                <ReferenceLine
                  y={baseline?.medianFlow}
                  stroke="#2E9E5B"
                  strokeDasharray="4 4"
                  label={{ value: 'Baseline', fill: '#2E9E5B', fontSize: 10, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="flow"
                  name="Observed Flow (LPM)"
                  stroke="#0070C0"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0070C0' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="baselineFlow"
                  name="Baseline Median (LPM)"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </>
            ) : (
              <>
                <ReferenceLine
                  y={baseline?.medianPressure}
                  stroke="#2E9E5B"
                  strokeDasharray="4 4"
                  label={{ value: 'Baseline', fill: '#2E9E5B', fontSize: 10, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  name="Observed Pressure (bar)"
                  stroke="#F2B01E"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#F2B01E' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="baselinePressure"
                  name="Baseline Median (bar)"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
