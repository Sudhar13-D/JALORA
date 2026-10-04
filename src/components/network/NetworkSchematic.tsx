import React, { useState } from 'react';
import {
  X,
  Gauge,
  Droplets,
  Radio,
  Network,
  Activity,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { NODES, SEGMENTS, HOUSEHOLDS, DOWNSTREAM_HOUSEHOLDS } from '../../data/topology';
import { TopologyNode } from '../../types';

interface NetworkSchematicProps {
  onSelectHousehold?: (householdId: string) => void;
  onSelectSegment?: (segmentId: string) => void;
  onSelectSensor?: (sensorId: string) => void;
  onSelectNode?: (nodeId: string) => void;
}

export const NetworkSchematic: React.FC<NetworkSchematicProps> = ({
  onSelectHousehold,
  onSelectSegment,
  onSelectSensor,
  onSelectNode,
}) => {
  const {
    getEngineResult,
    getHouseholdScores,
    sensorReadings,
    selectedHouseholdId,
    selectedSegmentId,
    selectedSensorId,
    selectedNodeId,
    setSelectedHouseholdId,
    setSelectedSegmentId,
    setSelectedSensorId,
    setSelectedNodeId,
  } = useAppStore();

  const [hoveredItem, setHoveredItem] = useState<{
    type: 'node' | 'segment' | 'household' | 'sensor';
    id: string;
    title: string;
    subtitle?: string;
    details?: string;
    x: number;
    y: number;
  } | null>(null);

  const engineResult = getEngineResult();
  const householdScores = getHouseholdScores();
  const faultySegmentId = engineResult.hasActiveAlert ? engineResult.topHypothesis?.segmentId : null;

  // Node position map
  const nodeMap = new Map<string, TopologyNode>();
  NODES.forEach((n) => nodeMap.set(n.id, n));

  // Determine household display positions around their feeding segment
  // Carefully spaced with direct pipe connectors to eliminate overlap with segment labels
  const householdPositions: Record<string, { x: number; y: number; connX: number; connY: number }> = {
    // S2 (from T0 (210,170) to J1 (380,170)): H01 placed above pipe
    H01: { x: 295, y: 105, connX: 0, connY: 65 },
    // S3 (from J1 (380,170) to J2 (560,170)): H02, H03, H04 placed above pipe
    H02: { x: 430, y: 105, connX: 0, connY: 65 },
    H03: { x: 470, y: 105, connX: 0, connY: 65 },
    H04: { x: 510, y: 105, connX: 0, connY: 65 },
    // S4 (from J2 (560,170) to E1 (740,170)): H05 placed above pipe
    H05: { x: 650, y: 105, connX: 0, connY: 65 },
    // S5 (vertical from J1 (380,170) up to A1 (380,60)): H06, H07 placed to the left
    H06: { x: 325, y: 90, connX: 55, connY: 0 },
    H07: { x: 325, y: 135, connX: 55, connY: 0 },
    // S6 (vertical from J2 (560,170) up to C1 (560,60)): H08, H09 placed to the right
    H08: { x: 615, y: 90, connX: -55, connY: 0 },
    H09: { x: 615, y: 135, connX: -55, connY: 0 },
    // S7 (vertical from J1 (380,170) down to B1 (380,300)): H10, H11 placed to sides
    H10: { x: 325, y: 235, connX: 55, connY: 0 },
    H11: { x: 435, y: 235, connX: -55, connY: 0 },
    // S8 (horizontal from B1 (380,300) to B2 (620,300)): H12-H20 placed below pipe
    H12: { x: 410, y: 345, connX: 0, connY: -45 },
    H13: { x: 455, y: 345, connX: 0, connY: -45 },
    H14: { x: 500, y: 345, connX: 0, connY: -45 },
    H15: { x: 545, y: 345, connX: 0, connY: -45 },
    H16: { x: 590, y: 345, connX: 0, connY: -45 },
    H17: { x: 432, y: 375, connX: 0, connY: -75 },
    H18: { x: 477, y: 375, connX: 0, connY: -75 },
    H19: { x: 522, y: 375, connX: 0, connY: -75 },
    H20: { x: 567, y: 375, connX: 0, connY: -75 },
  };

  const handleHouseholdClick = (hid: string) => {
    setSelectedHouseholdId(hid);
    if (onSelectHousehold) onSelectHousehold(hid);
  };

  const handleSegmentClick = (sid: string) => {
    setSelectedSegmentId(sid);
    if (onSelectSegment) onSelectSegment(sid);
  };

  const handleNodeClick = (node: TopologyNode) => {
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(node.id);
      if (node.sensorId) {
        setSelectedSensorId(node.sensorId);
        if (onSelectSensor) onSelectSensor(node.sensorId);
      }
      if (onSelectNode) onSelectNode(node.id);
    }
  };

  // Details for currently selected node
  const activeNode = selectedNodeId ? NODES.find((n) => n.id === selectedNodeId) : null;
  const activeReading = activeNode?.sensorId ? sensorReadings[activeNode.sensorId] : null;

  // Inflow & outflow pipes for active node
  const inflowSegments = activeNode ? SEGMENTS.filter((s) => s.toNode === activeNode.id) : [];
  const outflowSegments = activeNode ? SEGMENTS.filter((s) => s.fromNode === activeNode.id) : [];

  // Downstream households for active node
  const nodeDownstreamHhIds = Array.from(
    new Set(
      outflowSegments.flatMap((seg) => DOWNSTREAM_HOUSEHOLDS[seg.id] || [])
    )
  );

  return (
    <div className="relative w-full bg-white dark:bg-[#1C2541] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Network Schematic (Demo Village)
            <span className="text-[11px] font-normal text-slate-500">
              Interactive Topology (9 Nodes, 8 Segments, 20 Households)
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Click any node, pipe, or household tap to inspect hydraulic telemetry and serviced connections.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-500 rounded-xs inline-block" />
            <span>Functional Tap</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-500 rounded-xs inline-block" />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-rose-500 rounded-xs inline-block" />
            <span>Non-functional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-jalora-blue rotate-45 inline-block" />
            <span>Telemetry Sensor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-slate-700 dark:border-slate-300 bg-white inline-block" />
            <span>Junction</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas (Zero-jitter, fixed-scale SVG with no transform bouncing) */}
      <div className="w-full overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131c36]">
        <svg
          viewBox="0 0 820 405"
          className="w-full h-auto min-w-[720px] select-none block"
          style={{ maxHeight: '420px' }}
        >
          <defs>
            {/* Glow Filter for Fault Pulsing */}
            <filter id="faultGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="flowArrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94A3B8" />
            </marker>
          </defs>

          {/* 1. Network Segments (Pipes) */}
          {SEGMENTS.map((seg) => {
            const from = nodeMap.get(seg.fromNode);
            const to = nodeMap.get(seg.toNode);
            if (!from || !to) return null;

            const isFaulty = seg.id === faultySegmentId;
            const isSelected = seg.id === selectedSegmentId;
            const strokeColor = isFaulty
              ? '#D64545'
              : isSelected
              ? '#0070C0'
              : '#94A3B8';
            const strokeWidth = seg.diameterMm >= 80 ? 5 : 3.5;

            // Calculate midpoint for label
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            // Offset label slightly depending on orientation so it does not collide with lines
            const isVertical = from.x === to.x;
            const labelX = isVertical ? midX + 18 : midX;
            const labelY = isVertical ? midY : midY - 12;

            return (
              <g
                key={seg.id}
                className="cursor-pointer"
                onClick={() => handleSegmentClick(seg.id)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    type: 'segment',
                    id: seg.id,
                    title: seg.name,
                    subtitle: `${seg.lengthMeters}m | Dia: ${seg.diameterMm}mm`,
                    details: isFaulty
                      ? `Likely Fault Detected (${engineResult.topHypothesis?.confidenceBand} Conf)`
                      : 'Operating in normal parameters',
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Background line for generous click target */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="transparent"
                  strokeWidth={22}
                />

                {/* Primary Pipe Line */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={strokeColor}
                  strokeWidth={isFaulty ? strokeWidth + 2 : strokeWidth}
                  strokeDasharray={isFaulty ? '6 3' : undefined}
                  className={isFaulty ? 'opacity-90' : 'opacity-100'}
                />

                {/* Pipe Label with crisp background pill */}
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    x="-13"
                    y="-8"
                    width="26"
                    height="16"
                    rx="3"
                    fill="#FFFFFF"
                    className="dark:fill-[#0F172A]"
                    stroke={isFaulty ? '#D64545' : isSelected ? '#0070C0' : '#CBD5E1'}
                    strokeWidth={isSelected || isFaulty ? 1.5 : 1}
                  />
                  <text
                    y="3.5"
                    textAnchor="middle"
                    className={`text-[9px] font-bold select-none pointer-events-none ${
                      isFaulty
                        ? 'fill-rose-600 dark:fill-rose-400'
                        : isSelected
                        ? 'fill-blue-600 dark:fill-blue-400'
                        : 'fill-slate-700 dark:fill-slate-300'
                    }`}
                  >
                    {seg.id}
                  </text>
                </g>

                {/* Pulsing Alert Marker for Faulty Segment (opacity-only pulse, zero geometric scale) */}
                {isFaulty && (
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    className="animate-fault-pulse"
                    filter="url(#faultGlow)"
                  >
                    <circle r="12" fill="#D64545" opacity="0.35" />
                    <circle r="8" fill="#D64545" />
                    <line x1="-4" y1="-4" x2="4" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4" y1="-4" x2="-4" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Nodes (Tank, Sensors, Junctions, Tail End) */}
          {NODES.map((node) => {
            const isTank = node.type === 'tank';
            const hasSensor = node.hasSensor;
            const reading = node.sensorId ? sensorReadings[node.sensorId] : null;
            const isNodeSelected = node.id === selectedNodeId;
            const isSensorSelected = node.sensorId && node.sensorId === selectedSensorId;
            const isSelected = isNodeSelected || isSensorSelected;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onClick={() => handleNodeClick(node)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    type: node.type === 'sensor' ? 'sensor' : 'node',
                    id: node.id,
                    title: node.name,
                    subtitle: reading
                      ? `Flow: ${reading.flowLpm} LPM | Press: ${reading.pressureBar} bar`
                      : node.type.toUpperCase(),
                    details: node.sensorId ? `Sensor: ${node.sensorId}` : 'Hydraulic Junction',
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Steady Selection Halo (No scale shifts) */}
                {isSelected && (
                  <circle
                    r="22"
                    fill="none"
                    stroke="#0070C0"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="opacity-95"
                  />
                )}

                {/* Tank Node */}
                {isTank ? (
                  <g>
                    <rect
                      x="-24"
                      y="-20"
                      width="48"
                      height="40"
                      rx="6"
                      fill="#1F3864"
                      stroke={isSelected ? '#0070C0' : '#0070C0'}
                      strokeWidth={isSelected ? '3.5' : '2.5'}
                    />
                    <text
                      y="4"
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-white select-none pointer-events-none tracking-wider"
                    >
                      TANK
                    </text>
                  </g>
                ) : hasSensor ? (
                  /* Diamond Sensor */
                  <g>
                    <polygon
                      points="0,-13 13,0 0,13 -13,0"
                      fill={isSelected ? '#0070C0' : '#1F3864'}
                      stroke={
                        reading?.status === 'unresolved_anomaly'
                          ? '#F2B01E'
                          : isSelected
                          ? '#38BDF8'
                          : '#0070C0'
                      }
                      strokeWidth={isSelected ? '3' : '2.5'}
                    />

                    {/* Node ID Badge Plate */}
                    <g transform="translate(0, -18)">
                      <rect
                        x="-14"
                        y="-8"
                        width="28"
                        height="15"
                        rx="3"
                        fill="#FFFFFF"
                        className="dark:fill-[#0F172A]"
                        stroke={isSelected ? '#0070C0' : '#CBD5E1'}
                        strokeWidth="1"
                      />
                      <text
                        y="3"
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-slate-900 dark:fill-slate-100 select-none pointer-events-none"
                      >
                        {node.id}
                      </text>
                    </g>

                    {/* Live Sensor Telemetry Badge Plate (Clean and readable) */}
                    {reading && (
                      <g transform="translate(0, 24)">
                        <rect
                          x="-38"
                          y="-8"
                          width="76"
                          height="16"
                          rx="3"
                          fill="#FFFFFF"
                          className="dark:fill-[#0F172A]"
                          stroke="#CBD5E1"
                          strokeWidth="1"
                        />
                        <text
                          y="3.5"
                          textAnchor="middle"
                          className="text-[9px] font-mono font-semibold fill-slate-800 dark:fill-slate-200 select-none pointer-events-none"
                        >
                          {reading.flowLpm}L | {reading.pressureBar}b
                        </text>
                      </g>
                    )}
                  </g>
                ) : (
                  /* Normal Junction Node */
                  <g>
                    <circle
                      r="7"
                      fill={isSelected ? '#0070C0' : '#FFFFFF'}
                      stroke="#1F3864"
                      strokeWidth={isSelected ? '3' : '2.5'}
                    />
                    {/* Node ID Badge Plate */}
                    <g transform="translate(0, -16)">
                      <rect
                        x="-12"
                        y="-7"
                        width="24"
                        height="14"
                        rx="3"
                        fill="#FFFFFF"
                        className="dark:fill-[#0F172A]"
                        stroke={isSelected ? '#0070C0' : '#CBD5E1'}
                        strokeWidth="1"
                      />
                      <text
                        y="3"
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-slate-800 dark:fill-slate-200 select-none pointer-events-none"
                      >
                        {node.id}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}

          {/* 3. Household Squares (Color coded by FHTC Status) */}
          {HOUSEHOLDS.map((hh) => {
            const pos = householdPositions[hh.id];
            if (!pos) return null;

            const scoreObj = householdScores[hh.id];
            const status = scoreObj?.status || 'functional';
            const score = scoreObj?.totalScore ?? 85;
            const isSelected = hh.id === selectedHouseholdId;

            let fillColor = '#2E9E5B'; // functional green
            if (status === 'at_risk') fillColor = '#F2B01E'; // amber
            if (status === 'non_functional') fillColor = '#D64545'; // rose

            return (
              <g
                key={hh.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => handleHouseholdClick(hh.id)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({
                    type: 'household',
                    id: hh.id,
                    title: `${hh.id}: ${hh.name}`,
                    subtitle: `Branch: ${hh.segmentId} | Score: ${score}/100 (${status})`,
                    details: scoreObj?.forcedOutage
                      ? scoreObj.forcedReason
                      : `Rep rate: ${(hh.reportingRate * 100).toFixed(0)}%`,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 8,
                  });
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Thin dashed connection line cleanly connecting to feeding pipe */}
                <line
                  x1="0"
                  y1="0"
                  x2={pos.connX}
                  y2={pos.connY}
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  className="opacity-70"
                />

                {/* Steady Household Tap Square (No scale transforms on hover) */}
                <rect
                  x="-8"
                  y="-8"
                  width="16"
                  height="16"
                  rx="3"
                  fill={fillColor}
                  stroke={isSelected ? '#0070C0' : '#FFFFFF'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                />

                {/* Steady Selection Ring */}
                {isSelected && (
                  <rect
                    x="-12"
                    y="-12"
                    width="24"
                    height="24"
                    rx="5"
                    fill="none"
                    stroke="#0070C0"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Household Label with clean positioning */}
                <text
                  y={pos.connY < 0 ? '19' : '-12'}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-slate-700 dark:fill-slate-300 select-none pointer-events-none"
                >
                  {hh.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Rock-Solid Selected Node Inspection Card (Renders stably when any node is clicked) */}
      {activeNode && (
        <div className="mt-3 p-3.5 bg-slate-50 dark:bg-[#131c36] border border-blue-200 dark:border-blue-900/60 rounded-xl shadow-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-jalora-blue/15 text-jalora-blue flex items-center justify-center font-bold">
                {activeNode.type === 'tank' ? (
                  <Droplets size={18} />
                ) : activeNode.hasSensor ? (
                  <Radio size={18} />
                ) : (
                  <Network size={18} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeNode.name} ({activeNode.id})
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 capitalize">
                    {activeNode.type.replace('_', ' ')}
                  </span>
                  {activeReading?.status === 'unresolved_anomaly' && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
                      <AlertCircle size={10} /> Hydraulic Anomaly
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Coordinates: ({activeNode.x}m, {activeNode.y}m) &bull;{' '}
                  {activeNode.sensorId ? `Equipped with Sensor [${activeNode.sensorId}]` : 'Passive Distribution Node'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Close node inspector"
            >
              <X size={16} />
            </button>
          </div>

          {/* Telemetry Metrics & Topology Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
            {/* 1. Flow Telemetry */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#1C2541] border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Activity size={12} className="text-jalora-blue" /> Instant Flow Rate
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {activeReading ? `${activeReading.flowLpm} LPM` : 'N/A (Passive)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeReading ? 'Target: ~180 LPM during supply' : 'No flow meter installed'}
              </p>
            </div>

            {/* 2. Pressure Telemetry */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#1C2541] border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Gauge size={12} className="text-emerald-500" /> Dynamic Pressure
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {activeReading ? `${activeReading.pressureBar} bar` : 'N/A (Passive)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeReading ? 'Maint. Limit &ge; 0.20 bar' : 'Calculated via downstream head'}
              </p>
            </div>

            {/* 3. Inflow & Outflow Segments */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#1C2541] border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Network size={12} className="text-indigo-500" /> Pipe Connections
              </span>
              <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                <p>
                  Inflow:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {inflowSegments.map((s) => s.id).join(', ') || 'Source (Tank)'}
                  </span>
                </p>
                <p className="mt-0.5">
                  Outflow:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {outflowSegments.map((s) => s.id).join(', ') || 'Terminal'}
                  </span>
                </p>
              </div>
            </div>

            {/* 4. Serviced Households */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#1C2541] border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <ShieldCheck size={12} className="text-purple-500" /> Serviced Households
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {nodeDownstreamHhIds.length}
                </span>
                <span className="text-xs text-slate-400">/ 20 Village Taps</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px]">
                {nodeDownstreamHhIds.slice(0, 5).map((hid) => (
                  <span
                    key={hid}
                    onClick={() => handleHouseholdClick(hid)}
                    className="px-1.5 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    {hid}
                  </span>
                ))}
                {nodeDownstreamHhIds.length > 5 && (
                  <span className="text-slate-400 font-mono">+{nodeDownstreamHhIds.length - 5}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Interactive Hover Tooltip (Safe pointer-events-none, never flickers) */}
      {hoveredItem && !activeNode && (
        <div
          className="fixed z-50 pointer-events-none p-2 bg-slate-900/95 text-white rounded-lg shadow-xl text-xs -translate-x-1/2 -translate-y-full mb-3 backdrop-blur-xs border border-slate-700"
          style={{ left: hoveredItem.x, top: hoveredItem.y }}
        >
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>{hoveredItem.title}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
              {hoveredItem.id}
            </span>
          </p>
          {hoveredItem.subtitle && (
            <p className="text-slate-300 text-[11px] mt-0.5">{hoveredItem.subtitle}</p>
          )}
          {hoveredItem.details && (
            <p className="text-blue-300 text-[10px] mt-0.5 font-medium">{hoveredItem.details}</p>
          )}
        </div>
      )}
    </div>
  );
};
