import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Inspection,
  InspectionItem,
  ChecklistItemStatus,
  ItemSeverity,
} from '../types';
import {
  getLocalInspections,
  saveLocalInspections,
  getLocalCentres,
} from './storageStore';
import { calculateComplianceScore } from '../lib/calculations';
import { generateAlertsFromInspection } from './alerts';

export const STANDARD_MSDE_REQUIREMENTS: Omit<InspectionItem, 'id' | 'inspection_id'>[] = [
  {
    category: 'Classroom & Infrastructure',
    requirement: 'Classroom dimensions & ergonomic seating capacity (min 30 sq.ft per trainee)',
    description: 'Verify adequate spacing, ventilation, student desks, whiteboards, and natural lighting.',
    status: 'not_inspected',
    severity: 'high',
  },
  {
    category: 'Biometrics & IT Lab',
    requirement: 'AEBAS Functional Biometric Attendance Device & high-speed Internet',
    description: 'Inspect biometric scanner connectivity, battery backup, CCTV feed, and IT lab terminals.',
    status: 'not_inspected',
    severity: 'critical',
  },
  {
    category: 'Training Equipment & Labs',
    requirement: 'Sector Skill Council (SSC) approved training machinery & toolkits',
    description: 'Inspect availability, calibration, and functional state of practical training equipment.',
    status: 'not_inspected',
    severity: 'critical',
  },
  {
    category: 'Fire Safety & Emergency Exits',
    requirement: 'Functional fire extinguishers (ABC type) & unblocked emergency exits',
    description: 'Inspect pressure gauges, inspection tags, emergency evacuation maps, and unobstructed exit doors.',
    status: 'not_inspected',
    severity: 'critical',
  },
  {
    category: 'Sanitation & Drinking Water',
    requirement: 'Hygienic separate gender washrooms & certified RO drinking water',
    description: 'Verify functional plumbing, clean running water, soap dispensers, and water purification system.',
    status: 'not_inspected',
    severity: 'medium',
  },
  {
    category: 'Accessibility (PwD)',
    requirement: 'Accessible ramps and tactile pathways for Persons with Disabilities',
    description: 'Check gradient of entry ramp, sturdy handrails, and barrier-free access to all facilities.',
    status: 'not_inspected',
    severity: 'medium',
  },
  {
    category: 'Power Backup & Electrical Safety',
    requirement: 'Dedicated Online UPS / Silent Diesel Generator (min 4 hrs backup)',
    description: 'Test power failover, electrical panel earthing certificate, and safety circuit breakers.',
    status: 'not_inspected',
    severity: 'high',
  },
  {
    category: 'Domain Safety & PPE',
    requirement: 'Mandatory Personal Protective Equipment (PPE) & First Aid kit',
    description: 'Check safety gear (helmets, goggles, insulated gloves), eye-wash stations, and stocked first aid kit.',
    status: 'not_inspected',
    severity: 'high',
  },
];

export interface SubmitInspectionParams {
  centre_id: string;
  inspector_name: string;
  inspector_notes?: string;
  items: {
    category: string;
    requirement: string;
    description: string;
    status: ChecklistItemStatus;
    severity: ItemSeverity;
    notes?: string;
    evidence_url?: string;
    evidence_filename?: string;
  }[];
}

export async function fetchInspections(): Promise<Inspection[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*, centres(name, district), inspection_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        return data.map((insp: any) => ({
          ...insp,
          centre_name: insp.centres?.name,
          district: insp.centres?.district,
          items: insp.inspection_items || [],
        })) as Inspection[];
      }
      if (error) {
        console.warn('Supabase inspections notice (table may need schema execution):', error.message);
      }
    } catch (err) {
      console.warn('Supabase inspections fetch notice:', err);
    }
  }

  return getLocalInspections();
}

export async function fetchInspectionById(id: string): Promise<Inspection | null> {
  const inspections = await fetchInspections();
  return inspections.find(i => i.id === id) || null;
}

export async function submitInspection(params: SubmitInspectionParams): Promise<Inspection> {
  const compliance = calculateComplianceScore(params.items);
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Insert parent inspection record
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          centre_id: params.centre_id,
          inspector_name: params.inspector_name,
          status: 'submitted',
          overall_compliance_percentage: compliance.percentage,
          inspector_notes: params.inspector_notes,
          submitted_at: now,
        })
        .select()
        .single();

      if (!inspectionError && inspectionData) {
        // 2. Insert inspection items
        const itemsToInsert = params.items.map(item => ({
          inspection_id: inspectionData.id,
          category: item.category,
          requirement: item.requirement,
          description: item.description,
          status: item.status,
          severity: item.severity,
          notes: item.notes,
          evidence_url: item.evidence_url,
          evidence_filename: item.evidence_filename,
        }));

        await supabase.from('inspection_items').insert(itemsToInsert);

        return {
          ...inspectionData,
          items: itemsToInsert,
        } as Inspection;
      }
    } catch (err) {
      console.warn('Supabase inspection save notice (using local store):', err);
    }
  }

  // Fallback to local store with automatic alert generation
  const centres = getLocalCentres();
  const centre = centres.find(c => c.id === params.centre_id);
  const inspectionId = `insp-${Date.now()}`;

  const inspectionItems: InspectionItem[] = params.items.map((item, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    inspection_id: inspectionId,
    ...item,
  }));

  const newInspection: Inspection = {
    id: inspectionId,
    centre_id: params.centre_id,
    centre_name: centre?.name || 'Assigned Centre',
    district: centre?.district || 'Jaipur',
    inspector_id: 'usr-insp-04',
    inspector_name: params.inspector_name,
    status: 'submitted',
    overall_compliance_percentage: compliance.percentage,
    inspector_notes: params.inspector_notes,
    created_at: now,
    submitted_at: now,
    items: inspectionItems,
  };

  const inspections = getLocalInspections();
  saveLocalInspections([newInspection, ...inspections]);

  // Trigger rule-based alerts for any non-compliant items
  generateAlertsFromInspection(newInspection, inspectionItems);

  return newInspection;
}

/**
 * Uploads an evidence photograph to Supabase Storage or creates a data URL preview
 */
export async function uploadEvidenceFile(file: File): Promise<{ url: string; filename: string }> {
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(`inspections/${filename}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('evidence')
          .getPublicUrl(data.path);
        return { url: publicUrlData.publicUrl, filename };
      }
    } catch (err) {
      console.warn('Storage upload error, using preview:', err);
    }
  }

  // Fallback to local data URL for offline preview
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: reader.result as string, filename: file.name });
    reader.onerror = () => reject(new Error('Failed to read evidence file'));
    reader.readAsDataURL(file);
  });
}
