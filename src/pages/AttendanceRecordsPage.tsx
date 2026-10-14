import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ClipboardCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Keyboard,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { fetchAttendanceRecords } from '../services/attendance';
import { fetchCentres } from '../services/centres';
import { AttendanceRecord, Centre } from '../types';

export const AttendanceRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRecords, fetchedCentres] = await Promise.all([
        fetchAttendanceRecords(),
        fetchCentres(),
      ]);
      setRecords(fetchedRecords);
      setCentres(fetchedCentres);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r.trainee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.trainee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.batch_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCentre = selectedCentre === 'ALL' || r.centre_id === selectedCentre;
    return matchesSearch && matchesCentre;
  });

  const exportCSV = () => {
    const headers = ['Record ID,Trainee ID,Trainee Name,Batch,Method,Status,Timestamp'];
    const rows = filteredRecords.map(r =>
      `"${r.id}","${r.trainee_id}","${r.trainee_name}","${r.batch_name}","${r.verification_method}","${r.verification_status}","${r.checked_in_at}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `skillwatch_attendance_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Attendance Telemetry Records"
        subtitle="Individual verified check-in audit trails with timestamp verification"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search trainee name, Skill ID, or batch..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedCentre}
            onChange={e => setSelectedCentre(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Training Centres</option>
            {centres.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader
          title={`Verified Records (${filteredRecords.length})`}
          subtitle="Real-time capture via QR camera scanner or authenticated manual tokens"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Trainee Identity</th>
                <th className="px-5 py-3">Batch & Course</th>
                <th className="px-5 py-3">Verification Method</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Timestamp (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{r.trainee_name}</p>
                      <p className="font-mono text-[11px] text-slate-500 mt-0.5">{r.trainee_id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{r.batch_name}</p>
                      {r.notes && <p className="text-[11px] text-slate-400 italic">{r.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {r.verification_method === 'qr_scan' ? (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-blue-600" /> QR Camera Scan
                          </>
                        ) : (
                          <>
                            <Keyboard className="w-3.5 h-3.5 text-slate-600" /> Manual Token
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="teal" size="sm">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" /> Verified
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                      <div>
                        {new Date(r.checked_in_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.checked_in_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

