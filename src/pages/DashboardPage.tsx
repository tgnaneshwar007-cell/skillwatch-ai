import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { StatCard } from '../components/dashboard/StatCard';
import { AttendanceChart } from '../components/dashboard/AttendanceChart';
import { ComplianceChart } from '../components/dashboard/ComplianceChart';
import { CentresTable } from '../components/dashboard/CentresTable';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import { ThreeCommandSphere } from '../components/dashboard/ThreeCommandSphere';
import { AIVisionScanner } from '../components/ai/AIVisionScanner';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ClipboardPlus,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  Database,
} from 'lucide-react';
import { fetchCentres } from '../services/centres';
import { fetchAlerts } from '../services/alerts';
import { fetchInspections } from '../services/inspections';
import { fetchAttendanceRecords, fetchAttendanceSessions } from '../services/attendance';
import { Centre, Alert, Inspection, AttendanceRecord, AttendanceSession } from '../types';

export const DashboardPage: React.FC = () => {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAIVisionTab, setShowAIVisionTab] = useState<boolean>(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [fetchedCentres, fetchedAlerts, fetchedInspections, fetchedAttendance, fetchedSessions] =
        await Promise.all([
          fetchCentres(),
          fetchAlerts(),
          fetchInspections(),
          fetchAttendanceRecords(),
          fetchAttendanceSessions(),
        ]);

      setCentres(fetchedCentres);
      setAlerts(fetchedAlerts);
      setInspections(fetchedInspections);
      setAttendanceRecords(fetchedAttendance);
      setSessions(fetchedSessions);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // --- Dynamic calculations strictly from actual database records ---
  const totalCentres = centres.length;
  const operationalCentres = centres.filter(c => c.status === 'operational').length;
  const openAlerts = alerts.filter(a => a.status === 'open' || a.status === 'in_progress');
  const criticalAlerts = openAlerts.filter(a => a.severity === 'critical').length;

  // Filter today's attendance records
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.checked_in_at.startsWith(todayStr));
  const todayVerifiedCount = todayRecords.filter(r => r.verification_status === 'verified').length;

  // Active batches today to calculate rate accurately
  const activeBatchesToday = sessions.filter(s => s.status === 'active');
  const expectedAttendees = activeBatchesToday.length > 0 ? activeBatchesToday.length * 30 : 0;
  const dynamicAttendanceRate =
    expectedAttendees > 0
      ? Math.min(100, Math.round((todayVerifiedCount / expectedAttendees) * 100))
      : null;

  // Real compliance calculation from completed physical inspections
  const validInspections = inspections.filter(i => i.overall_compliance_percentage !== null);
  const avgComplianceScore =
    validInspections.length > 0
      ? Math.round(
          validInspections.reduce((acc, i) => acc + (i.overall_compliance_percentage || 0), 0) /
            validInspections.length
        )
      : null;

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="National AI Monitoring Console"
        subtitle="Real-time attendance telemetry, 8-dimension infrastructure audits, and real computer vision detection"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant={showAIVisionTab ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowAIVisionTab(!showAIVisionTab)}
              icon={<Cpu className="w-3.5 h-3.5 text-cyan-300" />}
            >
              {showAIVisionTab ? 'Hide AI Vision' : 'AI Vision Inspector'}
            </Button>
            <Link to="/attendance-sessions">
              <Button variant="outline" size="sm" icon={<QrCode className="w-3.5 h-3.5" />}>
                New QR Session
              </Button>
            </Link>
            <Link to="/inspections/new">
              <Button variant="teal" size="sm" icon={<ClipboardPlus className="w-3.5 h-3.5" />}>
                Start Physical Audit
              </Button>
            </Link>
          </div>
        }
      />

      {/* 3D Geospatial Holographic Telemetry Sphere */}
      <ThreeCommandSphere centres={centres} />

      {/* Real Computer Vision AI Inspection Section */}
      {showAIVisionTab && (
        <AIVisionScanner
          centreId={centres[0]?.id || 'tc-unassigned'}
          centreName={centres[0]?.name || 'Standard Training Facility'}
          expectedAttendance={24}
          onAlertTriggered={async (title, explanation) => {
            await loadDashboardData();
          }}
        />
      )}

      {/* Genuine Database Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Centres"
          value={totalCentres}
          subtitle={
            totalCentres > 0
              ? `${operationalCentres} of ${totalCentres} operational`
              : 'No facilities registered in database'
          }
          icon={<Building2 className="w-5 h-5" />}
          color="navy"
          trend={{
            value: totalCentres > 0 ? `${operationalCentres} Active` : '0 Active',
            isPositive: operationalCentres > 0,
          }}
        />

        <StatCard
          title="Today's Attendance Rate"
          value={
            dynamicAttendanceRate !== null
              ? `${dynamicAttendanceRate}%`
              : todayVerifiedCount > 0
              ? `${todayVerifiedCount} verified`
              : 'No data today'
          }
          subtitle={`${todayVerifiedCount} verified check-ins today (${attendanceRecords.length} total)`}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          trend={{
            value: dynamicAttendanceRate !== null ? (dynamicAttendanceRate >= 70 ? 'Compliant' : 'Deficit') : 'Calculated live',
            isPositive: (dynamicAttendanceRate || 0) >= 70,
            isNeutral: dynamicAttendanceRate === null,
          }}
        />

        <StatCard
          title="Avg Infrastructure Score"
          value={avgComplianceScore !== null ? `${avgComplianceScore}%` : 'Not assessed'}
          subtitle={
            validInspections.length > 0
              ? `Calculated from ${validInspections.length} physical audits`
              : 'No completed audits on record'
          }
          icon={<ShieldCheck className="w-5 h-5" />}
          color="teal"
          trend={{
            value: avgComplianceScore !== null ? (avgComplianceScore >= 80 ? 'Grade A' : 'Review Needed') : 'Pending Audit',
            isPositive: (avgComplianceScore || 0) >= 80,
            isNeutral: avgComplianceScore === null,
          }}
        />

        <StatCard
          title="Active Rule Alerts"
          value={openAlerts.length}
          subtitle={
            openAlerts.length > 0
              ? `${criticalAlerts} critical, ${openAlerts.length - criticalAlerts} standard`
              : 'Zero active anomalies flagged'
          }
          icon={<AlertTriangle className="w-5 h-5" />}
          color={criticalAlerts > 0 ? 'red' : openAlerts.length > 0 ? 'amber' : 'teal'}
          trend={{
            value: criticalAlerts > 0 ? `${criticalAlerts} Critical` : openAlerts.length > 0 ? 'Action required' : 'All clear',
            isPositive: openAlerts.length === 0,
          }}
        />
      </div>

      {/* Dynamic Telemetry Charts from Database Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart records={attendanceRecords} />
        <ComplianceChart inspections={inspections} />
      </div>

      {/* Recent Alerts Feed & Centres Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlerts alerts={openAlerts} isLoading={isLoading} />
        <CentresTable centres={centres} isLoading={isLoading} />
      </div>
    </div>
  );
};
