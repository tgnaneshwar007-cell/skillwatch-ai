import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { QRGeneratorModal } from '../components/attendance/QRGeneratorModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  createAttendanceSession,
  fetchAttendanceSessions,
} from '../services/attendance';
import { fetchCentres } from '../services/centres';
import { AttendanceSession, Centre } from '../types';
import {
  QrCode,
  Plus,
  Clock,
  Building2,
  Users,
  Eye,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedCentre = searchParams.get('centre');

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [batchName, setBatchName] = useState('Solar PV Installer — Batch S-04');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Selected session for QR modal
  const [activeModalSession, setActiveModalSession] = useState<AttendanceSession | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSessions, fetchedCentres] = await Promise.all([
        fetchAttendanceSessions(),
        fetchCentres(),
      ]);
      setSessions(fetchedSessions);
      setCentres(fetchedCentres);

      if (fetchedCentres.length > 0 && !selectedCentreId) {
        if (preselectedCentre) {
          setSelectedCentreId(preselectedCentre);
        } else if (user?.assigned_centre_id) {
          setSelectedCentreId(user.assigned_centre_id);
        } else {
          setSelectedCentreId(fetchedCentres[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to load sessions data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preselectedCentre]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentreId) {
      showToast('warning', 'Please select a training centre');
      return;
    }
    if (!batchName.trim()) {
      showToast('warning', 'Please specify the course or batch name');
      return;
    }

    try {
      setIsSubmitting(true);
      const newSession = await createAttendanceSession({
        centre_id: selectedCentreId,
        batch_name: batchName.trim(),
        durationMinutes,
        created_by_name: user?.full_name || 'Centre Manager',
      });

      showToast('success', 'Attendance Session Created', `Token: ${newSession.session_token}`);
      setActiveModalSession(newSession);
      await loadData();
    } catch (err: any) {
      showToast('error', 'Session Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="QR Attendance Session Management"
        subtitle="Generate time-bound dynamic QR check-in gates for trainee cohorts"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh Sessions
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Creator Form */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Create New Attendance Gate"
            subtitle="Authorizes biometric / QR attendance check-in"
          />
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Training Centre
                </label>
                <select
                  value={selectedCentreId}
                  onChange={e => setSelectedCentreId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {centres.length === 0 ? (
                    <option value="">No registered centres found in database</option>
                  ) : (
                    centres.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district})
                      </option>
                    ))
                  )}
                </select>
                {centres.length === 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-1.5">
                    No facilities registered yet.{' '}
                    <a href="/centres" className="underline font-semibold text-blue-700">
                      Register a Centre
                    </a>{' '}
                    to generate attendance sessions.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course & Batch Name
                </label>
                <input
                  type="text"
                  required
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  placeholder="e.g. CNC Machine Operator — Batch 03"
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Expiration Time
                </label>
                <select
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value={15}>15 Minutes (Strict biometric gate)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour (Standard class)</option>
                  <option value={120}>2 Hours (Practical workshop)</option>
                  <option value={240}>4 Hours (Full-day training)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Protects against unauthorized delayed scans outside designated hours.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isSubmitting}
                icon={<QrCode className="w-4 h-4" />}
              >
                Generate QR Gate & Token
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active & Historical Sessions List */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Attendance Sessions Telemetry"
            subtitle="Live status, attendee counts, and QR projection controls"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Centre & Batch</th>
                  <th className="px-5 py-3">Session Token</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Attendees</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Loading attendance sessions...
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      No attendance sessions active. Create one using the form.
                    </td>
                  </tr>
                ) : (
                  sessions.map(ses => {
                    const isActive = ses.status === 'active';
                    return (
                      <tr key={ses.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{ses.batch_name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{ses.centre_name}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {ses.session_token}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={isActive ? 'teal' : 'slate'} size="sm">
                            {isActive ? <Clock className="w-3 h-3 text-teal-600" /> : null}
                            <span className="capitalize">{ses.status}</span>
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-900">
                          {ses.attendee_count}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveModalSession(ses)}
                            icon={<QrCode className="w-3.5 h-3.5" />}
                          >
                            View QR
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* QR Generator Modal */}
      <QRGeneratorModal
        session={activeModalSession}
        isOpen={Boolean(activeModalSession)}
        onClose={() => setActiveModalSession(null)}
      />
    </div>
  );
};

