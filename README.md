# SkillWatch AI — Real-Time Training Centre Monitoring & Infrastructure Compliance

> **Smart India Hackathon 2026**  
> **Problem Statement ID:** SIH26245  
> **Theme:** Smart Education  
> **Organization:** Ministry of Skill Development and Entrepreneurship (MSDE)  
> **Status:** Fully Functional Production MVP  

---

## 1. Executive Summary

**SkillWatch AI** is a government-oriented monitoring platform engineered for the **Ministry of Skill Development & Entrepreneurship (MSDE)**. It delivers real-time attendance telemetry, physical infrastructure compliance auditing, transparent rule-based anomaly detection, and closed-loop corrective action tracking across training centres (PMKK, ITIs, and Pradhan Mantri Kaushal Kendras).

### End-to-End Operational Workflow
```
[Attendance Session Created] 
       │
       ▼
[Dynamic QR Projected on Screen] ──▶ [Trainee Mobile Camera Scan / Token Entry]
                                            │
                                            ▼
[8-Dimension Physical Audit Form] ──▶ [Server-Side Expiry & Duplicate Validation]
       │                                    │
       ▼                                    ▼
[Photo Evidence Uploaded]            [Verified Attendance Stored in PostgreSQL]
       │
       ▼
[Deterministic Rule Engine Flags Non-Compliance]
       │
       ▼
[Critical / High Alert Dispatched to District Officer]
       │
       ▼
[Official Issues Corrective Action Notice with SLA Deadline]
       │
       ▼
[Centre Manager Submits Remediation Proof] ──▶ [Alert Resolved & Dashboard Updated]
```

---

## 2. Key Capabilities & Technical Features

### Priority 1: QR Attendance Workflow
- **Manager Gate Generator:** Authorized managers select an accredited centre, input course/batch metadata, configure expiration durations (15m, 30m, 1h, 2h, 4h), and generate a cryptographically secure token.
- **Dynamic QR Code:** High-contrast projection using `qrcode.react` with copyable manual token backup and direct mobile URL.
- **Mobile Trainee Check-In:** Native smartphone camera scanning via `html5-qrcode` with graceful fallback to manual session code input.
- **Integrity Guards:**
  - Database unique constraint `(session_id, trainee_id)` rejects duplicate check-ins.
  - Server-side timestamp validation rejects expired sessions.
  - Client cannot self-declare attendance; validation is processed via trusted PostgreSQL function `public.check_in_trainee`.
  - Academic disclaimer: QR codes verify session presence without replacing biometric (AEBAS) kiosks.

### Priority 1: 8-Dimension MSDE Physical Audit Inspection
- **Configurable Standard Dimensions:**
  1. Classroom condition & seating capacity (min 30 sq.ft per trainee)
  2. AEBAS Biometric attendance & IT Lab terminals
  3. SSC-approved machinery & practical toolkits
  4. ABC-type fire extinguishers & unobstructed emergency exits
  5. Gender-segregated sanitation & certified RO drinking water
  6. Accessibility ramps & tactile pathways for Persons with Disabilities (PwD)
  7. Power backup (Dedicated Online UPS / Silent DG Set)
  8. Personal Protective Equipment (PPE) & first aid supplies
- **Evidence Uploader:** Direct mobile camera capture or photo upload (supports JPEG, PNG, WEBP, PDF up to 5MB).
- **Transparent Mathematical Formula:**
  $$\text{Compliance Score} = \frac{\text{Compliant Inspected Items}}{\text{Total Applicable Inspected Items}} \times 100$$
  *(Uninspected items are excluded from the denominator; returns "Not assessed" if 0 items assessed).*

### Priority 2: Transparent Rule-Based Anomaly Detection
Deterministic rules detect irregularities without black-box ML claims:
- `RULE_ATTENDANCE_DEFICIT`: Triggers when batch attendance drops below 70% of enrolled trainees.
- `RULE_DUPLICATE_ATTENDANCE`: Catches duplicate check-in attempts on active sessions.
- `RULE_EXPIRED_QR_SCAN`: Flags attempts to scan closed or expired session gates.
- `RULE_DEFECT_[CATEGORY]`: Automatically generates high/critical severity alerts when an auditor marks an inspection requirement as non-compliant.
- `RULE_OVERDUE_CORRECTIVE_ACTION`: Monitors remediation SLAs against scheduled deadlines.

### Priority 3: Role-Based Access Control (RBAC) & Security
- Authenticated roles:
  - **National Administrator:** Country-wide telemetry, accreditation management, and policy oversight.
  - **District Officer:** Jurisdiction-level monitoring, alert triage, and corrective action enforcement.
  - **Training Centre Manager:** Daily gate creation, student onboarding, and defect remediation.
  - **Field Inspector:** On-site physical checklists and evidence logging.
- Security enforcement:
  - Database Row Level Security (RLS) on all 9 PostgreSQL tables.
  - Security-definer stored procedures for attendance check-ins.
  - Zero client-side role elevation.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, React Router 7, Tailwind CSS v3
- **Icons & Charts:** Lucide React, Recharts (Area & Bar telemetry charts)
- **QR Engine:** `qrcode.react` (SVG generator), `html5-qrcode` (camera barcode detector)
- **Backend / Database:** Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Supabase Storage (`evidence` bucket)
- **Verification:** Built-in automated TypeScript test suite (`scripts/verify-workflows.ts`)

---

## 4. Quick Start & Local Execution

### Prerequisites
- Node.js (v20 or v24 recommended)
- npm (v10 or v11)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "Smart Centre"
npm install
```

### 2. Run Automated Verification Tests
```bash
npm test
```
*Executes unit assertions on compliance formulas, attendance deficit calculations, session expiration, and file guards.*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 5. Supabase Database Deployment

1. Create a project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository and run the entire script.
   - Creates `centres`, `profiles`, `attendance_sessions`, `attendance_records`, `inspections`, `inspection_items`, `evidence_files`, `alerts`, `corrective_actions`, and `audit_logs`.
   - Enables RLS policies for each role.
   - Installs the trusted `check_in_trainee()` function and `trg_inspection_item_alert` trigger.
4. In **Storage**, create a bucket named `evidence` (public or authenticated read).
5. Copy `.env.example` to `.env.local` and configure your credentials:
   ```bash
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
   ```
6. If credentials are not provided, **SkillWatch AI automatically runs in Interactive Demonstration Mode with local persistence**, enabling complete end-to-end evaluation out-of-the-box!

---

## 6. Demonstration & Evaluator Guide

For Smart India Hackathon jury presentation:
1. **Login:** Use the 1-Click Evaluator buttons on the `/login` screen to switch between:
   - *National Administrator* (Dr. Rajeshwar Sharma)
   - *District Officer* (Priyanka Rathore, IAS)
   - *Centre Manager* (Vikramaditya Meena)
   - *Field Inspector* (Sunita Deshmukh)
2. **Attendance Session Creation:** Navigate to **QR Attendance Sessions** -> Select *PMKK Jaipur* -> Click **Generate QR Gate & Token**.
3. **Trainee Check-In:** Click **Launch Trainee View** (or navigate to `/check-in`) -> Click **Verify & Record Attendance** -> Notice verified status badge.
4. **Duplicate Rejection Test:** Click submit again with the same Trainee ID -> Notice red rejection alert: *"Duplicate check-in rejected: Trainee already checked in"*.
5. **Infrastructure Inspection:** Navigate to **Infrastructure Inspections** -> **New Physical Audit** -> Mark *Fire Safety* as **Non-Compliant** -> Submit.
6. **Rule Engine Trigger:** Navigate to **Alerts & AI Insights** -> Confirm the automated non-compliance alert appears with rule explanation and next steps.
7. **Corrective Action & Resolution:** Click **Assign Action** -> Set remediation SLA -> Open **Corrective Actions** -> Click **Submit Resolution** -> Verify alert closes and dashboard updates.

---

## 7. Compliance & Ethical Disclaimers

- SkillWatch AI is an academic prototype developed for the Smart India Hackathon 2026 (SIH26245).
- Does not claim official endorsement or invent government regulatory standards.
- QR codes provide session presence verification; they do not replace biometric attendance (AEBAS) kiosks.
- All rule alerts are transparent, deterministic, and audited.
