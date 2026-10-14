import { createClient, SupabaseClient } from '@supabase/supabase-js';

function sanitizeUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return '';
  let clean = rawUrl.trim();
  // Strip trailing /rest/v1 or /rest/v1/ or trailing slash
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseUrl = sanitizeUrl(rawUrl);
export const supabaseAnonKey = rawAnonKey?.trim() || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'your-supabase-anon-publishable-key-here'
);

export const configurationError: string | null = isSupabaseConfigured
  ? null
  : 'Supabase credentials are not configured or are using placeholder values. SkillWatch AI is running in interactive demonstration mode with local persistence.';

// Create standard Supabase client if configured
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

if (isSupabaseConfigured) {
  console.info(
    '[SkillWatch AI] %cConnected to Supabase%c at ' + supabaseUrl,
    'color: #0d9488; font-weight: bold;',
    'color: inherit;'
  );
} else {
  console.info(
    '[SkillWatch AI] %cRunning in Interactive Demonstration Mode%c. No live Supabase credentials detected in VITE_SUPABASE_URL.',
    'color: #2563eb; font-weight: bold;',
    'color: inherit;'
  );
}

export interface SupabaseHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  tablesCreated: boolean;
  url: string;
  errorMessage?: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      isConnected: false,
      tablesCreated: false,
      url: '',
      errorMessage: 'VITE_SUPABASE_URL and publishable key not configured.',
    };
  }

  try {
    const { error } = await supabase.from('centres').select('id').limit(1);
    if (!error) {
      return {
        isConfigured: true,
        isConnected: true,
        tablesCreated: true,
        url: supabaseUrl,
      };
    }

    if (
      error.code === 'PGRST205' ||
      error.message?.includes('schema cache') ||
      error.message?.includes('not find the table') ||
      error.message?.includes('relation')
    ) {
      return {
        isConfigured: true,
        isConnected: true,
        tablesCreated: false,
        url: supabaseUrl,
        errorMessage: 'Database connected, but PostgreSQL tables (public.centres, etc.) not found in schema cache. Run supabase/schema.sql in Supabase SQL Editor.',
      };
    }

    return {
      isConfigured: true,
      isConnected: false,
      tablesCreated: false,
      url: supabaseUrl,
      errorMessage: error.message,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      tablesCreated: false,
      url: supabaseUrl,
      errorMessage: err.message || 'Network connectivity error.',
    };
  }
}
