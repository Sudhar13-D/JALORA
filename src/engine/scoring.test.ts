import { describe, it, expect } from 'vitest';
import {
  isSupplyWindow,
  calculateRobustZScore,
  evaluateSensorDeviation,
  scoreSegments,
  calculateHouseholdFHTCScore,
  calculateWeightedJaccard,
  getSegmentRiskEvaluations,
  SENSOR_BASELINES,
  DEFAULT_WEIGHTS,
} from './scoring';
import { SensorReading, CitizenComplaint } from '../types';

describe('Jalora Engine: Supply Schedule & Baselines', () => {
  it('identifies morning and evening supply windows correctly and ignores off-schedule', () => {
    // 07:15 is inside morning window (06:00 - 08:00)
    const morningDate = new Date('2026-10-04T07:15:00');
    const morningCheck = isSupplyWindow(morningDate);
    expect(morningCheck.inWindow).toBe(true);
    expect(morningCheck.windowName).toBe('morning');

    // 17:45 is inside evening window (17:00 - 19:00)
    const eveningDate = new Date('2026-10-04T17:45:00');
    const eveningCheck = isSupplyWindow(eveningDate);
    expect(eveningCheck.inWindow).toBe(true);
    expect(eveningCheck.windowName).toBe('evening');

    // 12:30 is off-schedule (non-supply window)
    const afternoonDate = new Date('2026-10-04T12:30:00');
    const afternoonCheck = isSupplyWindow(afternoonDate);
    expect(afternoonCheck.inWindow).toBe(false);
    expect(afternoonCheck.windowName).toBe('off_schedule');
  });

  it('calculates robust z-scores correctly and suppresses deviation outside supply window', () => {
    const median = 100;
    const mad = 5;
    // z = |120 - 100| / (1.4826 * 5) = 20 / 7.413 = 2.698
    const z = calculateRobustZScore(120, median, mad);
    expect(z).toBeCloseTo(2.698, 2);

    const baseline = SENSOR_BASELINES['SN-B1'].morning;
    const abnormalReading: SensorReading = {
      sensorId: 'SN-B1',
      timestamp: new Date().toISOString(),
      flowLpm: 10, // severely down from 76 LPM
      pressureBar: 0.5,
      isSupplyWindow: false,
      status: 'online'
    };

    // Outside supply window, deviation must be false!
    const devOffSchedule = evaluateSensorDeviation(abnormalReading, baseline, false);
    expect(devOffSchedule.flowDeviated).toBe(false);
    expect(devOffSchedule.pressureDeviated).toBe(false);

    // Inside supply window, deviation must be true
    const devInSchedule = evaluateSensorDeviation(abnormalReading, baseline, true);
    expect(devInSchedule.flowDeviated).toBe(true);
    expect(devInSchedule.pressureDeviated).toBe(true);
    expect(devInSchedule.zFlow).toBeGreaterThan(3.5);
  });
});

describe('Jalora Engine: Off-Schedule Filtering', () => {
  it('returns no active alert and no fault hypothesis when outside supply window (zero flow is normal)', () => {
    const offScheduleDate = new Date('2026-10-04T13:00:00');
    // Normal sensor readings with 0 flow off-schedule
    const mockSensors: Record<string, SensorReading> = {
      'SN-T0': { sensorId: 'SN-T0', timestamp: offScheduleDate.toISOString(), flowLpm: 0, pressureBar: 0, isSupplyWindow: false, status: 'online' },
      'SN-J1': { sensorId: 'SN-J1', timestamp: offScheduleDate.toISOString(), flowLpm: 0, pressureBar: 0, isSupplyWindow: false, status: 'online' },
      'SN-J2': { sensorId: 'SN-J2', timestamp: offScheduleDate.toISOString(), flowLpm: 0, pressureBar: 0, isSupplyWindow: false, status: 'online' },
      'SN-E1': { sensorId: 'SN-E1', timestamp: offScheduleDate.toISOString(), flowLpm: 0, pressureBar: 0, isSupplyWindow: false, status: 'online' },
      'SN-B1': { sensorId: 'SN-B1', timestamp: offScheduleDate.toISOString(), flowLpm: 0, pressureBar: 0, isSupplyWindow: false, status: 'online' },
      'SN-B2': { sensorId: 'SN-B2', timestamp: offScheduleDate.toISOString(), flowLpm: 0, pressureBar: 0, isSupplyWindow: false, status: 'online' },
    };

    const result = scoreSegments(mockSensors, {}, [], offScheduleDate, DEFAULT_WEIGHTS);
    expect(result.hasActiveAlert).toBe(false);
    expect(result.topHypothesis).toBeNull();
    expect(result.isSupplyWindow).toBe(false);
    expect(result.activeWindowName).toBe('off_schedule');
  });
});

describe('Jalora Engine: Blockage on S8 Scenario', () => {
  const morningDate = new Date('2026-10-04T07:00:00');

  // Baseline readings with S8 blockage:
  // Upstream B1 experiences backpressure (pressure rises to 2.25 bar, baseline 1.82 bar)
  // Downstream B2 suffers severe drop in flow (12 LPM vs 54 baseline) and pressure drop (0.45 bar vs 1.34 baseline)
  const blockageSensors: Record<string, SensorReading> = {
    'SN-T0': { sensorId: 'SN-T0', timestamp: morningDate.toISOString(), flowLpm: 184, pressureBar: 2.45, isSupplyWindow: true, status: 'online' },
    'SN-J1': { sensorId: 'SN-J1', timestamp: morningDate.toISOString(), flowLpm: 171, pressureBar: 2.14, isSupplyWindow: true, status: 'online' },
    'SN-J2': { sensorId: 'SN-J2', timestamp: morningDate.toISOString(), flowLpm: 92, pressureBar: 1.74, isSupplyWindow: true, status: 'online' },
    'SN-E1': { sensorId: 'SN-E1', timestamp: morningDate.toISOString(), flowLpm: 46, pressureBar: 1.25, isSupplyWindow: true, status: 'online' },
    'SN-B1': { sensorId: 'SN-B1', timestamp: morningDate.toISOString(), flowLpm: 75, pressureBar: 2.28, isSupplyWindow: true, status: 'online' }, // backpressure!
    'SN-B2': { sensorId: 'SN-B2', timestamp: morningDate.toISOString(), flowLpm: 8, pressureBar: 0.35, isSupplyWindow: true, status: 'online' }, // collapsed downstream!
  };

  const historySensors: Record<string, SensorReading[]> = {
    'SN-B2': [blockageSensors['SN-B2'], blockageSensors['SN-B2'], blockageSensors['SN-B2']],
  };

  it('ranks S8 as top-1 with blockage fault signature', () => {
    const result = scoreSegments(blockageSensors, historySensors, [], morningDate, DEFAULT_WEIGHTS);
    expect(result.topHypothesis).not.toBeNull();
    expect(result.topHypothesis?.segmentId).toBe('S8');
    expect(result.topHypothesis?.faultType).toBe('blockage');
    // Without complaints, confidence is capped at Moderate (<60%)
    expect(result.topHypothesis?.confidenceBand).toBe('Moderate');
    expect(result.topHypothesis?.confidencePercent).toBeLessThanOrEqual(55);
  });

  it('raises confidence to High when downstream households file complaints, and lowers when upstream complain', () => {
    // 6 downstream households on S8 complain (e.g. H12, H13, H14, H15, H16, H17)
    const downstreamComplaints: CitizenComplaint[] = ['H12', 'H13', 'H14', 'H15', 'H16', 'H17'].map((hid, idx) => ({
      id: `c-${idx}`,
      householdId: hid,
      householdOfficialId: `JJM-TN-04-V01-${hid}`,
      timestamp: morningDate.toISOString(),
      simulatedTimeMs: morningDate.getTime(),
      issue: 'no_water',
      description: 'Zero tap water this morning',
      gpsValid: true,
      distanceFromTapM: 8,
      gpsWeight: 1.0,
      reportingWeight: 0.8,
      language: 'en',
      status: 'synced',
    }));

    const resultWithDownstream = scoreSegments(blockageSensors, historySensors, downstreamComplaints, morningDate, DEFAULT_WEIGHTS);
    expect(resultWithDownstream.topHypothesis?.segmentId).toBe('S8');
    expect(resultWithDownstream.topHypothesis?.confidenceBand).toBe('High');
    expect(resultWithDownstream.topHypothesis?.confidencePercent).toBeGreaterThanOrEqual(60);

    // Now test if upstream complaints (H01, H02, H06) dilute and lower S8 confidence
    const mixedComplaints: CitizenComplaint[] = [
      ...downstreamComplaints,
      {
        id: 'c-up-1',
        householdId: 'H01', // On S2
        householdOfficialId: 'JJM-TN-04-V01-H01',
        timestamp: morningDate.toISOString(),
        simulatedTimeMs: morningDate.getTime(),
        issue: 'no_water',
        description: 'Upstream complaint',
        gpsValid: true,
        distanceFromTapM: 10,
        gpsWeight: 1.0,
        reportingWeight: 0.8,
        language: 'en',
        status: 'synced',
      },
      {
        id: 'c-up-2',
        householdId: 'H06', // On S5
        householdOfficialId: 'JJM-TN-04-V01-H06',
        timestamp: morningDate.toISOString(),
        simulatedTimeMs: morningDate.getTime(),
        issue: 'no_water',
        description: 'Upstream complaint',
        gpsValid: true,
        distanceFromTapM: 12,
        gpsWeight: 1.0,
        reportingWeight: 0.8,
        language: 'en',
        status: 'synced',
      }
    ];

    const resultMixed = scoreSegments(blockageSensors, historySensors, mixedComplaints, morningDate, DEFAULT_WEIGHTS);
    expect(resultMixed.topHypothesis?.segmentId).toBe('S8');
    expect(resultMixed.topHypothesis?.confidencePercent).toBeLessThan(resultWithDownstream.topHypothesis?.confidencePercent ?? 100);
  });
});

describe('Jalora Engine: Sensor Failure vs Unresolved Anomaly', () => {
  it('flags an abnormal sensor with no complaints as an Unresolved Anomaly (sensor-health check), not a pipe failure', () => {
    const morningDate = new Date('2026-10-04T07:00:00');
    // B1 sensor transmits corrupt/drifted data, but other downstream B2 and villagers receive water
    const driftSensors: Record<string, SensorReading> = {
      'SN-T0': { sensorId: 'SN-T0', timestamp: morningDate.toISOString(), flowLpm: 185, pressureBar: 2.45, isSupplyWindow: true, status: 'online' },
      'SN-J1': { sensorId: 'SN-J1', timestamp: morningDate.toISOString(), flowLpm: 172, pressureBar: 2.15, isSupplyWindow: true, status: 'online' },
      'SN-J2': { sensorId: 'SN-J2', timestamp: morningDate.toISOString(), flowLpm: 92, pressureBar: 1.75, isSupplyWindow: true, status: 'online' },
      'SN-E1': { sensorId: 'SN-E1', timestamp: morningDate.toISOString(), flowLpm: 46, pressureBar: 1.25, isSupplyWindow: true, status: 'online' },
      'SN-B1': { sensorId: 'SN-B1', timestamp: morningDate.toISOString(), flowLpm: 12, pressureBar: 0.20, isSupplyWindow: true, status: 'online' }, // erratic sensor drift
      'SN-B2': { sensorId: 'SN-B2', timestamp: morningDate.toISOString(), flowLpm: 54, pressureBar: 1.34, isSupplyWindow: true, status: 'online' }, // normal downstream!
    };

    const history: Record<string, SensorReading[]> = {
      'SN-B1': [driftSensors['SN-B1'], driftSensors['SN-B1'], driftSensors['SN-B1']]
    };

    const result = scoreSegments(driftSensors, history, [], morningDate, DEFAULT_WEIGHTS);
    expect(result.unresolvedSensors).toContain('SN-B1');
  });
});

describe('Jalora Engine: Leak on S3 Scenario', () => {
  it('ranks S3 top-1 or top-3 with flow imbalance evidence and downstream pressure drop', () => {
    const morningDate = new Date('2026-10-04T07:00:00');
    // Leak on S3 (J1-J2): J1 outflow high, J2 inflow severely lower than expected, downstream pressure collapsed
    const leakSensors: Record<string, SensorReading> = {
      'SN-T0': { sensorId: 'SN-T0', timestamp: morningDate.toISOString(), flowLpm: 188, pressureBar: 2.44, isSupplyWindow: true, status: 'online' },
      'SN-J1': { sensorId: 'SN-J1', timestamp: morningDate.toISOString(), flowLpm: 175, pressureBar: 2.10, isSupplyWindow: true, status: 'online' },
      'SN-J2': { sensorId: 'SN-J2', timestamp: morningDate.toISOString(), flowLpm: 55, pressureBar: 0.95, isSupplyWindow: true, status: 'online' }, // dropped!
      'SN-E1': { sensorId: 'SN-E1', timestamp: morningDate.toISOString(), flowLpm: 25, pressureBar: 0.60, isSupplyWindow: true, status: 'online' },
      'SN-B1': { sensorId: 'SN-B1', timestamp: morningDate.toISOString(), flowLpm: 75, pressureBar: 1.81, isSupplyWindow: true, status: 'online' },
      'SN-B2': { sensorId: 'SN-B2', timestamp: morningDate.toISOString(), flowLpm: 53, pressureBar: 1.33, isSupplyWindow: true, status: 'online' },
    };

    const result = scoreSegments(leakSensors, {}, [], morningDate, DEFAULT_WEIGHTS);
    expect(['S3', 'S4']).toContain(result.hypotheses[0]?.segmentId);
    const s3Hypothesis = result.hypotheses.find(h => h.segmentId === 'S3');
    expect(s3Hypothesis).toBeDefined();
    expect(s3Hypothesis!.rank).toBeLessThanOrEqual(3);
    expect(s3Hypothesis!.faultType).toBe('leak');
  });
});

describe('Jalora Engine: FHTC Service Score & Upstream Outage Propagation', () => {
  const morningDate = new Date('2026-10-04T07:30:00');

  it('calculates score >= 75 for normal operational households', () => {
    const scoreH01 = calculateHouseholdFHTCScore('H01', [], [], morningDate);
    expect(scoreH01.status).toBe('functional');
    expect(scoreH01.totalScore).toBeGreaterThanOrEqual(75);
    expect(scoreH01.forcedOutage).toBe(false);
  });

  it('forces Non-functional (<40) for any household downstream of a confirmed failed segment', () => {
    // S8 failure confirmed: downstream households H12-H20 must be forced Non-functional
    const scoreH12 = calculateHouseholdFHTCScore('H12', ['S8'], [], morningDate);
    expect(scoreH12.status).toBe('non_functional');
    expect(scoreH12.totalScore).toBeLessThan(40);
    expect(scoreH12.forcedOutage).toBe(true);

    // Upstream household H01 (on S2) or H02 (on S3) must remain Functional
    const scoreH01 = calculateHouseholdFHTCScore('H01', ['S8'], [], morningDate);
    expect(scoreH01.status).toBe('functional');
    expect(scoreH01.forcedOutage).toBe(false);

    const scoreH02 = calculateHouseholdFHTCScore('H02', ['S8'], [], morningDate);
    expect(scoreH02.status).toBe('functional');
    expect(scoreH02.forcedOutage).toBe(false);
  });
});

describe('Jalora Engine: Weighted Jaccard & GPS Validity', () => {
  it('applies GPS validity weight (1.0 inside 50m vs 0.3 outside)', () => {
    const validComplaint: CitizenComplaint = {
      id: 'c-valid',
      householdId: 'H12',
      householdOfficialId: 'JJM-TN-04-V01-H12',
      timestamp: new Date().toISOString(),
      simulatedTimeMs: Date.now(),
      issue: 'no_water',
      description: 'At home tap',
      gpsValid: true,
      distanceFromTapM: 15,
      gpsWeight: 1.0,
      reportingWeight: 0.8,
      language: 'en',
      status: 'synced',
    };

    const invalidGpsComplaint: CitizenComplaint = {
      ...validComplaint,
      id: 'c-invalid',
      gpsValid: false,
      distanceFromTapM: 350,
      gpsWeight: 0.3,
    };

    const jaccardValid = calculateWeightedJaccard('S8', [validComplaint]);
    const jaccardInvalid = calculateWeightedJaccard('S8', [invalidGpsComplaint]);

    expect(jaccardValid.score).toBeGreaterThan(jaccardInvalid.score);
  });
});

describe('Jalora Engine: Maintenance Risk Seeded Evaluations', () => {
  it('seeds S4 as Medium risk and S7 as High risk', () => {
    const risks = getSegmentRiskEvaluations();
    const s7 = risks.find(r => r.segmentId === 'S7');
    const s4 = risks.find(r => r.segmentId === 'S4');
    const s1 = risks.find(r => r.segmentId === 'S1');

    expect(s7?.riskLevel).toBe('High');
    expect(s4?.riskLevel).toBe('Medium');
    expect(s1?.riskLevel).toBe('Low');
    expect(s7?.suggestedInspectionOrder).toBe(1);
  });
});

describe('Jalora Engine: Citizen Complaints & Duplicate Merge', () => {
  it('merges duplicate complaints for same household and issue within 60 simulated minutes', async () => {
    const { processNewComplaint } = await import('./complaints');
    const baseTime = new Date('2026-10-04T07:10:00').getTime();

    // First complaint from H14
    const firstRun = processNewComplaint([], {
      householdId: 'H14',
      issue: 'no_water',
      description: 'Zero flow at morning tap',
      gpsValid: true,
      distanceFromTapM: 10,
      language: 'en',
      simulatedTimeMs: baseTime,
    });

    expect(firstRun.wasMerged).toBe(false);
    expect(firstRun.updatedComplaints.length).toBe(1);
    expect(firstRun.resultComplaint.gpsWeight).toBe(1.0);

    // Second complaint 25 minutes later for same household and same issue -> must merge!
    const secondRun = processNewComplaint(firstRun.updatedComplaints, {
      householdId: 'H14',
      issue: 'no_water',
      description: 'Still no water after 25 mins',
      gpsValid: true,
      distanceFromTapM: 8,
      language: 'en',
      simulatedTimeMs: baseTime + 25 * 60 * 1000,
    });

    expect(secondRun.wasMerged).toBe(true);
    expect(secondRun.updatedComplaints.length).toBe(1); // Merged into 1 item
    expect(secondRun.resultComplaint.description).toContain('Still no water');

    // Third complaint 90 minutes later (>60 mins) -> should NOT merge, creates separate ticket
    const thirdRun = processNewComplaint(secondRun.updatedComplaints, {
      householdId: 'H14',
      issue: 'no_water',
      description: 'Evening follow-up',
      gpsValid: true,
      distanceFromTapM: 12,
      language: 'en',
      simulatedTimeMs: baseTime + 90 * 60 * 1000,
    });

    expect(thirdRun.wasMerged).toBe(false);
    expect(thirdRun.updatedComplaints.length).toBe(2);
  });

  it('handles offline queue and syncPendingComplaints', async () => {
    const { processNewComplaint, syncPendingComplaints } = await import('./complaints');
    const timeMs = Date.now();

    const offlineRun = processNewComplaint([], {
      householdId: 'H12',
      issue: 'low_pressure',
      description: 'Filed offline during power cut',
      gpsValid: true,
      distanceFromTapM: 15,
      language: 'ta',
      simulatedTimeMs: timeMs,
      isOffline: true,
    });

    expect(offlineRun.resultComplaint.status).toBe('pending_sync');
    const synced = syncPendingComplaints(offlineRun.updatedComplaints);
    expect(synced[0].status).toBe('synced');
  });
});
