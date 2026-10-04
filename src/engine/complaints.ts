import { CitizenComplaint, ComplaintIssue, Language } from '../types';
import { HOUSEHOLDS } from '../data/topology';

export interface NewComplaintInput {
  householdId: string;
  issue: ComplaintIssue;
  description: string;
  photoUrl?: string;
  gpsValid: boolean;
  distanceFromTapM: number;
  language: Language;
  simulatedTimeMs: number;
  isOffline?: boolean;
}

const SIXTY_MINUTES_MS = 60 * 60 * 1000;

export function processNewComplaint(
  existingComplaints: CitizenComplaint[],
  input: NewComplaintInput
): {
  updatedComplaints: CitizenComplaint[];
  resultComplaint: CitizenComplaint;
  wasMerged: boolean;
  mergedWithId?: string;
} {
  const hh = HOUSEHOLDS.find(h => h.id === input.householdId);
  const officialId = hh ? hh.officialId : `JJM-TN-04-V01-${input.householdId}`;
  const reportingRate = hh ? hh.reportingRate : 0.6;
  const gpsWeight = input.distanceFromTapM <= 50 && input.gpsValid ? 1.0 : 0.3;

  // Check for duplicate within 60 simulated minutes: same household + same issue
  const duplicate = existingComplaints.find(c => 
    c.householdId === input.householdId &&
    c.issue === input.issue &&
    c.status !== 'rejected' &&
    Math.abs(c.simulatedTimeMs - input.simulatedTimeMs) <= SIXTY_MINUTES_MS
  );

  if (duplicate) {
    // Duplicate detected within 60 simulated minutes -> merge
    const mergedComplaint: CitizenComplaint = {
      ...duplicate,
      description: `${duplicate.description} [Merged update: ${input.description}]`,
      // Keep best GPS validity if newly provided
      gpsValid: duplicate.gpsValid || input.gpsValid,
      gpsWeight: Math.max(duplicate.gpsWeight, gpsWeight),
      photoUrl: input.photoUrl || duplicate.photoUrl,
      timestamp: new Date(input.simulatedTimeMs).toISOString(),
      simulatedTimeMs: input.simulatedTimeMs,
    };

    const updatedComplaints = existingComplaints.map(c => 
      c.id === duplicate.id ? mergedComplaint : c
    );

    return {
      updatedComplaints,
      resultComplaint: mergedComplaint,
      wasMerged: true,
      mergedWithId: duplicate.id,
    };
  }

  // Not a duplicate: create new complaint
  const newComplaintId = `CMP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const status = input.isOffline ? 'pending_sync' : 'synced';

  const newComplaint: CitizenComplaint = {
    id: newComplaintId,
    householdId: input.householdId,
    householdOfficialId: officialId,
    timestamp: new Date(input.simulatedTimeMs).toISOString(),
    simulatedTimeMs: input.simulatedTimeMs,
    issue: input.issue,
    description: input.description,
    photoUrl: input.photoUrl,
    gpsValid: input.gpsValid,
    distanceFromTapM: input.distanceFromTapM,
    gpsWeight,
    reportingWeight: reportingRate,
    language: input.language,
    status,
  };

  return {
    updatedComplaints: [newComplaint, ...existingComplaints],
    resultComplaint: newComplaint,
    wasMerged: false,
  };
}

export function syncPendingComplaints(complaints: CitizenComplaint[]): CitizenComplaint[] {
  return complaints.map(c => {
    if (c.status === 'pending_sync') {
      return { ...c, status: 'synced' };
    }
    return c;
  });
}
