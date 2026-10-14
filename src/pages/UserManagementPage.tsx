import React from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { DEMO_PROFILES } from '../lib/mockData';
import { UserRole } from '../types';
import {
  ShieldCheck,
  Users,
  Lock,
  Building2,
  MapPin,
  CheckCircle2,
  KeyRound,
  FileCode,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user, role, switchDemoRole, isDemoMode } = useAuth();

  const roleLabels: Record<UserRole, string> = {
    national_admin: 'National Administrator',
    district_officer: 'District Officer',
    centre_manager: 'Training Centre Manager',
    field_inspector: 'Field Inspector',
  };

  const roleDescriptions: Record<UserRole, string> = {
    national_admin:
      'Full country-level read/write access. Can accredit centres, modify global policy rules, and review all district operations.',
    district_officer:
      'Authorized over specific district jurisdiction. Acknowledges alerts, issues corrective action notices, and audits compliance.',
    centre_manager:
      'Authorized for assigned training centre. Generates time-bound QR check-in gates, manages batches, and submits defect resolutions.',
    field_inspector:
      'Authorized for on-site physical audits. Completes 8-dimension MSDE checklists and captures photo evidence with tamper verification.',
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Access Control & Role Permissions"
        subtitle="Role-Based Access Control (RBAC) enforced via Supabase Row Level Security (RLS)"
      />

      {/* Security Architecture Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <h3 className="font-bold text-sm text-blue-950">
              Trusted Server-Side Role Enforcement (Section 7 Compliance)
            </h3>
            <p className="leading-relaxed">
              SkillWatch AI enforces permissions strictly at the database layer via PostgreSQL Row
              Level Security (RLS) policies and security-definer functions. Role attributes cannot be
              tampered with by client-side browser requests.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Profile Roster */}
      <Card>
        <CardHeader
          title="Authorized Personnel Directory"
          subtitle="Profiles provisioned in the MSDE secure identity repository"
        />
        <div className="divide-y divide-slate-100">
          {DEMO_PROFILES.map(profile => {
            const isCurrentUser = user?.email === profile.email;

            return (
              <div
                key={profile.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isCurrentUser ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{profile.full_name}</span>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        Current Active Session
                      </span>
                    )}
                    <Badge variant="navy" size="sm">
                      {roleLabels[profile.role]}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 font-mono">{profile.email}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Jurisdiction:{' '}
                      <strong className="text-slate-800">
                        {profile.assigned_district || 'National'}
                      </strong>
                    </span>
                    {profile.assigned_centre_id && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        Assigned Centre: <strong className="text-slate-800">PMKK Jaipur</strong>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 pt-1">
                    {roleDescriptions[profile.role]}
                  </p>
                </div>

                {isDemoMode && !isCurrentUser && (
                  <div className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchDemoRole(profile.role)}
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                    >
                      Switch to this Role
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* RLS Policy Summary Card */}
      <Card>
        <CardHeader
          title="Active PostgreSQL Security Policies"
          subtitle="Defined in supabase/schema.sql"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-800 mb-1">Centres & Directory Table</p>
              <p className="text-slate-600">
                • Read: Open to all authenticated officials<br />
                • Write/Delete: Restricted to <code className="text-blue-700">national_admin</code>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-800 mb-1">Attendance Sessions & Check-In</p>
              <p className="text-slate-600">
                • Insert Sessions: Restricted to <code className="text-blue-700">centre_manager</code> & admin<br />
                • Check-in Validation: Trusted <code className="text-blue-700">check_in_trainee</code> stored proc
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-800 mb-1">Physical Inspections & Checklist</p>
              <p className="text-slate-600">
                • Insert/Update: Restricted to <code className="text-blue-700">field_inspector</code> & admin<br />
                • Evidence photos: Protected in <code className="text-blue-700">evidence</code> storage bucket
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-800 mb-1">Alerts & Corrective Actions</p>
              <p className="text-slate-600">
                • Status Changes: Restricted to <code className="text-blue-700">district_officer</code> & admin<br />
                • Auto-creation: Triggered by <code className="text-blue-700">trg_inspection_item_alert</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

