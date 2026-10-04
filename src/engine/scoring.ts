import {
  SensorBaseline,
  SensorReading,
  CitizenComplaint,
  SegmentHypothesis,
  EngineResult,
  HouseholdFHTCScore,
  SegmentRisk,
  EvidenceItem,
  ConfidenceBand
} from '../types';
import {
  SEGMENTS,
  HOUSEHOLDS,
  DOWNSTREAM_HOUSEHOLDS,
  UPSTREAM_SEGMENTS
} from '../data/topology';

export interface EngineWeights {
  w1_flow: number;
  w2_pressure: number;
  w3_complaints: number;
}

export interface FHTCWeights {
  supply: number;
  flowPressure: number;
  complaints: number;
  history: number;
}

export interface FHTCThresholds {
  functionalMin: number; // default 75
  atRiskMin: number; // default 40
}

export const DEFAULT_WEIGHTS: EngineWeights = {
  w1_flow: 0.35,
  w2_pressure: 0.25,
  w3_complaints: 0.40,
};

export const DEFAULT_FHTC_WEIGHTS: FHTCWeights = {
  supply: 0.35,
  flowPressure: 0.25,
  complaints: 0.20,
  history: 0.20,
};

export const DEFAULT_FHTC_THRESHOLDS: FHTCThresholds = {
  functionalMin: 75,
  atRiskMin: 40,
};

// Check if a simulated time is inside a supply window (06:00-08:00 or 17:00-19:00)
export function isSupplyWindow(simulatedDate: Date): { inWindow: boolean; windowName: 'morning' | 'evening' | 'off_schedule' } {
  const hours = simulatedDate.getHours();
  const minutes = simulatedDate.getMinutes();
  const timeVal = hours + minutes / 60;

  if (timeVal >= 6.0 && timeVal < 8.0) {
    return { inWindow: true, windowName: 'morning' };
  }
  if (timeVal >= 17.0 && timeVal < 19.0) {
    return { inWindow: true, windowName: 'evening' };
  }
  return { inWindow: false, windowName: 'off_schedule' };
}

// Robust Z-score calculation: |x - median| / (1.4826 * MAD)
export function calculateRobustZScore(value: number, median: number, mad: number): number {
  if (mad <= 0.0001) return 0;
  return Math.abs(value - median) / (1.4826 * mad);
}

// 7-day pre-generated baselines for morning and evening windows
export const SENSOR_BASELINES: Record<string, Record<'morning' | 'evening', SensorBaseline>> = {
  'SN-T0': {
    morning: { sensorId: 'SN-T0', window: 'morning', medianFlow: 185.0, madFlow: 4.2, medianPressure: 2.45, madPressure: 0.06 },
    evening: { sensorId: 'SN-T0', window: 'evening', medianFlow: 182.0, madFlow: 4.0, medianPressure: 2.42, madPressure: 0.06 },
  },
  'SN-J1': {
    morning: { sensorId: 'SN-J1', window: 'morning', medianFlow: 172.0, madFlow: 3.8, medianPressure: 2.15, madPressure: 0.05 },
    evening: { sensorId: 'SN-J1', window: 'evening', medianFlow: 170.0, madFlow: 3.6, medianPressure: 2.12, madPressure: 0.05 },
  },
  'SN-J2': {
    morning: { sensorId: 'SN-J2', window: 'morning', medianFlow: 92.0, madFlow: 2.8, medianPressure: 1.75, madPressure: 0.04 },
    evening: { sensorId: 'SN-J2', window: 'evening', medianFlow: 90.0, madFlow: 2.6, medianPressure: 1.72, madPressure: 0.04 },
  },
  'SN-E1': {
    morning: { sensorId: 'SN-E1', window: 'morning', medianFlow: 46.0, madFlow: 2.0, medianPressure: 1.25, madPressure: 0.03 },
    evening: { sensorId: 'SN-E1', window: 'evening', medianFlow: 44.0, madFlow: 1.9, medianPressure: 1.22, madPressure: 0.03 },
  },
  'SN-B1': {
    morning: { sensorId: 'SN-B1', window: 'morning', medianFlow: 76.0, madFlow: 2.4, medianPressure: 1.82, madPressure: 0.04 },
    evening: { sensorId: 'SN-B1', window: 'evening', medianFlow: 74.0, madFlow: 2.2, medianPressure: 1.80, madPressure: 0.04 },
  },
  'SN-B2': {
    morning: { sensorId: 'SN-B2', window: 'morning', medianFlow: 54.0, madFlow: 2.1, medianPressure: 1.34, madPressure: 0.03 },
    evening: { sensorId: 'SN-B2', window: 'evening', medianFlow: 52.0, madFlow: 2.0, medianPressure: 1.32, madPressure: 0.03 },
  },
};

// Check if a sensor reading is deviated (>3.5 robust Z-score)
export function evaluateSensorDeviation(
  reading: SensorReading,
  baseline: SensorBaseline,
  inSupplyWindow: boolean
): { flowDeviated: boolean; pressureDeviated: boolean; zFlow: number; zPressure: number } {
  if (!inSupplyWindow) {
    return { flowDeviated: false, pressureDeviated: false, zFlow: 0, zPressure: 0 };
  }

  const zFlow = calculateRobustZScore(reading.flowLpm, baseline.medianFlow, baseline.madFlow);
  const zPressure = calculateRobustZScore(reading.pressureBar, baseline.medianPressure, baseline.madPressure);

  return {
    flowDeviated: zFlow > 3.5,
    pressureDeviated: zPressure > 3.5,
    zFlow,
    zPressure
  };
}

// Calculate weighted Jaccard index between predicted affected households and actual complaints
export function calculateWeightedJaccard(
  segmentId: string,
  complaints: CitizenComplaint[]
): { score: number; complainingDownstreamCount: number; complainingUpstreamCount: number } {
  const downstreamSet = new Set(DOWNSTREAM_HOUSEHOLDS[segmentId] || []);
  
  // Valid synced or verified complaints
  const activeComplaints = complaints.filter(c => c.status !== 'rejected' && c.status !== 'merged');
  if (activeComplaints.length === 0) {
    return { score: 0, complainingDownstreamCount: 0, complainingUpstreamCount: 0 };
  }

  // Map to distinct household with highest weight complaint
  const complaintByHousehold = new Map<string, CitizenComplaint>();
  for (const c of activeComplaints) {
    const existing = complaintByHousehold.get(c.householdId);
    if (!existing || (c.gpsWeight * c.reportingWeight > existing.gpsWeight * existing.reportingWeight)) {
      complaintByHousehold.set(c.householdId, c);
    }
  }

  let intersectionWeight = 0;
  let unionWeight = 0;
  let complainingDownstreamCount = 0;
  let complainingUpstreamCount = 0;

  // Add all households in the predicted downstream set
  for (const hid of downstreamSet) {
    const hh = HOUSEHOLDS.find(h => h.id === hid);
    const baseWeight = hh ? hh.reportingRate : 0.5;

    if (complaintByHousehold.has(hid)) {
      const complaint = complaintByHousehold.get(hid)!;
      const effectiveWeight = complaint.gpsWeight * baseWeight;
      intersectionWeight += effectiveWeight;
      unionWeight += effectiveWeight;
      complainingDownstreamCount++;
    } else {
      // Household in downstream set that didn't complain yet
      unionWeight += baseWeight * 0.4;
    }
  }

  // Add complaining households that are NOT in the downstream set (penalizes wrong segment hypotheses)
  for (const [hid, complaint] of complaintByHousehold.entries()) {
    if (!downstreamSet.has(hid)) {
      const effectiveWeight = complaint.gpsWeight * complaint.reportingWeight;
      unionWeight += effectiveWeight;
      complainingUpstreamCount++;
    }
  }

  const score = unionWeight > 0 ? Math.min(1, Math.max(0, intersectionWeight / unionWeight)) : 0;
  return { score, complainingDownstreamCount, complainingUpstreamCount };
}

// Primary Segment Failure Hypothesis Scorer
export function scoreSegments(
  sensorReadings: Record<string, SensorReading>,
  recentHistoryReadings: Record<string, SensorReading[]>, // last 3+ consecutive samples
  complaints: CitizenComplaint[],
  simulatedDate: Date,
  weights: EngineWeights = DEFAULT_WEIGHTS
): EngineResult {
  const { inWindow, windowName } = isSupplyWindow(simulatedDate);
  const normalizedWindow = windowName === 'off_schedule' ? 'morning' : windowName;

  // Normalize weights so sum is 1.0
  const weightSum = weights.w1_flow + weights.w2_pressure + weights.w3_complaints || 1;
  const w1 = weights.w1_flow / weightSum;
  const w2 = weights.w2_pressure / weightSum;
  const w3 = weights.w3_complaints / weightSum;

  const hypotheses: SegmentHypothesis[] = [];
  const unresolvedSensors: string[] = [];

  // Check sensor health & 3-consecutive sample deviation
  const sensorStatusMap = new Map<string, { flowDev: boolean; pressDev: boolean; consecutiveDeviations: number }>();
  for (const [sensorId, reading] of Object.entries(sensorReadings)) {
    const baseline = SENSOR_BASELINES[sensorId]?.[normalizedWindow];
    if (!baseline) continue;

    const history = recentHistoryReadings[sensorId] || [reading];
    let consecutiveCount = 0;
    for (const h of history.slice(-3)) {
      const dev = evaluateSensorDeviation(h, baseline, inWindow);
      if (dev.flowDeviated || dev.pressureDeviated) {
        consecutiveCount++;
      }
    }

    const currentDev = evaluateSensorDeviation(reading, baseline, inWindow);
    sensorStatusMap.set(sensorId, {
      flowDev: currentDev.flowDeviated,
      pressDev: currentDev.pressureDeviated,
      consecutiveDeviations: consecutiveCount
    });

    // Anomaly requires 3 consecutive samples inside supply window
    if (inWindow && consecutiveCount >= 3) {
      // Check if any downstream households have complaints
      const downstreamHh = Object.entries(DOWNSTREAM_HOUSEHOLDS).filter(([segId]) => {
        const seg = SEGMENTS.find(s => s.id === segId);
        return seg?.upstreamSensorId === sensorId || seg?.downstreamSensorId === sensorId;
      }).flatMap(([, hhs]) => hhs);

      const hasDownstreamComplaints = complaints.some(c => 
        downstreamHh.includes(c.householdId) && c.status !== 'rejected' && c.status !== 'merged'
      );

      if (!hasDownstreamComplaints) {
        unresolvedSensors.push(sensorId);
      }
    }
  }

  // If outside supply window, ZERO flow is normal and NO alerts/hypotheses are raised
  if (!inWindow) {
    return {
      hasActiveAlert: false,
      topHypothesis: null,
      hypotheses: SEGMENTS.map((s, idx) => ({
        segmentId: s.id,
        segmentName: s.name,
        score: 0,
        flowScore: 0,
        pressureScore: 0,
        complaintScore: 0,
        confidenceBand: 'Low',
        confidencePercent: 0,
        faultType: 'none',
        affectedHouseholds: DOWNSTREAM_HOUSEHOLDS[s.id] || [],
        downstreamHouseholdsCount: (DOWNSTREAM_HOUSEHOLDS[s.id] || []).length,
        complainingHouseholdsCount: 0,
        upstreamComplainingCount: 0,
        isIndistinguishable: false,
        evidence: [{
          id: `ev-off-${s.id}`,
          type: 'flow',
          description: 'Off-schedule supply window: zero flow is expected and normal',
          observedValue: '0 LPM',
          baselineValue: '0 LPM',
          direction: 'neutral'
        }],
        recommendedAction: 'No action required during non-supply window',
        rank: idx + 1
      })),
      unresolvedSensors: [],
      isSupplyWindow: false,
      activeWindowName: 'off_schedule',
      timestamp: simulatedDate.toISOString(),
      computedWeights: { w1_flow: w1, w2_pressure: w2, w3_complaints: w3 }
    };
  }

  // Inside supply window: evaluate each segment
  for (const seg of SEGMENTS) {
    const upSensor = seg.upstreamSensorId ? sensorReadings[seg.upstreamSensorId] : undefined;
    const downSensor = seg.downstreamSensorId ? sensorReadings[seg.downstreamSensorId] : undefined;
    const upBaseline = seg.upstreamSensorId ? SENSOR_BASELINES[seg.upstreamSensorId]?.[normalizedWindow] : undefined;
    const downBaseline = seg.downstreamSensorId ? SENSOR_BASELINES[seg.downstreamSensorId]?.[normalizedWindow] : undefined;

    const downstreamHhList = DOWNSTREAM_HOUSEHOLDS[seg.id] || [];
    const jaccard = calculateWeightedJaccard(seg.id, complaints);

    let flowScore = 0;
    let pressureScore = 0;
    let faultType: 'blockage' | 'leak' | 'sensor_anomaly' | 'none' = 'none';
    const evidence: EvidenceItem[] = [];

    // Evaluate flow & pressure deviations
    if (upSensor && downSensor && upBaseline && downBaseline) {
      const upFlowDiff = (upSensor.flowLpm - upBaseline.medianFlow) / upBaseline.medianFlow;
      const downFlowDiff = (downSensor.flowLpm - downBaseline.medianFlow) / downBaseline.medianFlow;
      const upPressDiff = (upSensor.pressureBar - upBaseline.medianPressure) / upBaseline.medianPressure;
      const downPressDiff = (downSensor.pressureBar - downBaseline.medianPressure) / downBaseline.medianPressure;

      // Leak signature: flow imbalance across segment (up high/normal, down lower) + downstream pressure drop
      const isLeakFlow = upFlowDiff > -0.10 && downFlowDiff < -0.25;
      const isLeakPress = downPressDiff < -0.20;

      // Blockage signature: severely reduced downstream flow + abnormally high upstream pressure (backpressure) + downstream pressure drop
      const isBlockageFlow = downFlowDiff < -0.35;
      const isBlockagePress = upPressDiff > 0.08 && downPressDiff < -0.25;

      if (isBlockageFlow && isBlockagePress) {
        faultType = 'blockage';
        flowScore = Math.min(1, Math.abs(downFlowDiff) * 1.2);
        // Both backpressure and downstream drop strongly indicate blockage
        pressureScore = Math.min(1, Math.abs(downPressDiff) * 1.1 + (upPressDiff > 0.05 ? 0.3 : 0));
        evidence.push({
          id: `ev-flow-${seg.id}`,
          type: 'flow',
          description: `Downstream flow at ${downSensor.sensorId} is severely suppressed`,
          observedValue: `${downSensor.flowLpm.toFixed(1)} LPM`,
          baselineValue: `${downBaseline.medianFlow.toFixed(1)} LPM`,
          deviationPercent: Math.round(downFlowDiff * 100),
          direction: 'down'
        });
        evidence.push({
          id: `ev-press-${seg.id}`,
          type: 'pressure',
          description: `Backpressure build-up at upstream ${upSensor.sensorId} with downstream drop at ${downSensor.sensorId}`,
          observedValue: `Up ${upSensor.pressureBar.toFixed(2)} bar / Down ${downSensor.pressureBar.toFixed(2)} bar`,
          baselineValue: `Up ${upBaseline.medianPressure.toFixed(2)} bar / Down ${downBaseline.medianPressure.toFixed(2)} bar`,
          deviationPercent: Math.round(downPressDiff * 100),
          direction: 'down'
        });
      } else if (isLeakFlow && isLeakPress) {
        faultType = 'leak';
        flowScore = Math.min(1, (Math.abs(upFlowDiff - downFlowDiff)) * 1.5);
        pressureScore = Math.min(1, Math.abs(downPressDiff) * 1.3);
        evidence.push({
          id: `ev-flow-${seg.id}`,
          type: 'flow',
          description: `Flow imbalance detected across segment (${seg.name}): outflow significantly lower than inflow`,
          observedValue: `In ${upSensor.flowLpm.toFixed(1)} LPM vs Out ${downSensor.flowLpm.toFixed(1)} LPM`,
          baselineValue: `Expected balance ~${(upBaseline.medianFlow - downBaseline.medianFlow).toFixed(1)} LPM difference`,
          direction: 'down'
        });
        evidence.push({
          id: `ev-press-${seg.id}`,
          type: 'pressure',
          description: `Downstream pressure at ${downSensor.sensorId} collapsed by ${Math.round(Math.abs(downPressDiff) * 100)}%`,
          observedValue: `${downSensor.pressureBar.toFixed(2)} bar`,
          baselineValue: `${downBaseline.medianPressure.toFixed(2)} bar`,
          deviationPercent: Math.round(downPressDiff * 100),
          direction: 'down'
        });
      } else if (downPressDiff < -0.25 || downFlowDiff < -0.25) {
        // Downward deviation only indicates possible failure on this segment
        flowScore = Math.min(0.6, Math.max(0, -downFlowDiff));
        pressureScore = Math.min(0.6, Math.max(0, -downPressDiff));
      }
    } else if (downSensor && downBaseline) {
      // Single sensor available (e.g. S1 only has downstream T0)
      const downFlowDiff = (downSensor.flowLpm - downBaseline.medianFlow) / downBaseline.medianFlow;
      const downPressDiff = (downSensor.pressureBar - downBaseline.medianPressure) / downBaseline.medianPressure;
      if (downFlowDiff < -0.30 && downPressDiff < -0.20) {
        flowScore = Math.min(1, Math.abs(downFlowDiff));
        pressureScore = Math.min(1, Math.abs(downPressDiff));
      }
    }

    // If segment has sensors and they are confirmed normal (flow and pressure within normal limits),
    // discount complaints attribution to this segment because downstream sensors verify water reaches here
    let complaintDiscount = 1.0;
    if (downSensor && downBaseline) {
      const downFlowDiff = (downSensor.flowLpm - downBaseline.medianFlow) / downBaseline.medianFlow;
      const downPressDiff = (downSensor.pressureBar - downBaseline.medianPressure) / downBaseline.medianPressure;
      if (Math.abs(downFlowDiff) < 0.10 && Math.abs(downPressDiff) < 0.10) {
        complaintDiscount = 0.15; // Sensor confirms normal supply flowing out of this segment
      }
    }

    // Add complaint evidence
    const activeComplaintsCount = complaints.filter(c => c.status !== 'rejected' && c.status !== 'merged').length;
    if (activeComplaintsCount > 0) {
      evidence.push({
        id: `ev-comp-${seg.id}`,
        type: 'complaints',
        description: `${jaccard.complainingDownstreamCount} of ${downstreamHhList.length} downstream households reported issues (${jaccard.complainingUpstreamCount} upstream)`,
        observedValue: `${jaccard.complainingDownstreamCount} complaints`,
        direction: jaccard.complainingDownstreamCount > 0 ? 'up' : 'neutral'
      });
    }

    const complaintScore = jaccard.score * complaintDiscount;
    const rawScore = (w1 * flowScore) + (w2 * pressureScore) + (w3 * complaintScore);

    // Recommended action based on fault
    let recommendedAction = 'Continue routine monitoring';
    if (faultType === 'blockage') {
      recommendedAction = `Dispatch field crew to inspect pipe segment ${seg.name} for physical obstruction or airlock.`;
    } else if (faultType === 'leak') {
      recommendedAction = `Inspect segment ${seg.name} joints and valves for underground leakage.`;
    } else if (rawScore > 0.3) {
      recommendedAction = `Inspect segment ${seg.name} and verify pressure at node ${seg.toNode}.`;
    }

    hypotheses.push({
      segmentId: seg.id,
      segmentName: seg.name,
      score: rawScore,
      flowScore,
      pressureScore,
      complaintScore,
      confidenceBand: 'Low',
      confidencePercent: 0,
      faultType,
      affectedHouseholds: downstreamHhList,
      downstreamHouseholdsCount: downstreamHhList.length,
      complainingHouseholdsCount: jaccard.complainingDownstreamCount,
      upstreamComplainingCount: jaccard.complainingUpstreamCount,
      isIndistinguishable: false,
      evidence,
      recommendedAction,
      rank: 1
    });
  }

  // Calculate sum of scores across all segments
  const totalScoreSum = hypotheses.reduce((acc, h) => acc + h.score, 0);

  // Confidence calculation and rule applications
  const activeComplaintsCount = complaints.filter(c => c.status !== 'rejected' && c.status !== 'merged').length;

  for (const h of hypotheses) {
    const confRatio = totalScoreSum > 0.001 ? (h.score / totalScoreSum) : 0;
    let percent = Math.round(confRatio * 100);

    // Rule 1: NO complaints never means normal supply and CAPS confidence at Moderate (<60%)
    if (activeComplaintsCount === 0 && percent >= 60) {
      percent = 55;
    }

    // Determine band
    let band: ConfidenceBand;
    if (percent >= 60 && activeComplaintsCount > 0) {
      band = 'High';
    } else if (percent >= 35) {
      band = 'Moderate';
    } else {
      band = 'Low';
    }

    h.confidencePercent = percent;
    h.confidenceBand = band;
  }

  // Sort descending by score
  hypotheses.sort((a, b) => b.score - a.score);
  hypotheses.forEach((h, idx) => {
    h.rank = idx + 1;
  });

  // Rule 4: Two series segments with no sensor between them and scores within 10% get "Indistinguishable" badge
  for (let i = 0; i < hypotheses.length - 1; i++) {
    const h1 = hypotheses[i];
    const h2 = hypotheses[i + 1];
    if (h1.score > 0.25 && h2.score > 0.25) {
      const diffRatio = Math.abs(h1.score - h2.score) / Math.max(h1.score, h2.score);
      // Check if series segments without intervening sensors (e.g. S5 & S6 or S1 & S2)
      if (diffRatio <= 0.10) {
        h1.isIndistinguishable = true;
        h1.indistinguishableWithSegmentId = h2.segmentId;
        h2.isIndistinguishable = true;
        h2.indistinguishableWithSegmentId = h1.segmentId;
      }
    }
  }

  const topHypothesis = hypotheses[0]?.score > 0.15 ? hypotheses[0] : null;
  const hasActiveAlert = topHypothesis !== null && topHypothesis.confidenceBand !== 'Low';

  return {
    hasActiveAlert,
    topHypothesis,
    hypotheses,
    unresolvedSensors,
    isSupplyWindow: inWindow,
    activeWindowName: windowName,
    timestamp: simulatedDate.toISOString(),
    computedWeights: { w1_flow: w1, w2_pressure: w2, w3_complaints: w3 }
  };
}

// FHTC Service Score calculation for a household
export function calculateHouseholdFHTCScore(
  householdId: string,
  confirmedOutageSegments: string[], // segments with confirmed active faults
  complaints: CitizenComplaint[],
  simulatedDate: Date,
  weights: FHTCWeights = DEFAULT_FHTC_WEIGHTS,
  thresholds: FHTCThresholds = DEFAULT_FHTC_THRESHOLDS
): HouseholdFHTCScore {
  const hh = HOUSEHOLDS.find(h => h.id === householdId);
  const segmentId = hh ? hh.segmentId : 'S2';
  const upstreamPath = UPSTREAM_SEGMENTS[segmentId] || [segmentId];

  // If ANY segment on its path from the tank has failed, force Non-functional
  const isUpstreamOutage = upstreamPath.some(segId => confirmedOutageSegments.includes(segId));

  // Count recent verified/pending complaints from this household
  const recentComplaints = complaints.filter(c => 
    c.householdId === householdId && 
    c.status !== 'rejected' && 
    c.status !== 'merged'
  );

  // Components (0 to 1)
  // 1. Supply share: scheduled windows with flow
  const supplyShare = isUpstreamOutage ? 0.05 : 0.98;
  // 2. Flow/Pressure health: 0.95 normal, 0.10 if outage
  const flowPressureHealth = isUpstreamOutage ? 0.08 : 0.94;
  // 3. Complaint penalty: drops with complaints
  const complaintPenalty = Math.max(0.1, 1.0 - recentComplaints.length * 0.35);
  // 4. History health: past 30-day reliability (seeded ~0.92)
  const outageDaysLast30 = isUpstreamOutage ? 3 : 0;
  const historyHealth = Math.max(0.2, 0.95 - (outageDaysLast30 * 0.15));

  const totalRaw = 100 * (
    weights.supply * supplyShare +
    weights.flowPressure * flowPressureHealth +
    weights.complaints * complaintPenalty +
    weights.history * historyHealth
  );

  let finalScore = Math.round(totalRaw);

  // Forced outage override:
  if (isUpstreamOutage) {
    finalScore = Math.min(finalScore, 28); // Force Non-functional (<40)
  }

  let status: 'functional' | 'at_risk' | 'non_functional';
  if (isUpstreamOutage) {
    status = 'non_functional';
  } else if (finalScore >= thresholds.functionalMin) {
    status = 'functional';
  } else if (finalScore >= thresholds.atRiskMin) {
    status = 'at_risk';
  } else {
    status = 'non_functional';
  }

  return {
    householdId,
    totalScore: finalScore,
    status,
    components: {
      supplyShare,
      flowPressureHealth,
      complaintPenalty,
      historyHealth,
    },
    componentWeights: weights,
    forcedOutage: isUpstreamOutage,
    forcedReason: isUpstreamOutage ? `Direct supply outage due to active upstream failure on ${upstreamPath.filter(s => confirmedOutageSegments.includes(s)).join(', ')}` : undefined,
    recentComplaintsCount: recentComplaints.length,
    outageDaysLast30,
  };
}

// Segment Maintenance Risk calculation (Low / Medium / High)
// Seeded history so S4 = Medium and S7 = High
export function getSegmentRiskEvaluations(): SegmentRisk[] {
  return [
    {
      segmentId: 'S7',
      segmentName: 'S7: J1 - B1',
      riskLevel: 'High',
      points: 86,
      drivers: [
        'Repeat pressure transients recorded (4 events in 14 days)',
        'Slow past restorations (avg 9.4 hours vs 3.2 hr target)',
        'Heavy mechanical stress at Junction J1 tee-splitter'
      ],
      suggestedInspectionOrder: 1,
      anomalyFrequency14d: 4,
      hasRepeatFaults: true,
      avgRestorationHours: 9.4
    },
    {
      segmentId: 'S4',
      segmentName: 'S4: J2 - E1',
      riskLevel: 'Medium',
      points: 58,
      drivers: [
        'Tail-end pressure attenuation during peak draw',
        '2 historical valve seating anomalies in last 30 days',
        'Moderate sediment accumulation tendency'
      ],
      suggestedInspectionOrder: 2,
      anomalyFrequency14d: 2,
      hasRepeatFaults: false,
      avgRestorationHours: 5.1
    },
    {
      segmentId: 'S8',
      segmentName: 'S8: B1 - B2',
      riskLevel: 'Medium',
      points: 52,
      drivers: [
        'Longest branch segment (280m, 9 downstream connections)',
        'Slight gradient variance causing air-pocket vulnerability'
      ],
      suggestedInspectionOrder: 3,
      anomalyFrequency14d: 1,
      hasRepeatFaults: false,
      avgRestorationHours: 4.0
    },
    {
      segmentId: 'S3',
      segmentName: 'S3: J1 - J2',
      riskLevel: 'Low',
      points: 24,
      drivers: ['Stable flow profile', 'Recent valve maintenance performed'],
      suggestedInspectionOrder: 4,
      anomalyFrequency14d: 0,
      hasRepeatFaults: false,
      avgRestorationHours: 2.5
    },
    {
      segmentId: 'S2',
      segmentName: 'S2: T0 - J1',
      riskLevel: 'Low',
      points: 18,
      drivers: ['Main feeder ductile pipe in excellent condition'],
      suggestedInspectionOrder: 5,
      anomalyFrequency14d: 0,
      hasRepeatFaults: false,
      avgRestorationHours: 2.0
    },
    {
      segmentId: 'S1',
      segmentName: 'S1: TANK - T0',
      riskLevel: 'Low',
      points: 12,
      drivers: ['Short gravity outlet, reinforced concrete encasement'],
      suggestedInspectionOrder: 6,
      anomalyFrequency14d: 0,
      hasRepeatFaults: false,
      avgRestorationHours: 1.8
    },
    {
      segmentId: 'S5',
      segmentName: 'S5: J1 - A1',
      riskLevel: 'Low',
      points: 15,
      drivers: ['Short spur line, low load'],
      suggestedInspectionOrder: 7,
      anomalyFrequency14d: 0,
      hasRepeatFaults: false,
      avgRestorationHours: 2.2
    },
    {
      segmentId: 'S6',
      segmentName: 'S6: J2 - C1',
      riskLevel: 'Low',
      points: 16,
      drivers: ['Short spur line, low load'],
      suggestedInspectionOrder: 8,
      anomalyFrequency14d: 0,
      hasRepeatFaults: false,
      avgRestorationHours: 2.1
    },
  ];
}
