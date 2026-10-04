// Core Types for Jalora Drinking-Water Supply Monitoring System

export type Role = 'villager' | 'vwsc' | 'state';
export type Language = 'en' | 'hi' | 'ta';

export type StatusLevel = 'functional' | 'at_risk' | 'non_functional';

export interface TopologyNode {
  id: string;
  name: string;
  type: 'tank' | 'sensor' | 'junction' | 'tail_end';
  x: number;
  y: number;
  hasSensor: boolean;
  sensorId?: string;
  hasQualitySensor?: boolean;
}

export interface NetworkSegment {
  id: string;
  name: string;
  fromNode: string;
  toNode: string;
  lengthMeters: number;
  diameterMm: number;
  upstreamSensorId?: string;
  downstreamSensorId?: string;
  households: string[];
}

export interface Household {
  id: string;
  officialId: string; // e.g. JJM-TN-04-V01-H01
  name: string;
  segmentId: string;
  headOfHousehold: string;
  latitude: number;
  longitude: number;
  reportingRate: number; // 0.3 - 0.9 (seeded)
  preferredLanguage: Language;
  fhtcId: string;
  isRegistered: boolean;
}

export interface SensorReading {
  sensorId: string;
  timestamp: string; // ISO string
  flowLpm: number;
  pressureBar: number;
  isSupplyWindow: boolean;
  status: 'online' | 'unresolved_anomaly' | 'sensor_fault' | 'offline';
}

export interface QualityReading {
  sensorId: string;
  timestamp: string;
  ph: number; // IS 10500 configured: 6.5 - 8.5
  turbidityNtu: number; // <= 5 NTU
  tdsPpm: number; // <= 500 ppm
  conductivityUsCm: number; // ~200 - 800
  residualChlorineMgL: number; // 0.2 - 1.0 mg/L
  status: 'normal' | 'anomaly';
  verifiedStatus?: 'pending' | 'verified_lab' | 'verified_field_pass' | 'verified_field_fail';
}

export interface SensorBaseline {
  sensorId: string;
  window: 'morning' | 'evening'; // 06:00-08:00 vs 17:00-19:00
  medianFlow: number;
  madFlow: number;
  medianPressure: number;
  madPressure: number;
}

export type ComplaintIssue = 'no_water' | 'low_pressure' | 'dirty_water';

export interface CitizenComplaint {
  id: string;
  householdId: string;
  householdOfficialId: string;
  timestamp: string;
  simulatedTimeMs: number;
  issue: ComplaintIssue;
  description: string;
  photoUrl?: string;
  gpsValid: boolean;
  distanceFromTapM: number;
  gpsWeight: number; // 1.0 if inside 50m, 0.3 if outside
  reportingWeight: number;
  language: Language;
  status: 'pending_sync' | 'synced' | 'verified' | 'rejected' | 'merged';
  mergedIntoId?: string;
}

export type ConfidenceBand = 'High' | 'Moderate' | 'Low';

export interface EvidenceItem {
  id: string;
  type: 'flow' | 'pressure' | 'complaints' | 'sensor';
  description: string;
  observedValue: string;
  baselineValue?: string;
  deviationPercent?: number;
  direction?: 'up' | 'down' | 'neutral';
}

export interface SegmentHypothesis {
  segmentId: string;
  segmentName: string;
  score: number; // 0 - 1
  flowScore: number; // 0 - 1
  pressureScore: number; // 0 - 1
  complaintScore: number; // 0 - 1
  confidenceBand: ConfidenceBand;
  confidencePercent: number; // e.g. 74
  faultType: 'blockage' | 'leak' | 'sensor_anomaly' | 'none';
  affectedHouseholds: string[];
  downstreamHouseholdsCount: number;
  complainingHouseholdsCount: number;
  upstreamComplainingCount: number;
  isIndistinguishable: boolean;
  indistinguishableWithSegmentId?: string;
  evidence: EvidenceItem[];
  recommendedAction: string;
  rank: number;
}

export interface EngineResult {
  hasActiveAlert: boolean;
  topHypothesis: SegmentHypothesis | null;
  hypotheses: SegmentHypothesis[];
  unresolvedSensors: string[];
  isSupplyWindow: boolean;
  activeWindowName?: 'morning' | 'evening' | 'off_schedule';
  timestamp: string;
  computedWeights: {
    w1_flow: number;
    w2_pressure: number;
    w3_complaints: number;
  };
}

export interface HouseholdFHTCScore {
  householdId: string;
  totalScore: number; // 0 - 100
  status: StatusLevel;
  components: {
    supplyShare: number; // 0 - 1
    flowPressureHealth: number; // 0 - 1
    complaintPenalty: number; // 0 - 1
    historyHealth: number; // 0 - 1
  };
  componentWeights: {
    supply: number;
    flowPressure: number;
    complaints: number;
    history: number;
  };
  forcedOutage: boolean;
  forcedReason?: string;
  recentComplaintsCount: number;
  outageDaysLast30: number;
}

export interface SegmentRisk {
  segmentId: string;
  segmentName: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  points: number;
  drivers: string[];
  suggestedInspectionOrder: number;
  anomalyFrequency14d: number;
  hasRepeatFaults: boolean;
  avgRestorationHours: number;
}

export type TicketStatus = 
  | 'detected' 
  | 'localized' 
  | 'assigned' 
  | 'in_repair' 
  | 'citizen_confirmed' 
  | 'closed';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: TicketStatus;
  note: string;
  actor: string;
}

export interface IncidentTicket {
  id: string;
  officialId: string; // e.g. JJM-INC-2026-0881
  title: string;
  segmentId: string;
  faultType: 'blockage' | 'leak' | 'sensor_fault';
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedTechnician?: string;
  priority: 'High' | 'Medium' | 'Low';
  confidenceBand: ConfidenceBand;
  confidencePercent: number;
  affectedHouseholdsCount: number;
  timeline: TimelineEvent[];
  repairNotes?: string;
}

export interface IMISSyncLog {
  id: string;
  idempotencyKey: string;
  entityType: 'incident' | 'fhtc_score' | 'water_quality' | 'village_status';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'SYNC';
  status: 'synced' | 'retrying' | 'failed';
  attempts: number;
  timestamp: string;
  payloadSummary: string;
  responseMessage: string;
}

export interface StateVillageSummary {
  villageId: string;
  name: string;
  block: string;
  district: string;
  totalHouseholds: number;
  functionalCount: number;
  atRiskCount: number;
  nonFunctionalCount: number;
  avgScore: number;
  activeIncidents: number;
  overallStatus: StatusLevel;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export type ScenarioPreset = 
  | 'normal' 
  | 'off_schedule' 
  | 'blockage_s8' 
  | 'leak_s3' 
  | 'sensor_fault_b1' 
  | 'normal_fluctuation' 
  | 'false_complaint_burst';
