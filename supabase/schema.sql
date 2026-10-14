-- ========================================================================
-- SkillWatch AI — Master Database Schema & Security Policies
-- Problem Statement: SIH26245 (MSDE Smart India Hackathon 2026)
-- Target: Supabase PostgreSQL (with Row Level Security & Edge Stored Procs)
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role_type AS ENUM (
  'national_admin',
  'district_officer',
  'centre_manager',
  'field_inspector'
);

CREATE TYPE centre_status_type AS ENUM (
  'operational',
  'under_review',
  'suspended',
  'closed'
);

CREATE TYPE checklist_status_type AS ENUM (
  'compliant',
  'non_compliant',
  'needs_review',
  'not_inspected'
);

CREATE TYPE alert_severity_type AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

CREATE TYPE alert_status_type AS ENUM (
  'open',
  'acknowledged',
  'in_progress',
  'resolved'
);

CREATE TYPE corrective_action_status_type AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'verified'
);

-- 2. CENTRES TABLE
CREATE TABLE IF NOT EXISTS public.centres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status centre_status_type NOT NULL DEFAULT 'operational',
  enrolled_trainees INTEGER NOT NULL DEFAULT 0,
  active_courses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PROFILES TABLE (Associated with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role_type NOT NULL DEFAULT 'field_inspector',
  assigned_district TEXT,
  assigned_centre_id UUID REFERENCES public.centres(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for rapid token lookup during QR scans
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.attendance_sessions(session_token);

-- 5. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  trainee_id TEXT NOT NULL,
  trainee_name TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verification_status TEXT NOT NULL DEFAULT 'verified',
  verification_method TEXT NOT NULL DEFAULT 'qr_scan', -- 'qr_scan' or 'manual_token'
  notes TEXT,
  
  -- CRITICAL REQUIREMENT: Unique constraint preventing duplicate attendance for same session
  CONSTRAINT uq_session_trainee UNIQUE (session_id, trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_trainee ON public.attendance_records(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance_records(session_id);

-- 6. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspector_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'submitted', 'under_review', 'approved'
  overall_compliance_percentage NUMERIC(5,2),
  inspector_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ
);

-- 7. INSPECTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  requirement TEXT NOT NULL,
  description TEXT NOT NULL,
  status checklist_status_type NOT NULL DEFAULT 'not_inspected',
  severity alert_severity_type NOT NULL DEFAULT 'medium',
  notes TEXT,
  evidence_url TEXT,
  evidence_filename TEXT
);

-- 8. EVIDENCE FILES TABLE
CREATE TABLE IF NOT EXISTS public.evidence_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. ALERTS TABLE (Rule-based detection)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  recommended_step TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  severity alert_severity_type NOT NULL DEFAULT 'medium',
  status alert_status_type NOT NULL DEFAULT 'open',
  source_type TEXT NOT NULL, -- 'inspection', 'attendance', 'session'
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- 10. CORRECTIVE ACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  centre_id UUID NOT NULL REFERENCES public.centres(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to_name TEXT NOT NULL,
  assigned_to_email TEXT NOT NULL,
  due_date DATE NOT NULL,
  status corrective_action_status_type NOT NULL DEFAULT 'pending',
  resolution_notes TEXT,
  resolution_evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ========================================================================
-- TRUSTED DATABASE FUNCTIONS FOR ATTENDANCE VALIDATION & RULE-BASED ALERTS
-- ========================================================================

-- Secure function to check-in trainee with server-side validation
CREATE OR REPLACE FUNCTION public.check_in_trainee(
  p_session_token TEXT,
  p_trainee_id TEXT,
  p_trainee_name TEXT,
  p_verification_method TEXT DEFAULT 'qr_scan',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_new_record_id UUID;
BEGIN
  -- 1. Validate session existence
  SELECT s.*, c.name as centre_name INTO v_session
  FROM public.attendance_sessions s
  JOIN public.centres c ON c.id = s.centre_id
  WHERE s.session_token = p_session_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_SESSION_TOKEN',
      'message', 'The scanned QR code or session token is invalid or does not exist.'
    );
  END IF;

  -- 2. Validate expiration
  IF v_session.expires_at < timezone('utc'::text, now()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'SESSION_EXPIRED',
      'message', 'This attendance session expired at ' || to_char(v_session.expires_at, 'YYYY-MM-DD HH24:MI:SS') || ' UTC.'
    );
  END IF;

  -- 3. Check for duplicate check-in
  IF EXISTS (
    SELECT 1 FROM public.attendance_records
    WHERE session_id = v_session.id AND trainee_id = p_trainee_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'DUPLICATE_CHECK_IN',
      'message', 'Duplicate check-in rejected: Trainee ' || p_trainee_id || ' has already checked in for this session.'
    );
  END IF;

  -- 4. Record attendance
  INSERT INTO public.attendance_records (
    session_id,
    centre_id,
    batch_name,
    trainee_id,
    trainee_name,
    verification_status,
    verification_method,
    notes
  ) VALUES (
    v_session.id,
    v_session.centre_id,
    v_session.batch_name,
    p_trainee_id,
    p_trainee_name,
    'verified',
    p_verification_method,
    p_notes
  ) RETURNING id INTO v_new_record_id;

  RETURN jsonb_build_object(
    'success', true,
    'record_id', v_new_record_id,
    'centre_name', v_session.centre_name,
    'batch_name', v_session.batch_name,
    'checked_in_at', now(),
    'message', 'Attendance successfully verified and recorded.'
  );
END;
$$;

-- Secure trigger: Create Rule-Based Alert automatically when an inspection item is marked non_compliant
CREATE OR REPLACE FUNCTION public.trg_flag_inspection_non_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_centre_id UUID;
  v_centre_name TEXT;
  v_rule_code TEXT;
  v_explanation TEXT;
BEGIN
  IF NEW.status = 'non_compliant' THEN
    SELECT i.centre_id, c.name INTO v_centre_id, v_centre_name
    FROM public.inspections i
    JOIN public.centres c ON c.id = i.centre_id
    WHERE i.id = NEW.inspection_id;

    v_rule_code := 'RULE_INSPECTION_DEFECT_' || UPPER(REPLACE(NEW.category, ' ', '_'));
    v_explanation := 'Automated compliance rule engine flagged non-compliant requirement: "' || NEW.requirement || '". Category: ' || NEW.category;

    INSERT INTO public.alerts (
      centre_id,
      title,
      explanation,
      recommended_step,
      rule_code,
      severity,
      status,
      source_type,
      source_id
    ) VALUES (
      v_centre_id,
      'Non-Compliance: ' || NEW.category,
      v_explanation,
      'Initiate corrective action notice with centre manager to rectify defect within assigned SLA.',
      v_rule_code,
      NEW.severity,
      'open',
      'inspection',
      NEW.inspection_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inspection_item_alert ON public.inspection_items;
CREATE TRIGGER trg_inspection_item_alert
AFTER INSERT OR UPDATE OF status ON public.inspection_items
FOR EACH ROW EXECUTE FUNCTION public.trg_flag_inspection_non_compliance();

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE public.centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Centres: Read accessible to all authenticated, write to national_admin
CREATE POLICY "Centres are viewable by authenticated users"
  ON public.centres FOR SELECT TO authenticated USING (true);

CREATE POLICY "Centres editable only by national admins"
  ON public.centres FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'national_admin')
  );

-- Profiles: Users can read their own profile or admins/district officers can read all
CREATE POLICY "Profiles viewable by self or higher authorities"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('national_admin', 'district_officer'))
  );

-- Attendance: Anyone authenticated can view sessions, managers can create
CREATE POLICY "Attendance sessions viewable by authenticated users"
  ON public.attendance_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Attendance sessions insertable by managers and admins"
  ON public.attendance_sessions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('national_admin', 'centre_manager', 'district_officer'))
  );

CREATE POLICY "Attendance records viewable by authenticated users"
  ON public.attendance_records FOR SELECT TO authenticated USING (true);

-- Inspections: Viewable by authenticated, insertable by field inspectors & admins
CREATE POLICY "Inspections viewable by authenticated users"
  ON public.inspections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Inspections manageable by field inspectors and admins"
  ON public.inspections FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('field_inspector', 'national_admin'))
  );

CREATE POLICY "Inspection items viewable by authenticated users"
  ON public.inspection_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Inspection items manageable by field inspectors"
  ON public.inspection_items FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('field_inspector', 'national_admin'))
  );

-- Alerts & Corrective Actions: Viewable by authenticated, manageable by officers/admins
CREATE POLICY "Alerts viewable by authenticated users"
  ON public.alerts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Alerts updatable by officers and admins"
  ON public.alerts FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('district_officer', 'national_admin', 'centre_manager'))
  );

CREATE POLICY "Corrective actions viewable by authenticated users"
  ON public.corrective_actions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Corrective actions manageable by authorized staff"
  ON public.corrective_actions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('district_officer', 'national_admin', 'centre_manager'))
  );

-- 12. AI INSPECTION ANALYSIS TABLE (Real Computer Vision Inference Log)
CREATE TABLE IF NOT EXISTS public.ai_inspection_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  centre_id UUID REFERENCES public.centres(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  inference_engine TEXT NOT NULL DEFAULT 'COCO-SSD MobileNetV2',
  inference_time_ms INTEGER NOT NULL,
  detected_person_count INTEGER NOT NULL DEFAULT 0,
  expected_attendance_count INTEGER DEFAULT 0,
  discrepancy_detected BOOLEAN NOT NULL DEFAULT false,
  raw_detections JSONB NOT NULL DEFAULT '[]'::jsonb,
  human_reviewed BOOLEAN NOT NULL DEFAULT false,
  human_verdict TEXT, -- 'approved', 'rejected', 'reassessed'
  human_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_inspection_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI inspection analysis viewable by authenticated users"
  ON public.ai_inspection_analysis FOR SELECT TO authenticated USING (true);

CREATE POLICY "AI inspection analysis insertable by authenticated users"
  ON public.ai_inspection_analysis FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "AI inspection analysis updatable by officers and inspectors"
  ON public.ai_inspection_analysis FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('field_inspector', 'district_officer', 'national_admin'))
  );

-- Storage bucket configuration script
-- (In Supabase dashboard, create a public or authenticated bucket named 'evidence')

