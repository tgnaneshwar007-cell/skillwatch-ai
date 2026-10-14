import {
  Centre,
  AttendanceSession,
  AttendanceRecord,
  Inspection,
  Alert,
  CorrectiveAction,
} from '../types';
import {
  DEMO_CENTRES,
  DEMO_SESSIONS,
  DEMO_ATTENDANCE,
  DEMO_INSPECTIONS,
  DEMO_ALERTS,
  DEMO_CORRECTIVE_ACTIONS,
} from '../lib/mockData';

const STORAGE_KEYS = {
  CENTRES: 'skillwatch_centres_v2',
  SESSIONS: 'skillwatch_sessions_v2',
  ATTENDANCE: 'skillwatch_attendance_v2',
  INSPECTIONS: 'skillwatch_inspections_v2',
  ALERTS: 'skillwatch_alerts_v2',
  ACTIONS: 'skillwatch_actions_v2',
};

// Helper to initialize local storage safely without forced fake seeds
function initStorage<T>(key: string, initialData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return initialData;
  }
}

export function getLocalCentres(): Centre[] {
  return initStorage<Centre>(STORAGE_KEYS.CENTRES, []);
}

export function saveLocalCentres(centres: Centre[]) {
  localStorage.setItem(STORAGE_KEYS.CENTRES, JSON.stringify(centres));
}

export function getLocalSessions(): AttendanceSession[] {
  return initStorage<AttendanceSession>(STORAGE_KEYS.SESSIONS, []);
}

export function saveLocalSessions(sessions: AttendanceSession[]) {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getLocalAttendance(): AttendanceRecord[] {
  return initStorage<AttendanceRecord>(STORAGE_KEYS.ATTENDANCE, []);
}

export function saveLocalAttendance(records: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
}

export function getLocalInspections(): Inspection[] {
  return initStorage<Inspection>(STORAGE_KEYS.INSPECTIONS, []);
}

export function saveLocalInspections(inspections: Inspection[]) {
  localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));
}

export function getLocalAlerts(): Alert[] {
  return initStorage<Alert>(STORAGE_KEYS.ALERTS, []);
}

export function saveLocalAlerts(alerts: Alert[]) {
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
}

export function getLocalActions(): CorrectiveAction[] {
  return initStorage<CorrectiveAction>(STORAGE_KEYS.ACTIONS, []);
}

export function saveLocalActions(actions: CorrectiveAction[]) {
  localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(actions));
}

// Explicit opt-in seeder for hackathon evaluation demo
export function seedVerifiedStarterData(): void {
  saveLocalCentres(DEMO_CENTRES);
  saveLocalSessions(DEMO_SESSIONS);
  saveLocalAttendance(DEMO_ATTENDANCE);
  saveLocalInspections(DEMO_INSPECTIONS);
  saveLocalAlerts(DEMO_ALERTS);
  saveLocalActions(DEMO_CORRECTIVE_ACTIONS);
}

// Reset store to pristine zero state
export function resetLocalStore(): void {
  saveLocalCentres([]);
  saveLocalSessions([]);
  saveLocalAttendance([]);
  saveLocalInspections([]);
  saveLocalAlerts([]);
  saveLocalActions([]);
}

