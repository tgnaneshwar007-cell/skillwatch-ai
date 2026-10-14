import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { fetchCentres } from '../services/centres';
import { fetchInspections } from '../services/inspections';
import { fetchAttendanceRecords } from '../services/attendance';
import { fetchAlerts } from '../services/alerts';
import { Centre, Inspection, AttendanceRecord, Alert } from '../types';
import { Printer, Download, FileText, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [c, i, r, a] = await Promise.all([
        fetchCentres(),
        fetchInspections(),
        fetchAttendanceRecords(),
        fetchAlerts(),
      ]);
      setCentres(c);
      setInspections(i);
      setRecords(r);
      setAlerts(a);
      setIsLoading(false);
    }
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Official Compliance & Telemetry Reports"
        subtitle="Ministry of Skill Development & Entrepreneurship Consolidated Audit Summary"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Save PDF
            </Button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Total Centres</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{centres.length}</p>
          <p className="text-[10px] text-teal-600 mt-0.5">100% Accredited</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Audits Completed</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{inspections.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">8-Dimension Physical</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Attendance Logged</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{records.length}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">Verified Biometric/QR</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Resolved Defects</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {alerts.filter(a => a.status === 'resolved').length}
          </p>
          <p className="text-[10px] text-teal-600 mt-0.5">SLA Remediated</p>
        </Card>
      </div>

      {/* Centre Performance Summary Table */}
      <Card>
        <CardHeader
          title="Facility-Level Compliance Summary"
          subtitle="Consolidated accreditation scores and incident histories"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Centre & Code</th>
                <th className="px-5 py-3">District</th>
                <th className="px-5 py-3 text-center">Enrolled</th>
                <th className="px-5 py-3 text-center">Latest Audit Score</th>
                <th className="px-5 py-3 text-center">Open Anomalies</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Loading facility reports...
                  </td>
                </tr>
              ) : centres.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No facilities registered in database. Reports will populate once facilities and audits are recorded.
                  </td>
                </tr>
              ) : (
                centres.map(centre => {
                const centreInspections = inspections.filter(i => i.centre_id === centre.id);
                const latestInsp = centreInspections[0];
                const score = latestInsp?.overall_compliance_percentage;
                const openCount = alerts.filter(
                  a => a.centre_id === centre.id && (a.status === 'open' || a.status === 'in_progress')
                ).length;

                return (
                  <tr key={centre.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{centre.name}</p>
                      <p className="font-mono text-[11px] text-slate-500">{centre.code}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{centre.district}</td>
                    <td className="px-5 py-3.5 text-center font-medium">
                      {centre.enrolled_trainees}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold">
                      {score !== undefined && score !== null ? (
                        <span className={score >= 80 ? 'text-teal-700' : 'text-amber-600'}>
                          {score}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Pending Audit</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {openCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          {openCount}
                        </span>
                      ) : (
                        <span className="text-teal-700 font-medium flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 0
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge variant={centre.status === 'operational' ? 'teal' : 'amber'} size="sm">
                        <span className="capitalize">{centre.status.replace('_', ' ')}</span>
                      </Badge>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

