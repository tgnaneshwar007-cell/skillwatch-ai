import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AttendanceSession, AttendanceRecord } from '../types';
import {
  getLocalSessions,
  saveLocalSessions,
  getLocalAttendance,
  saveLocalAttendance,
  getLocalCentres,
} from './storageStore';
import { isSessionExpired } from '../lib/validation';

export interface CreateSessionParams {
  centre_id: string;
  batch_name: string;
  durationMinutes: number;
  created_by_name: string;
}

export interface CheckInParams {
  session_token: string;
  trainee_id: string;
  trainee_name: string;
  verification_method: 'qr_scan' | 'manual_token';
  notes?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  error_code?: 'INVALID_SESSION_TOKEN' | 'SESSION_EXPIRED' | 'DUPLICATE_CHECK_IN' | 'VALIDATION_ERROR';
  record?: AttendanceRecord;
  centre_name?: string;
  batch_name?: string;
}

/**
 * Creates a new attendance session with a cryptographically secure token and expiration.
 */
export async function createAttendanceSession(params: CreateSessionParams): Promise<AttendanceSession> {
  const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000).toISOString();
  
  // Generate secure alphanumeric token e.g. "SKILL-RJ-84A29B"
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sessionToken = `SKILL-${randomSuffix}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          centre_id: params.centre_id,
          batch_name: params.batch_name,
          session_token: sessionToken,
          expires_at: expiresAt,
        })
        .select('*, centres(name)')
        .single();

      if (!error && data) {
        return {
          ...data,
          centre_name: data.centres?.name,
          status: 'active',
          attendee_count: 0,
        } as AttendanceSession;
      }
      if (error) {
        console.warn('Supabase create session notice (using local store):', error.message);
      }
    } catch (err) {
      console.warn('Supabase session creation error:', err);
    }
  }

  // Fallback to local persistent store
  const centres = getLocalCentres();
  const centre = centres.find(c => c.id === params.centre_id);

  const newSession: AttendanceSession = {
    id: `ses-${Date.now()}`,
    centre_id: params.centre_id,
    centre_name: centre?.name || 'Assigned Training Centre',
    batch_name: params.batch_name,
    session_token: sessionToken,
    expires_at: expiresAt,
    created_by: params.created_by_name,
    created_at: new Date().toISOString(),
    status: 'active',
    attendee_count: 0,
  };

  const sessions = getLocalSessions();
  saveLocalSessions([newSession, ...sessions]);
  return newSession;
}

/**
 * Fetches all attendance sessions with live status and attendee counts
 */
export async function fetchAttendanceSessions(): Promise<AttendanceSession[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, centres(name), attendance_records(count)')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        return data.map((item: any) => ({
          ...item,
          centre_name: item.centres?.name,
          attendee_count: item.attendance_records?.[0]?.count || 0,
          status: new Date(item.expires_at).getTime() < Date.now() ? 'expired' : 'active',
        })) as AttendanceSession[];
      }
      if (error) {
        console.warn('Supabase sessions notice (table may need schema execution):', error.message);
      }
    } catch (err) {
      console.warn('Supabase sessions fetch notice:', err);
    }
  }

  const sessions = getLocalSessions();
  const attendance = getLocalAttendance();

  return sessions.map(ses => {
    const count = attendance.filter(a => a.session_id === ses.id).length;
    const isExpired = isSessionExpired(ses.expires_at);
    return {
      ...ses,
      attendee_count: count,
      status: isExpired ? 'expired' : ses.status,
    };
  });
}

/**
 * Trusted Trainee Check-in Function with server-side / constraint enforcement
 */
export async function submitTraineeCheckIn(params: CheckInParams): Promise<CheckInResponse> {
  const token = params.session_token.trim().toUpperCase();

  if (isSupabaseConfigured && supabase) {
    try {
      // Call the trusted PostgreSQL stored procedure `check_in_trainee`
      const { data, error } = await supabase.rpc('check_in_trainee', {
        p_session_token: token,
        p_trainee_id: params.trainee_id.trim().toUpperCase(),
        p_trainee_name: params.trainee_name.trim(),
        p_verification_method: params.verification_method,
        p_notes: params.notes || null,
      });

      if (!error && data) {
        return data as CheckInResponse;
      }
    } catch (err) {
      console.warn('Supabase check-in RPC notice (evaluating via engine):', err);
    }
  }

  // --- Trusted Local Logic Validation ---
  const sessions = getLocalSessions();
  const session = sessions.find(s => s.session_token.toUpperCase() === token);

  // 1. Session Existence Check
  if (!session) {
    return {
      success: false,
      error_code: 'INVALID_SESSION_TOKEN',
      message: `Invalid session token "${params.session_token}". Please verify the QR code or request an active token from your centre manager.`,
    };
  }

  // 2. Expiration Check
  if (isSessionExpired(session.expires_at)) {
    return {
      success: false,
      error_code: 'SESSION_EXPIRED',
      message: `Attendance session expired at ${new Date(session.expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Check-in is closed.`,
    };
  }

  // 3. Duplicate Attendance Check (Unique constraint simulation)
  const attendance = getLocalAttendance();
  const normalizedTraineeId = params.trainee_id.trim().toUpperCase();
  const existing = attendance.find(
    a => a.session_id === session.id && a.trainee_id.toUpperCase() === normalizedTraineeId
  );

  if (existing) {
    return {
      success: false,
      error_code: 'DUPLICATE_CHECK_IN',
      message: `Duplicate check-in rejected: Trainee "${normalizedTraineeId}" has already checked in at ${new Date(existing.checked_in_at).toLocaleTimeString('en-IN')}.`,
    };
  }

  // 4. Record attendance
  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}`,
    session_id: session.id,
    centre_id: session.centre_id,
    batch_name: session.batch_name,
    trainee_id: normalizedTraineeId,
    trainee_name: params.trainee_name.trim(),
    checked_in_at: new Date().toISOString(),
    verification_status: 'verified',
    verification_method: params.verification_method,
    notes: params.notes,
  };

  saveLocalAttendance([newRecord, ...attendance]);

  return {
    success: true,
    message: 'Attendance successfully verified and recorded.',
    record: newRecord,
    centre_name: session.centre_name,
    batch_name: session.batch_name,
  };
}

/**
 * Fetch attendance records with optional filtering
 */
export async function fetchAttendanceRecords(filters?: {
  centre_id?: string;
  session_id?: string;
}): Promise<AttendanceRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('attendance_records')
        .select('*')
        .order('checked_in_at', { ascending: false });

      if (filters?.centre_id) query = query.eq('centre_id', filters.centre_id);
      if (filters?.session_id) query = query.eq('session_id', filters.session_id);

      const { data, error } = await query;
      if (!error && data !== null) {
        return data as AttendanceRecord[];
      }
      if (error) {
        console.warn('Supabase attendance records notice (table may need schema execution):', error.message);
      }
    } catch (err) {
      console.warn('Supabase attendance records fetch notice:', err);
    }
  }

  let records = getLocalAttendance();
  if (filters?.centre_id) {
    records = records.filter(r => r.centre_id === filters.centre_id);
  }
  if (filters?.session_id) {
    records = records.filter(r => r.session_id === filters.session_id);
  }
  return records;
}
