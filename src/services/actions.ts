import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CorrectiveAction, CorrectiveActionStatus } from '../types';
import { getLocalActions, saveLocalActions } from './storageStore';
import { updateAlertStatus } from './alerts';

export interface CreateCorrectiveActionParams {
  alert_id?: string;
  centre_id: string;
  centre_name: string;
  description: string;
  assigned_to_name: string;
  assigned_to_email: string;
  due_date: string;
}

export async function fetchCorrectiveActions(): Promise<CorrectiveAction[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('corrective_actions')
        .select('*, centres(name)')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        return data.map((ca: any) => ({
          ...ca,
          centre_name: ca.centres?.name || ca.centre_name,
        })) as CorrectiveAction[];
      }
      if (error) {
        console.warn('Supabase corrective actions notice (table may need schema execution):', error.message);
      }
    } catch (err) {
      console.warn('Supabase corrective actions fetch notice:', err);
    }
  }

  return getLocalActions();
}

export async function createCorrectiveAction(
  params: CreateCorrectiveActionParams,
  officerName: string
): Promise<CorrectiveAction> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('corrective_actions')
        .insert({
          alert_id: params.alert_id,
          centre_id: params.centre_id,
          description: params.description,
          assigned_to_name: params.assigned_to_name,
          assigned_to_email: params.assigned_to_email,
          due_date: params.due_date,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        if (params.alert_id) {
          await updateAlertStatus(params.alert_id, 'in_progress', officerName);
        }
        return data as CorrectiveAction;
      }
    } catch (err) {
      console.warn('Supabase create action notice:', err);
    }
  }

  const newAction: CorrectiveAction = {
    id: `ca-${Date.now()}`,
    alert_id: params.alert_id,
    centre_id: params.centre_id,
    centre_name: params.centre_name,
    description: params.description,
    assigned_to_name: params.assigned_to_name,
    assigned_to_email: params.assigned_to_email,
    due_date: params.due_date,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  const actions = getLocalActions();
  saveLocalActions([newAction, ...actions]);

  if (params.alert_id) {
    await updateAlertStatus(params.alert_id, 'in_progress', officerName);
  }

  return newAction;
}

export async function resolveCorrectiveAction(
  actionId: string,
  resolutionNotes: string,
  officerName: string,
  evidenceUrl?: string
): Promise<CorrectiveAction | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('corrective_actions')
        .update({
          status: 'completed',
          resolution_notes: resolutionNotes,
          resolution_evidence_url: evidenceUrl,
          updated_at: now,
        })
        .eq('id', actionId)
        .select()
        .single();

      if (!error && data) {
        if (data.alert_id) {
          await updateAlertStatus(data.alert_id, 'resolved', officerName);
        }
        return data as CorrectiveAction;
      }
    } catch (err) {
      console.warn('Supabase resolve action notice:', err);
    }
  }

  const actions = getLocalActions();
  const index = actions.findIndex(a => a.id === actionId);
  if (index === -1) return null;

  const updated: CorrectiveAction = {
    ...actions[index],
    status: 'completed',
    resolution_notes: resolutionNotes,
    resolution_evidence_url: evidenceUrl,
    updated_at: now,
  };

  actions[index] = updated;
  saveLocalActions(actions);

  if (updated.alert_id) {
    await updateAlertStatus(updated.alert_id, 'resolved', officerName);
  }

  return updated;
}
