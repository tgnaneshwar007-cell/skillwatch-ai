import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Centre } from '../types';
import { getLocalCentres, saveLocalCentres } from './storageStore';

export async function fetchCentres(): Promise<Centre[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('centres')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data !== null) {
        return data as Centre[];
      }
      if (error) {
        console.warn('Supabase centres notice (table may need schema execution):', error.message);
      }
    } catch (err) {
      console.warn('Supabase centres connection notice:', err);
    }
  }

  // Fallback to local persistent store (defaults to [] if no records created yet)
  return getLocalCentres();
}

export async function fetchCentreById(id: string): Promise<Centre | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('centres')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Centre;
      }
    } catch (err) {
      console.warn('Supabase centre lookup notice:', err);
    }
  }

  const centres = getLocalCentres();
  return centres.find(c => c.id === id) || null;
}

export async function createCentre(
  centreData: Omit<Centre, 'id' | 'created_at'>
): Promise<Centre> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('centres')
        .insert({
          ...centreData,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Centre;
      }
    } catch (err) {
      console.warn('Supabase create centre notice:', err);
    }
  }

  const newCentre: Centre = {
    ...centreData,
    id: `tc-${Date.now()}`,
    created_at: now,
  };

  const centres = getLocalCentres();
  saveLocalCentres([newCentre, ...centres]);
  return newCentre;
}
