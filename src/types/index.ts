// SkillWatch AI — Core Domain Types

export type UserRole = 
  | 'national_admin'
  | 'district_officer'
  | 'centre_manager'
  | 'field_inspector';

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  assigned_district?: string | null;
  assigned_centre_id?: string | null;
  created_at: string;
}

export type CentreStatus = 'operational' | 'under_review' | 'suspended' | 'closed';

export interface Centre {
  id: string;
  name: string;
  code: string; // e.g. "TC-RJ-JAI-001"
  district: string;
  state: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  status: CentreStatus;
  enrolled_trainees: number;
  active_courses: number;
  created_at: string;
}

export interface AttendanceSession {
  id: string;
  centre_id: string;
  centre_name?: string;
  batch_name: string;
  session_token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
  status: 'active' | 'expired' | 'closed';
  attendee_count?: number;
}

export type AttendanceVerificationStatus = 'verified' | 'flagged' | 'rejected';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  trainee_id: string; // National Skill ID or Trainee ID, e.g. "TR-2026-0891"
  trainee_name: string;
  batch_name: string;
  centre_id: string;
  checked_in_at: string;
  verification_status: AttendanceVerificationStatus;
  verification_method: 'qr_scan' | 'manual_token';
  ip_address?: string;
  device_info?: string;
  notes?: string;
}

export type InspectionStatus = 'in_progress' | 'submitted' | 'under_review' | 'approved';

export interface Inspection {
  id: string;
  centre_id: string;
  centre_name?: string;
  district?: string;
  inspector_id: string;
  inspector_name: string;
  status: InspectionStatus;
  overall_compliance_percentage: number | null; // calculated
  inspector_notes?: string;
  created_at: string;
  submitted_at?: string | null;
  items?: InspectionItem[];
}

export type ChecklistItemStatus = 'compliant' | 'non_compliant' | 'needs_review' | 'not_inspected';
export type ItemSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface InspectionItem {
  id: string;
  inspection_id: string;
  category: string; // e.g. "Classroom", "Biometrics", "Sanitation"
  requirement: string;
  description: string;
  status: ChecklistItemStatus;
  severity: ItemSeverity;
  notes?: string;
  evidence_url?: string;
  evidence_filename?: string;
}

export interface EvidenceFile {
  id: string;
  inspection_item_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';

export interface Alert {
  id: string;
  centre_id: string;
  centre_name: string;
  district: string;
  title: string;
  explanation: string;
  recommended_step: string;
  rule_code: string; // e.g. "RULE_NON_COMPLIANT_SAFETY", "RULE_ATTENDANCE_DEFICIT"
  severity: AlertSeverity;
  status: AlertStatus;
  source_type: 'inspection' | 'attendance' | 'session';
  source_id?: string;
  created_at: string;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
}

export type CorrectiveActionStatus = 'pending' | 'in_progress' | 'completed' | 'verified';

export interface CorrectiveAction {
  id: string;
  alert_id?: string;
  centre_id: string;
  centre_name: string;
  description: string;
  assigned_to_name: string;
  assigned_to_email: string;
  due_date: string;
  status: CorrectiveActionStatus;
  resolution_notes?: string;
  resolution_evidence_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: string;
  timestamp: string;
}

export interface AIDetection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

export interface AIInspectionAnalysis {
  id: string;
  inspection_id?: string;
  centre_id: string;
  centre_name?: string;
  image_url: string;
  inference_engine: string;
  inference_time_ms: number;
  detected_person_count: number;
  expected_attendance_count: number;
  discrepancy_detected: boolean;
  detections: AIDetection[];
  human_reviewed: boolean;
  human_verdict?: 'approved' | 'rejected' | 'reassessed' | null;
  human_notes?: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_centres: number;
  operational_centres: number;
  today_attendance_rate: number | null;
  infrastructure_compliance_score: number | null;
  open_alerts_count: number;
  critical_alerts_count: number;
  pending_inspections_count: number;
}

