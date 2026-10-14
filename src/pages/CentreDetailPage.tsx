import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Users,
  BookOpen,
  QrCode,
  ClipboardPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { fetchCentreById } from '../services/centres';
import { fetchAttendanceSessions } from '../services/attendance';
import { fetchInspections } from '../services/inspections';
import { fetchAlerts } from '../services/alerts';
import { Centre, AttendanceSession, Inspection, Alert } from '../types';

export const CentreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [centre, setCentre] = useState<Centre | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      const [c, allSessions, allInspections, allAlerts] = await Promise.all([
        fetchCentreById(id),
        fetchAttendanceSessions(),
        fetchInspections(),
        fetchAlerts(),
      ]);
      setCentre(c);
      setSessions(allSessions.filter(s => s.centre_id === id));
      setInspections(allInspections.filter(i => i.centre_id === id));
      setAlerts(allAlerts.filter(a => a.centre_id === id));
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading centre dossier...</div>;
  }

  if (!centre) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-800">Training Centre Not Found</p>
        <Link to="/centres" className="text-xs text-blue-700 hover:underline mt-2 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  const isOp = centre.status === 'operational';

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ label: 'Training Centres', to: '/centres' }, { label: centre.name }]}
        title={centre.name}
        subtitle={`${centre.code} • ${centre.district}, ${centre.state}`}
        action={
          <div className="flex items-center gap-2">
            <Link to={`/attendance-sessions?centre=${centre.id}`}>
              <Button variant="primary" size="sm" icon={<QrCode className="w-3.5 h-3.5" />}>
                Create QR Session
              </Button>
            </Link>
            <Link to={`/inspections/new?centre=${centre.id}`}>
              <Button variant="teal" size="sm" icon={<ClipboardPlus className="w-3.5 h-3.5" />}>
                Audit Centre
              </Button>
            </Link>
          </div>
        }
      />

      {/* Overview Dossier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact & Location */}
        <Card className="p-5 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Facility Profile & Accreditation
          </h3>
          <div className="space-y-2 text-xs text-slate-700">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{centre.address}</span>
            </p>
            <p className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                SPOC / Manager: <strong className="text-slate-900">{centre.contact_person}</strong>
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{centre.contact_email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{centre.contact_phone}</span>
            </p>
          </div>
        </Card>

        {/* Capacity & Operational Status */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Monitoring Status
            </h3>
            <Badge variant={isOp ? 'teal' : 'amber'} size="md" className="mb-3">
              {isOp ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span className="capitalize">{centre.status.replace('_', ' ')}</span>
            </Badge>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p>
                Enrolled Trainees: <strong className="text-slate-900">{centre.enrolled_trainees}</strong>
              </p>
              <p>
                Active Trades: <strong className="text-slate-900">{centre.active_courses} Courses</strong>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Centre Activity Tabs/Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance Sessions */}
        <Card>
          <CardHeader
            title="Attendance Sessions"
            subtitle="Recent batches and active QR check-in gates"
          />
          <div className="divide-y divide-slate-100">
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active attendance sessions created yet for this centre.
              </div>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{s.batch_name}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Code: {s.session_token}
                    </p>
                  </div>
                  <Badge variant={s.status === 'active' ? 'teal' : 'slate'} size="sm">
                    {s.status === 'active' ? 'Live' : 'Closed'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Inspection History */}
        <Card>
          <CardHeader
            title="Field Audit Inspections"
            subtitle="Infrastructure compliance history and inspector ratings"
          />
          <div className="divide-y divide-slate-100">
            {inspections.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No inspections recorded for this centre yet.
              </div>
            ) : (
              inspections.map(i => (
                <div key={i.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">Auditor: {i.inspector_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(i.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      i.overall_compliance_percentage && i.overall_compliance_percentage >= 80
                        ? 'teal'
                        : 'amber'
                    }
                    size="sm"
                  >
                    {i.overall_compliance_percentage !== null
                      ? `${i.overall_compliance_percentage}% Score`
                      : 'Pending'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Active Alerts for this Centre */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader
            title="Open Irregularities & Compliance Notices"
            subtitle="Automated rule flags specific to this training facility"
          />
          <div className="divide-y divide-slate-100">
            {alerts.map(a => (
              <div key={a.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.severity === 'critical' ? 'red' : 'amber'} size="sm">
                      <span className="uppercase font-bold">{a.severity}</span>
                    </Badge>
                    <span className="font-semibold text-slate-900">{a.title}</span>
                  </div>
                  <p className="text-slate-600">{a.explanation}</p>
                </div>
                <Link to="/alerts">
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

