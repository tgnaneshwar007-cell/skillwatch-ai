import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Alert, AlertStatus, Inspection, InspectionItem } from '../types';
import { getLocalAlerts, saveLocalAlerts } from './storageStore';

export async function fetchAlerts(): Promise<Alert[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, centres(name, district)')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        return data.map((a: any) => ({
          ...a,
          centre_name: a.centres?.name,
          district: a.centres?.district,
        })) as Alert[];
      }
      if (error) {
        console.warn('Supabase alerts notice (table may need schema execution):', error.message);
      }
    } catch (err) {
      console.warn('Supabase alerts fetch notice:', err);
    }
  }

  return getLocalAlerts();
}

export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
  officerName: string
): Promise<Alert | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload: any = {
        status,
        acknowledged_by: officerName,
        acknowledged_at: now,
      };
      if (status === 'resolved') {
        updatePayload.resolved_at = now;
      }

      const { data, error } = await supabase
        .from('alerts')
        .update(updatePayload)
        .eq('id', alertId)
        .select('*, centres(name, district)')
        .single();

      if (!error && data) {
        return {
          ...data,
          centre_name: data.centres?.name,
          district: data.centres?.district,
        } as Alert;
      }
    } catch (err) {
      console.warn('Supabase alert update notice:', err);
    }
  }

  const alerts = getLocalAlerts();
  const index = alerts.findIndex(a => a.id === alertId);
  if (index === -1) return null;

  const updated: Alert = {
    ...alerts[index],
    status,
    acknowledged_by: officerName,
    acknowledged_at: alerts[index].acknowledged_at || now,
    resolved_at: status === 'resolved' ? now : alerts[index].resolved_at,
  };

  alerts[index] = updated;
  saveLocalAlerts(alerts);
  return updated;
}

/**
 * Transparent Rule Engine: Evaluates inspection items and generates alerts for non-compliant criteria.
 */
export function generateAlertsFromInspection(
  inspection: Inspection,
  items: InspectionItem[]
): Alert[] {
  const generatedAlerts: Alert[] = [];
  const now = new Date().toISOString();

  for (const item of items) {
    if (item.status === 'non_compliant') {
      const alert: Alert = {
        id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        centre_id: inspection.centre_id,
        centre_name: inspection.centre_name || 'Training Centre',
        district: inspection.district || 'District HQ',
        title: `Non-Compliance Flag: ${item.category}`,
        explanation: `Rule Engine (RULE_INSPECTION_DEFECT) detected failure of requirement: "${item.requirement}". Severity: ${item.severity.toUpperCase()}. Inspector notes: "${item.notes || 'No specific notes recorded'}"`,
        recommended_step: `Assign corrective action to Centre Manager to rectify ${item.category.toLowerCase()} defect within standard SLA.`,
        rule_code: `RULE_DEFECT_${item.category.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
        severity: item.severity,
        status: 'open',
        source_type: 'inspection',
        source_id: inspection.id,
        created_at: now,
      };
      generatedAlerts.push(alert);
    }
  }

  if (generatedAlerts.length > 0) {
    const existing = getLocalAlerts();
    saveLocalAlerts([...generatedAlerts, ...existing]);
  }

  return generatedAlerts;
}
