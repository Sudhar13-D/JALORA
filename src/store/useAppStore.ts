import { create } from 'zustand';
import {
  Role,
  Language,
  ScenarioPreset,
  SensorReading,
  QualityReading,
  CitizenComplaint,
  IncidentTicket,
  IMISSyncLog,
  HouseholdFHTCScore,
  EngineResult
} from '../types';
import {
  scoreSegments,
  calculateHouseholdFHTCScore,
  DEFAULT_WEIGHTS,
  DEFAULT_FHTC_WEIGHTS,
  DEFAULT_FHTC_THRESHOLDS,
  EngineWeights,
  FHTCWeights,
  FHTCThresholds,
  SENSOR_BASELINES,
  isSupplyWindow
} from '../engine/scoring';
import { processNewComplaint, syncPendingComplaints } from '../engine/complaints';
import { HOUSEHOLDS } from '../data/topology';
import { Mulberry32 } from '../engine/prng';

export type NavigationTab = 
  | 'overview' 
  | 'households' 
  | 'incidents' 
  | 'reports' 
  | 'water_quality' 
  | 'maintenance' 
  | 'integration' 
  | 'settings';

interface AppState {
  // App settings
  role: Role;
  language: Language;
  theme: 'light' | 'dark';
  activeTab: NavigationTab;
  setRole: (role: Role) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setActiveTab: (tab: NavigationTab) => void;

  // Simulation Clock
  simulatedTime: Date;
  isPlaying: boolean;
  speed: 1 | 10 | 60;
  togglePlay: () => void;
  setSpeed: (speed: 1 | 10 | 60) => void;
  setSimulatedTime: (date: Date) => void;
  advanceSimulatedTime: (minutes: number) => void;

  // Scenarios
  scenario: ScenarioPreset;
  setScenario: (scenario: ScenarioPreset) => void;
  isGuidedTourActive: boolean;
  guidedTourStep: number;
  runGuidedTour: () => void;
  cancelGuidedTour: () => void;
  resetDemo: () => void;

  // Telemetry state
  sensorReadings: Record<string, SensorReading>;
  sensorHistory: Record<string, SensorReading[]>;
  qualityReadings: Record<string, QualityReading>;
  qualityHistory: Record<string, QualityReading[]>;
  verifyQualityAlert: (sensorId: string, result: 'verified_field_pass' | 'verified_field_fail') => void;

  // Complaints
  complaints: CitizenComplaint[];
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  submitComplaint: (input: {
    householdId: string;
    issue: 'no_water' | 'low_pressure' | 'dirty_water';
    description: string;
    photoUrl?: string;
    gpsValid: boolean;
    distanceFromTapM: number;
    language: Language;
  }) => { wasMerged: boolean; id: string };
  syncPendingComplaintsQueue: () => void;

  // Incident Tickets
  tickets: IncidentTicket[];
  assignTechnician: (ticketId: string, technicianName: string) => void;
  markRepaired: (ticketId: string, repairNotes: string) => void;
  confirmCitizen: (ticketId: string) => void;

  // Integration (Mock IMIS)
  syncLogs: IMISSyncLog[];
  retrySync: (logId: string) => void;

  // UI Selection
  selectedHouseholdId: string | null;
  selectedSegmentId: string | null;
  selectedNodeId: string | null;
  selectedSensorId: string;
  setSelectedHouseholdId: (id: string | null) => void;
  setSelectedSegmentId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedSensorId: (id: string) => void;

  // Engine Config
  engineWeights: EngineWeights;
  fhtcWeights: FHTCWeights;
  fhtcThresholds: FHTCThresholds;
  setEngineWeights: (weights: Partial<EngineWeights>) => void;
  setFHTCWeights: (weights: Partial<FHTCWeights>) => void;
  setFHTCThresholds: (thresholds: Partial<FHTCThresholds>) => void;

  // Derived getters
  getEngineResult: () => EngineResult;
  getHouseholdScores: () => Record<string, HouseholdFHTCScore>;
  getConfirmedOutages: () => string[];
}

const prng = new Mulberry32(26255);

// Generate default baseline readings for 07:15 AM
function createInitialReadings(simDate: Date, scenario: ScenarioPreset = 'normal'): {
  readings: Record<string, SensorReading>;
  history: Record<string, SensorReading[]>;
  quality: Record<string, QualityReading>;
} {
  const { inWindow } = isSupplyWindow(simDate);
  const readings: Record<string, SensorReading> = {};
  const history: Record<string, SensorReading[]> = {};

  const sensorIds = ['SN-T0', 'SN-J1', 'SN-J2', 'SN-E1', 'SN-B1', 'SN-B2'];
  for (const sid of sensorIds) {
    const base = SENSOR_BASELINES[sid].morning;
    let flow = inWindow ? base.medianFlow + (prng.next() - 0.5) * base.madFlow : 0;
    let press = inWindow ? base.medianPressure + (prng.next() - 0.5) * base.madPressure : 0;
    let status: 'online' | 'unresolved_anomaly' | 'sensor_fault' = 'online';

    if (scenario === 'blockage_s8') {
      if (sid === 'SN-B1') press = 2.26; // Upstream backpressure
      if (sid === 'SN-B2') { flow = 7.5; press = 0.38; } // Downstream collapse
    } else if (scenario === 'leak_s3') {
      if (sid === 'SN-J1') { flow = 176; press = 2.10; }
      if (sid === 'SN-J2') { flow = 54; press = 0.94; } // downstream collapse
      if (sid === 'SN-E1') { flow = 22; press = 0.58; }
    } else if (scenario === 'sensor_fault_b1') {
      if (sid === 'SN-B1') { flow = 11; press = 0.22; status = 'unresolved_anomaly'; }
    } else if (scenario === 'normal_fluctuation') {
      flow += (prng.next() - 0.5) * 6;
      press += (prng.next() - 0.5) * 0.12;
    }

    const current: SensorReading = {
      sensorId: sid,
      timestamp: simDate.toISOString(),
      flowLpm: Number(flow.toFixed(1)),
      pressureBar: Number(press.toFixed(2)),
      isSupplyWindow: inWindow,
      status,
    };
    readings[sid] = current;

    // Create 12 historical samples
    const histSamples: SensorReading[] = [];
    for (let i = 11; i >= 0; i--) {
      const pastTime = new Date(simDate.getTime() - i * 5 * 60 * 1000);
      const isPastInWindow = isSupplyWindow(pastTime).inWindow;
      let hFlow = isPastInWindow ? base.medianFlow + (prng.next() - 0.5) * base.madFlow * 1.2 : 0;
      let hPress = isPastInWindow ? base.medianPressure + (prng.next() - 0.5) * base.madPressure * 1.2 : 0;

      if (i < 4 && scenario === 'blockage_s8') {
        if (sid === 'SN-B1') hPress = 2.26;
        if (sid === 'SN-B2') { hFlow = 7.5; hPress = 0.38; }
      }
      histSamples.push({
        sensorId: sid,
        timestamp: pastTime.toISOString(),
        flowLpm: Number(hFlow.toFixed(1)),
        pressureBar: Number(hPress.toFixed(2)),
        isSupplyWindow: isPastInWindow,
        status,
      });
    }
    history[sid] = histSamples;
  }

  // Quality readings for T0, J2, E1
  const quality: Record<string, QualityReading> = {
    'SN-T0': {
      sensorId: 'SN-T0',
      timestamp: simDate.toISOString(),
      ph: 7.25,
      turbidityNtu: 1.8,
      tdsPpm: 240,
      conductivityUsCm: 480,
      residualChlorineMgL: 0.55,
      status: 'normal',
    },
    'SN-J2': {
      sensorId: 'SN-J2',
      timestamp: simDate.toISOString(),
      ph: 7.15,
      turbidityNtu: 2.1,
      tdsPpm: 255,
      conductivityUsCm: 510,
      residualChlorineMgL: 0.42,
      status: 'normal',
    },
    'SN-E1': {
      sensorId: 'SN-E1',
      timestamp: simDate.toISOString(),
      ph: 7.05,
      turbidityNtu: 2.6,
      tdsPpm: 270,
      conductivityUsCm: 540,
      residualChlorineMgL: 0.28,
      status: 'normal',
    },
  };

  return { readings, history, quality };
}

const defaultSimDate = new Date('2026-10-04T07:15:00');
const initialData = createInitialReadings(defaultSimDate, 'normal');

export const useAppStore = create<AppState>((set, get) => ({
  role: 'vwsc',
  language: 'en',
  theme: 'light',
  activeTab: 'overview',
  setRole: (role) => set({ role }),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  setActiveTab: (activeTab) => set({ activeTab }),

  simulatedTime: defaultSimDate,
  isPlaying: false,
  speed: 1,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setSimulatedTime: (simulatedTime) => {
    const { scenario } = get();
    const data = createInitialReadings(simulatedTime, scenario);
    set({ simulatedTime, sensorReadings: data.readings, sensorHistory: data.history });
  },
  advanceSimulatedTime: (minutes) => {
    const current = get().simulatedTime;
    const nextTime = new Date(current.getTime() + minutes * 60 * 1000);
    const { scenario } = get();
    const data = createInitialReadings(nextTime, scenario);
    set({ simulatedTime: nextTime, sensorReadings: data.readings, sensorHistory: data.history });
  },

  scenario: 'normal',
  setScenario: (scenario) => {
    let targetTime = get().simulatedTime;
    let initialComplaints: CitizenComplaint[] = [];

    if (scenario === 'off_schedule') {
      // Set to 13:00 (outside supply window)
      targetTime = new Date('2026-10-04T13:00:00');
    } else if (scenario === 'normal') {
      targetTime = new Date('2026-10-04T07:15:00');
    } else if (scenario === 'blockage_s8') {
      targetTime = new Date('2026-10-04T07:25:00');
      // Downstream complaints from H12, H13, H14, H15, H16, H17, H18, H19
      const downIds = ['H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'H19'];
      initialComplaints = downIds.map((hid, idx) => ({
        id: `CMP-S8-${idx + 1}`,
        householdId: hid,
        householdOfficialId: `JJM-TN-04-V01-${hid}`,
        timestamp: targetTime.toISOString(),
        simulatedTimeMs: targetTime.getTime() - idx * 3 * 60 * 1000,
        issue: 'no_water',
        description: 'Complete water stoppage at tap this morning',
        gpsValid: true,
        distanceFromTapM: 10 + (idx % 3) * 5,
        gpsWeight: 1.0,
        reportingWeight: 0.8,
        language: 'en',
        status: 'synced',
      }));
    } else if (scenario === 'leak_s3') {
      targetTime = new Date('2026-10-04T07:30:00');
      // Complaints from H02, H03, H04, H05
      initialComplaints = ['H02', 'H03', 'H04'].map((hid, idx) => ({
        id: `CMP-S3-${idx + 1}`,
        householdId: hid,
        householdOfficialId: `JJM-TN-04-V01-${hid}`,
        timestamp: targetTime.toISOString(),
        simulatedTimeMs: targetTime.getTime() - idx * 4 * 60 * 1000,
        issue: 'low_pressure',
        description: 'Pressure dropped to a trickle, damp surface pool near junction',
        gpsValid: true,
        distanceFromTapM: 8,
        gpsWeight: 1.0,
        reportingWeight: 0.85,
        language: 'en',
        status: 'synced',
      }));
    } else if (scenario === 'sensor_fault_b1') {
      targetTime = new Date('2026-10-04T07:20:00');
      // No complaints! Sensor failure must show Unresolved Anomaly
      initialComplaints = [];
    } else if (scenario === 'false_complaint_burst') {
      targetTime = new Date('2026-10-04T07:15:00');
      // Sporadic single complaints without telemetry support
      initialComplaints = [
        {
          id: 'CMP-FALSE-1',
          householdId: 'H01',
          householdOfficialId: 'JJM-TN-04-V01-H01',
          timestamp: targetTime.toISOString(),
          simulatedTimeMs: targetTime.getTime(),
          issue: 'no_water',
          description: 'False complaint test: internal home valve was closed',
          gpsValid: false,
          distanceFromTapM: 280,
          gpsWeight: 0.3,
          reportingWeight: 0.7,
          language: 'en',
          status: 'synced',
        }
      ];
    }

    const data = createInitialReadings(targetTime, scenario);
    set({
      scenario,
      simulatedTime: targetTime,
      sensorReadings: data.readings,
      sensorHistory: data.history,
      complaints: initialComplaints,
    });

    // Auto-create ticket if sustained fault
    if (scenario === 'blockage_s8') {
      const ticket: IncidentTicket = {
        id: 'TICK-S8-01',
        officialId: 'JJM-INC-2026-0881',
        title: 'Possible blockage: segment B1-B2',
        segmentId: 'S8',
        faultType: 'blockage',
        status: 'localized',
        createdAt: targetTime.toISOString(),
        updatedAt: targetTime.toISOString(),
        assignedTechnician: 'M. Suresh (Field Technician)',
        priority: 'High',
        confidenceBand: 'High',
        confidencePercent: 78,
        affectedHouseholdsCount: 9,
        timeline: [
          {
            id: 'TL-1',
            timestamp: targetTime.toISOString(),
            status: 'detected',
            note: 'Blockage telemetry signature detected on S8 (backpressure at B1, low flow at B2)',
            actor: 'Jalora Automated Engine'
          },
          {
            id: 'TL-2',
            timestamp: new Date(targetTime.getTime() + 5 * 60 * 1000).toISOString(),
            status: 'localized',
            note: 'Localized to branch segment S8 with 8 citizen reports confirming zero tap flow',
            actor: 'Jalora Engine Fusion'
          },
          {
            id: 'TL-3',
            timestamp: new Date(targetTime.getTime() + 10 * 60 * 1000).toISOString(),
            status: 'assigned',
            note: 'Dispatched field technician M. Suresh with pipe flushing equipment',
            actor: 'VWSC Secretary'
          }
        ]
      };
      set({ tickets: [ticket] });
    } else if (scenario === 'leak_s3') {
      const ticket: IncidentTicket = {
        id: 'TICK-S3-01',
        officialId: 'JJM-INC-2026-0882',
        title: 'Suspected leak: segment J1-J2',
        segmentId: 'S3',
        faultType: 'leak',
        status: 'localized',
        createdAt: targetTime.toISOString(),
        updatedAt: targetTime.toISOString(),
        assignedTechnician: 'R. Velu (Pipeline Supervisor)',
        priority: 'Medium',
        confidenceBand: 'Moderate',
        confidencePercent: 64,
        affectedHouseholdsCount: 6,
        timeline: [
          {
            id: 'TL-S3-1',
            timestamp: targetTime.toISOString(),
            status: 'detected',
            note: 'Flow imbalance between J1 and J2 exceeding 25% threshold with pressure drop',
            actor: 'Jalora Automated Engine'
          }
        ]
      };
      set({ tickets: [ticket] });
    } else {
      set({ tickets: [] });
    }
  },

  isGuidedTourActive: false,
  guidedTourStep: 0,
  runGuidedTour: () => {
    set({ isGuidedTourActive: true, guidedTourStep: 1 });
    // Step 1: Normal supply
    get().setScenario('normal');
  },
  cancelGuidedTour: () => set({ isGuidedTourActive: false, guidedTourStep: 0 }),
  resetDemo: () => {
    const baseDate = new Date('2026-10-04T07:15:00');
    const data = createInitialReadings(baseDate, 'normal');
    set({
      scenario: 'normal',
      simulatedTime: baseDate,
      isPlaying: false,
      speed: 1,
      sensorReadings: data.readings,
      sensorHistory: data.history,
      complaints: [],
      tickets: [],
      selectedHouseholdId: null,
      selectedSegmentId: null,
      selectedNodeId: null,
      isGuidedTourActive: false,
      guidedTourStep: 0,
      engineWeights: DEFAULT_WEIGHTS,
      fhtcWeights: DEFAULT_FHTC_WEIGHTS,
      fhtcThresholds: DEFAULT_FHTC_THRESHOLDS,
    });
  },

  sensorReadings: initialData.readings,
  sensorHistory: initialData.history,
  qualityReadings: initialData.quality,
  qualityHistory: {
    'SN-T0': [initialData.quality['SN-T0']],
    'SN-J2': [initialData.quality['SN-J2']],
    'SN-E1': [initialData.quality['SN-E1']],
  },
  verifyQualityAlert: (sensorId, result) => {
    set((state) => {
      const current = state.qualityReadings[sensorId];
      if (!current) return state;
      return {
        qualityReadings: {
          ...state.qualityReadings,
          [sensorId]: {
            ...current,
            verifiedStatus: result,
          }
        }
      };
    });
  },

  complaints: [],
  isOfflineMode: false,
  setIsOfflineMode: (isOfflineMode) => set({ isOfflineMode }),
  submitComplaint: (input) => {
    const state = get();
    const result = processNewComplaint(state.complaints, {
      ...input,
      simulatedTimeMs: state.simulatedTime.getTime(),
      isOffline: state.isOfflineMode,
    });
    set({ complaints: result.updatedComplaints });
    return { wasMerged: result.wasMerged, id: result.resultComplaint.id };
  },
  syncPendingComplaintsQueue: () => {
    const synced = syncPendingComplaints(get().complaints);
    set({ complaints: synced });
  },

  tickets: [],
  assignTechnician: (ticketId, technicianName) => {
    set((state) => ({
      tickets: state.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        const now = state.simulatedTime.toISOString();
        return {
          ...t,
          status: 'assigned',
          assignedTechnician: technicianName,
          updatedAt: now,
          timeline: [
            ...t.timeline,
            {
              id: `TL-${Date.now()}`,
              timestamp: now,
              status: 'assigned',
              note: `Assigned to ${technicianName}`,
              actor: 'VWSC Secretary'
            }
          ]
        };
      })
    }));
  },
  markRepaired: (ticketId, repairNotes) => {
    const state = get();
    const now = state.simulatedTime.toISOString();

    // Restoring flow on network!
    const restoredReadings = { ...state.sensorReadings };
    if (state.scenario === 'blockage_s8') {
      restoredReadings['SN-B1'] = {
        ...restoredReadings['SN-B1'],
        pressureBar: 1.82,
      };
      restoredReadings['SN-B2'] = {
        ...restoredReadings['SN-B2'],
        flowLpm: 54,
        pressureBar: 1.34,
      };
    } else if (state.scenario === 'leak_s3') {
      restoredReadings['SN-J2'] = {
        ...restoredReadings['SN-J2'],
        flowLpm: 91,
        pressureBar: 1.74,
      };
      restoredReadings['SN-E1'] = {
        ...restoredReadings['SN-E1'],
        flowLpm: 45,
        pressureBar: 1.24,
      };
    }

    set({
      sensorReadings: restoredReadings,
      tickets: state.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: 'in_repair',
          repairNotes,
          updatedAt: now,
          timeline: [
            ...t.timeline,
            {
              id: `TL-${Date.now()}`,
              timestamp: now,
              status: 'in_repair',
              note: `Repairs physically completed: ${repairNotes}. Normal pipe pressure restored.`,
              actor: t.assignedTechnician || 'Field Technician'
            }
          ]
        };
      })
    });
  },
  confirmCitizen: (ticketId) => {
    const state = get();
    const now = state.simulatedTime.toISOString();
    set({
      scenario: 'normal',
      tickets: state.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: 'closed',
          updatedAt: now,
          timeline: [
            ...t.timeline,
            {
              id: `TL-CC-${Date.now()}`,
              timestamp: now,
              status: 'citizen_confirmed',
              note: 'Villagers confirmed full water flow restored at household taps',
              actor: 'Citizen Confirmation Panel'
            },
            {
              id: `TL-CL-${Date.now()}`,
              timestamp: now,
              status: 'closed',
              note: 'Ticket closed successfully. Service score restored.',
              actor: 'System Auto-Close'
            }
          ]
        };
      })
    });
  },

  syncLogs: [
    {
      id: 'SYNC-001',
      idempotencyKey: 'IDEMP-20261004-VIL01-001',
      entityType: 'village_status',
      entityId: 'VIL-TN-04-V01',
      action: 'SYNC',
      status: 'synced',
      attempts: 1,
      timestamp: '2026-10-04T07:00:00Z',
      payloadSummary: 'Sync 20 FHTC scores and sensor telemetry to State IMIS',
      responseMessage: 'HTTP 200 OK: IMIS ACK received',
    },
    {
      id: 'SYNC-002',
      idempotencyKey: 'IDEMP-20261004-INC-0881',
      entityType: 'incident',
      entityId: 'JJM-INC-2026-0881',
      action: 'CREATE',
      status: 'synced',
      attempts: 1,
      timestamp: '2026-10-04T07:25:00Z',
      payloadSummary: 'Incident JJM-INC-2026-0881 dispatched to Sujal Gaon',
      responseMessage: 'HTTP 201 Created: Sujal Gaon Ticket Registered',
    },
  ],
  retrySync: (logId) => {
    set((state) => ({
      syncLogs: state.syncLogs.map((log) => {
        if (log.id !== logId) return log;
        return {
          ...log,
          status: 'synced',
          attempts: log.attempts + 1,
          responseMessage: 'HTTP 200 OK: Re-transmission acknowledged by IMIS',
        };
      })
    }));
  },

  selectedHouseholdId: null,
  selectedSegmentId: null,
  selectedNodeId: null,
  selectedSensorId: 'SN-B2',
  setSelectedHouseholdId: (selectedHouseholdId) => set({ selectedHouseholdId }),
  setSelectedSegmentId: (selectedSegmentId) => set({ selectedSegmentId }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedSensorId: (selectedSensorId) => set({ selectedSensorId }),

  engineWeights: DEFAULT_WEIGHTS,
  fhtcWeights: DEFAULT_FHTC_WEIGHTS,
  fhtcThresholds: DEFAULT_FHTC_THRESHOLDS,
  setEngineWeights: (weights) => set((s) => ({ engineWeights: { ...s.engineWeights, ...weights } })),
  setFHTCWeights: (weights) => set((s) => ({ fhtcWeights: { ...s.fhtcWeights, ...weights } })),
  setFHTCThresholds: (thresholds) => set((s) => ({ fhtcThresholds: { ...s.fhtcThresholds, ...thresholds } })),

  getConfirmedOutages: () => {
    const { tickets, scenario } = get();
    const activeTicketSegments = tickets
      .filter((t) => t.status !== 'closed' && t.status !== 'citizen_confirmed')
      .map((t) => t.segmentId);

    if (scenario === 'blockage_s8' && !activeTicketSegments.includes('S8')) {
      activeTicketSegments.push('S8');
    }
    if (scenario === 'leak_s3' && !activeTicketSegments.includes('S3')) {
      activeTicketSegments.push('S3');
    }
    return activeTicketSegments;
  },

  getEngineResult: () => {
    const { sensorReadings, sensorHistory, complaints, simulatedTime, engineWeights } = get();
    return scoreSegments(sensorReadings, sensorHistory, complaints, simulatedTime, engineWeights);
  },

  getHouseholdScores: () => {
    const { complaints, simulatedTime, fhtcWeights, fhtcThresholds } = get();
    const confirmedOutages = get().getConfirmedOutages();
    const scores: Record<string, HouseholdFHTCScore> = {};

    for (const hh of HOUSEHOLDS) {
      scores[hh.id] = calculateHouseholdFHTCScore(
        hh.id,
        confirmedOutages,
        complaints,
        simulatedTime,
        fhtcWeights,
        fhtcThresholds
      );
    }
    return scores;
  },
}));
