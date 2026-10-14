import React, { useState, useEffect } from 'react';
import { supabaseUrl, checkSupabaseHealth, SupabaseHealthStatus } from '../../lib/supabase';
import {
  seedVerifiedStarterData,
  resetLocalStore,
  getLocalCentres,
} from '../../services/storageStore';
import schemaSql from '../../../supabase/schema.sql?raw';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export const ConfigBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [health, setHealth] = useState<SupabaseHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [centreCount, setCentreCount] = useState<number>(() => getLocalCentres().length);

  const performHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const status = await checkSupabaseHealth();
      setHealth(status);
      setCentreCount(getLocalCentres().length);
    } catch {
      setHealth({
        isConfigured: false,
        isConnected: false,
        tablesCreated: false,
        url: '',
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    performHealthCheck();
  }, []);

  const copyFullSchema = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const copyQuickGuide = () => {
    const guideText = `-- SKILLWATCH AI POSTGRESQL SCHEMA DEPLOYMENT
-- 1. Open Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select Project -> SQL Editor -> New Query
-- 3. Paste the contents of supabase/schema.sql and click RUN
-- 4. In Storage -> Create Bucket named 'evidence' (Public)`;
    navigator.clipboard.writeText(guideText);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2000);
  };

  const handleSeedBenchmark = () => {
    seedVerifiedStarterData();
    setCentreCount(getLocalCentres().length);
    window.location.reload();
  };

  const handleClearAll = () => {
    resetLocalStore();
    setCentreCount(0);
    window.location.reload();
  };

  const domain = supabaseUrl ? new URL(supabaseUrl).hostname : 'Supabase';
  const isHealthyAndReady = health?.isConnected && health?.tablesCreated;
  const isPendingTables = health?.isConnected && !health?.tablesCreated;

  return (
    <div
      className={`border-b px-4 py-2 text-xs transition-all ${
        isHealthyAndReady
          ? 'bg-teal-50/90 border-teal-200 text-teal-900'
          : isPendingTables
          ? 'bg-amber-50/90 border-amber-200 text-amber-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Live Connection & Schema Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHealthyAndReady ? (
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}

          <div>
            <span className="font-semibold">
              {isHealthyAndReady
                ? 'Cloud PostgreSQL Active:'
                : isPendingTables
                ? 'Supabase Connected (Tables Pending):'
                : 'Offline Persistence Mode:'}
            </span>
            <span className="font-mono ml-1.5 opacity-90">{domain}</span>

            <span className="ml-2 hidden md:inline text-[11px] opacity-80">
              {isHealthyAndReady
                ? '— All PostgreSQL tables & RLS policies verified'
                : isPendingTables
                ? '— Run supabase/schema.sql in SQL Editor to activate cloud tables'
                : '— Local zero-data persistence active'}
            </span>
          </div>
        </div>

        {/* Right: Actions, Health Recheck, Data Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Copy Schema Button */}
          <button
            onClick={copyFullSchema}
            className="inline-flex items-center gap-1 font-semibold text-[11px] bg-white hover:bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            title="Copy entire 456-line schema.sql to clipboard"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-teal-700">Copied schema.sql!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span>Copy schema.sql</span>
              </>
            )}
          </button>

          {/* Recheck Database Connection */}
          <button
            onClick={performHealthCheck}
            disabled={isCheckingHealth}
            className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
            title="Re-check Supabase PostgreSQL connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
          </button>

          {/* Guide Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2 cursor-pointer text-[11px]"
          >
            {isExpanded ? 'Hide Details' : 'Setup & Data Controls'}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              isHealthyAndReady
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {isHealthyAndReady ? 'LIVE PG' : 'TABLES PENDING'}
          </span>
        </div>
      </div>

      {/* Expanded Drawer: Setup Instructions & Explicit Data Controls */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 text-slate-700 space-y-3 text-xs animate-in slide-in-from-top-1 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column 1: Supabase PostgreSQL Schema Sync */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Supabase Schema Activation Steps
              </h4>
              <p className="text-slate-600 text-[11px]">
                To activate cloud PostgreSQL tables (centres, attendance, inspections, alerts, actions):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>
                  Open{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 font-semibold underline"
                  >
                    Supabase Dashboard
                  </a>{' '}
                  and select your project.
                </li>
                <li>
                  Click <strong>SQL Editor</strong> &rarr; <strong>New Query</strong>.
                </li>
                <li>
                  Click the <strong>"Copy schema.sql"</strong> button above, paste into the editor, and click <strong>Run</strong>.
                </li>
                <li>
                  In <strong>Storage</strong>, create a public bucket named <code className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">evidence</code>.
                </li>
                <li>
                  Click the refresh icon above to verify active PostgreSQL tables.
                </li>
              </ol>
            </div>

            {/* Column 2: Transparent Dataset & Zero-Data Controls */}
            <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Transparent Data Mode Controls
              </h4>
              <p className="text-slate-600 text-[11px]">
                Currently loaded in local store:{' '}
                <strong className="text-slate-900 font-mono">{centreCount} Training Centre(s)</strong>.
                SkillWatch AI strictly complies with the zero fake data policy.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  onClick={handleSeedBenchmark}
                  className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Load Verified Starter Benchmark (4 Centres)
                </button>

                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  Reset to Clean Zero State (0 Records)
                </button>
              </div>

              <p className="text-[10px] text-slate-400">
                You can also register centres and audit manually via the standard application forms.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
