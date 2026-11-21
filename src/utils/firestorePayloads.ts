import { serverTimestamp, FieldValue } from 'firebase/firestore';
import { Complaint, Severity, TicketStatus, UserRole } from '../types';
import { DEPARTMENTS } from '../data/departments';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'lohithadiver123@gmail.com';

export function clampString(value: string | undefined, maxLength: number, fallback = ''): string {
  const str = (value ?? fallback).trim();
  if (!str) return fallback;
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

export function sanitizeId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  return cleaned.slice(0, 128) || 'id_default';
}

export function getDepartmentIdForSector(sectorId: string, departmentName?: string): string {
  const bySector = DEPARTMENTS.find((d) => d.sectorIds.includes(sectorId));
  if (bySector) return bySector.id;
  if (departmentName) {
    const byName = DEPARTMENTS.find((d) =>
      d.name.toLowerCase().includes(departmentName.toLowerCase())
    );
    if (byName) return byName.id;
  }
  return 'dept-roads';
}

export interface FirestoreComplaintCreatePayload {
  ticketCode: string;
  title: string;
  description: string;
  sectorId: string;
  sectorName: string;
  sectorIcon: string;
  severity: Severity;
  priorityScore: number;
  department: string;
  departmentId: string;
  status: TicketStatus;
  ward: string;
  locationName: string;
  lat: number;
  lng: number;
  reportedAt: string;
  resolvedAt?: string;
  reporterUid: string;
  citizenName: string;
  language?: string;
  imageUrl?: string;
  aiReasoning: string;
  recommendedAction: string;
  assignedTeam?: string;
  slaHours: number;
  timeRemaining?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  upvoteCount: number;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

export function buildComplaintCreatePayload(
  input: Omit<Complaint, 'id' | 'reportedAt'>,
  ticketCode: string,
  reporterUid: string,
  reportedAtLabel = 'Just now'
): FirestoreComplaintCreatePayload {
  const safeSectorId = /^\d{2}$/.test(input.sectorId) ? input.sectorId : '01';
  const safeTicketCode = /^CL-\d{1,10}$/.test(ticketCode) ? ticketCode : `CL-${Date.now().toString().slice(-6)}`;
  const departmentId = sanitizeId(
    input.departmentId || getDepartmentIdForSector(safeSectorId, input.department)
  );
  const lat = Number.isFinite(input.coordinates?.[0])
    ? Math.max(-90, Math.min(90, input.coordinates[0]))
    : 12.9716;
  const lng = Number.isFinite(input.coordinates?.[1])
    ? Math.max(-180, Math.min(180, input.coordinates[1]))
    : 77.5946;

  const payload: FirestoreComplaintCreatePayload = {
    ticketCode: safeTicketCode,
    title: clampString(input.title, 200, 'Civic Incident Report'),
    description: clampString(input.description, 4000, 'No description provided'),
    sectorId: safeSectorId,
    sectorName: clampString(input.sectorName, 100, 'Roads & Infrastructure'),
    sectorIcon: clampString(input.sectorIcon, 16, '🏛️'),
    severity: input.severity,
    priorityScore: Math.max(0, Math.min(100, Math.round(input.priorityScore || 50))),
    department: clampString(input.department, 120, 'Public Works / Roads Department'),
    departmentId,
    status: input.status || 'New',
    ward: clampString(input.ward, 32, 'Ward 1'),
    locationName: clampString(input.locationName, 200, 'City Corridor'),
    lat,
    lng,
    reportedAt: clampString(reportedAtLabel, 64, 'Just now'),
    reporterUid: sanitizeId(reporterUid),
    citizenName: clampString(input.citizenName, 120, 'Citizen'),
    aiReasoning: clampString(input.aiReasoning, 1000, 'Automated AI triage classification.'),
    recommendedAction: clampString(input.recommendedAction, 1000, 'Assign municipal field inspection.'),
    slaHours: Math.max(1, Math.min(168, Math.round(input.slaHours || 24))),
    visibility: 'PUBLIC',
    upvoteCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.resolvedAt) {
    payload.resolvedAt = clampString(input.resolvedAt, 64);
  }
  if (input.language) {
    payload.language = clampString(input.language, 64);
  }
  if (input.imageUrl && input.imageUrl.length <= 1000 && !input.imageUrl.startsWith('data:')) {
    payload.imageUrl = clampString(input.imageUrl, 1000);
  }
  if (input.assignedTeam) {
    payload.assignedTeam = clampString(input.assignedTeam, 120);
  }
  if (input.timeRemaining) {
    payload.timeRemaining = clampString(input.timeRemaining, 32);
  }

  return payload;
}

export function buildUserProfilePayload(params: {
  uid: string;
  displayName: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  ward?: string;
  isCreate: boolean;
}) {
  const base: Record<string, unknown> = {
    uid: sanitizeId(params.uid),
    displayName: clampString(params.displayName, 120, 'CivicLens User'),
    role: params.role,
    updatedAt: serverTimestamp(),
  };

  if (params.isCreate) {
    base.createdAt = serverTimestamp();
  }
  if (params.departmentId) {
    base.departmentId = sanitizeId(params.departmentId).slice(0, 64);
  }
  if (params.departmentName) {
    base.departmentName = clampString(params.departmentName, 120);
  }
  if (params.ward) {
    base.ward = clampString(params.ward, 32);
  }

  return base;
}
