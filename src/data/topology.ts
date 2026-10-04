import { TopologyNode, NetworkSegment, Household } from '../types';
import { Mulberry32 } from '../engine/prng';

export const NODES: TopologyNode[] = [
  { id: 'TANK', name: 'Overhead Tank', type: 'tank', x: 80, y: 170, hasSensor: false },
  { id: 'T0', name: 'Main Feeder (T0)', type: 'sensor', x: 210, y: 170, hasSensor: true, sensorId: 'SN-T0', hasQualitySensor: true },
  { id: 'J1', name: 'Junction J1', type: 'junction', x: 380, y: 170, hasSensor: true, sensorId: 'SN-J1', hasQualitySensor: false },
  { id: 'J2', name: 'Junction J2', type: 'junction', x: 560, y: 170, hasSensor: true, sensorId: 'SN-J2', hasQualitySensor: true },
  { id: 'E1', name: 'Tail End E1', type: 'tail_end', x: 740, y: 170, hasSensor: true, sensorId: 'SN-E1', hasQualitySensor: true },
  { id: 'A1', name: 'North Branch A1', type: 'junction', x: 380, y: 60, hasSensor: false },
  { id: 'C1', name: 'North Branch C1', type: 'junction', x: 560, y: 60, hasSensor: false },
  { id: 'B1', name: 'South Branch B1', type: 'junction', x: 380, y: 300, hasSensor: true, sensorId: 'SN-B1', hasQualitySensor: false },
  { id: 'B2', name: 'South Tail B2', type: 'junction', x: 620, y: 300, hasSensor: true, sensorId: 'SN-B2', hasQualitySensor: false },
];

export const SEGMENTS: NetworkSegment[] = [
  { id: 'S1', name: 'S1: TANK - T0', fromNode: 'TANK', toNode: 'T0', lengthMeters: 180, diameterMm: 120, downstreamSensorId: 'SN-T0', households: [] },
  { id: 'S2', name: 'S2: T0 - J1', fromNode: 'T0', toNode: 'J1', lengthMeters: 220, diameterMm: 100, upstreamSensorId: 'SN-T0', downstreamSensorId: 'SN-J1', households: ['H01'] },
  { id: 'S3', name: 'S3: J1 - J2', fromNode: 'J1', toNode: 'J2', lengthMeters: 250, diameterMm: 80, upstreamSensorId: 'SN-J1', downstreamSensorId: 'SN-J2', households: ['H02', 'H03', 'H04'] },
  { id: 'S4', name: 'S4: J2 - E1', fromNode: 'J2', toNode: 'E1', lengthMeters: 210, diameterMm: 65, upstreamSensorId: 'SN-J2', downstreamSensorId: 'SN-E1', households: ['H05'] },
  { id: 'S5', name: 'S5: J1 - A1', fromNode: 'J1', toNode: 'A1', lengthMeters: 130, diameterMm: 50, upstreamSensorId: 'SN-J1', households: ['H06', 'H07'] },
  { id: 'S6', name: 'S6: J2 - C1', fromNode: 'J2', toNode: 'C1', lengthMeters: 140, diameterMm: 50, upstreamSensorId: 'SN-J2', households: ['H08', 'H09'] },
  { id: 'S7', name: 'S7: J1 - B1', fromNode: 'J1', toNode: 'B1', lengthMeters: 190, diameterMm: 80, upstreamSensorId: 'SN-J1', downstreamSensorId: 'SN-B1', households: ['H10', 'H11'] },
  { id: 'S8', name: 'S8: B1 - B2', fromNode: 'B1', toNode: 'B2', lengthMeters: 280, diameterMm: 65, upstreamSensorId: 'SN-B1', downstreamSensorId: 'SN-B2', households: ['H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'H19', 'H20'] },
];

// Seeded generator for 20 households
const prng = new Mulberry32(26255);

const householdNames = [
  'K. Ramanathan', 'M. Selvi', 'R. Murugan', 'P. Lakshmi', 'S. Arumugam',
  'V. Kamala', 'D. Sundaram', 'A. Meenakshi', 'K. Balaji', 'N. Thangavel',
  'G. Revathi', 'T. Anbu', 'C. Priya', 'M. Karuppan', 'J. Jayanthi',
  'S. Muthu', 'K. Shenbagam', 'E. Palani', 'R. Vanitha', 'B. Loganathan'
];

export const HOUSEHOLDS: Household[] = [
  { id: 'H01', segmentId: 'S2' },
  { id: 'H02', segmentId: 'S3' },
  { id: 'H03', segmentId: 'S3' },
  { id: 'H04', segmentId: 'S3' },
  { id: 'H05', segmentId: 'S4' },
  { id: 'H06', segmentId: 'S5' },
  { id: 'H07', segmentId: 'S5' },
  { id: 'H08', segmentId: 'S6' },
  { id: 'H09', segmentId: 'S6' },
  { id: 'H10', segmentId: 'S7' },
  { id: 'H11', segmentId: 'S7' },
  { id: 'H12', segmentId: 'S8' },
  { id: 'H13', segmentId: 'S8' },
  { id: 'H14', segmentId: 'S8' },
  { id: 'H15', segmentId: 'S8' },
  { id: 'H16', segmentId: 'S8' },
  { id: 'H17', segmentId: 'S8' },
  { id: 'H18', segmentId: 'S8' },
  { id: 'H19', segmentId: 'S8' },
  { id: 'H20', segmentId: 'S8' },
].map((item, index) => {
  const rate = Number((0.30 + prng.next() * 0.60).toFixed(2)); // seeded 0.3 - 0.9
  const languages: ('ta' | 'hi' | 'en')[] = ['ta', 'ta', 'en', 'hi'];
  const lang = languages[index % languages.length];
  const latBase = 11.2340;
  const lonBase = 78.9860;
  const latOffset = (index % 5) * 0.0008 + (Math.floor(index / 5)) * 0.0003;
  const lonOffset = (index % 4) * 0.0009 + (Math.floor(index / 4)) * 0.0004;

  return {
    id: item.id,
    officialId: `JJM-TN-04-V01-${item.id}`,
    name: householdNames[index],
    headOfHousehold: householdNames[index],
    segmentId: item.segmentId,
    latitude: Number((latBase + latOffset).toFixed(6)),
    longitude: Number((lonBase + lonOffset).toFixed(6)),
    reportingRate: rate,
    preferredLanguage: lang,
    fhtcId: `FHTC-2024-${(1000 + index + 1)}`,
    isRegistered: true,
  };
});

// Upstream dependency paths: mapping each segment to all upstream segments from tank
export const UPSTREAM_SEGMENTS: Record<string, string[]> = {
  S1: ['S1'],
  S2: ['S1', 'S2'],
  S3: ['S1', 'S2', 'S3'],
  S4: ['S1', 'S2', 'S3', 'S4'],
  S5: ['S1', 'S2', 'S5'],
  S6: ['S1', 'S2', 'S3', 'S6'],
  S7: ['S1', 'S2', 'S7'],
  S8: ['S1', 'S2', 'S7', 'S8'],
};

// Downstream affected households when segment e fails
export const DOWNSTREAM_HOUSEHOLDS: Record<string, string[]> = {
  S1: HOUSEHOLDS.map(h => h.id), // All 20
  S2: HOUSEHOLDS.map(h => h.id), // All 20
  S3: ['H02', 'H03', 'H04', 'H05', 'H08', 'H09'], // 6 households
  S4: ['H05'], // 1 household
  S5: ['H06', 'H07'], // 2 households
  S6: ['H08', 'H09'], // 2 households
  S7: ['H10', 'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'H19', 'H20'], // 11 households
  S8: ['H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'H19', 'H20'], // 9 households
};

// Downstream segments
export const DOWNSTREAM_SEGMENTS: Record<string, string[]> = {
  S1: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
  S2: ['S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
  S3: ['S3', 'S4', 'S6'],
  S4: ['S4'],
  S5: ['S5'],
  S6: ['S6'],
  S7: ['S7', 'S8'],
  S8: ['S8'],
};
