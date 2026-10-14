import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { AttendanceRecord } from '../../types';
import { Link } from 'react-router-dom';
import { QrCode, BarChart3 } from 'lucide-react';

interface AttendanceChartProps {
  records: AttendanceRecord[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ records }) => {
  // Compute genuine daily attendance counts over the past 7 days from actual records
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  // Create buckets for the past 7 days
  const past7DaysData = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - index));
    const dayName = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    // Filter actual database records for this day
    const dayRecords = records.filter(r => r.checked_in_at.startsWith(dateStr));
    const verifiedCount = dayRecords.filter(r => r.verification_status === 'verified').length;

    return {
      day: index === 6 ? 'Today' : dayName,
      date: dateStr,
      verifiedCount,
      // Target reference threshold
      targetCount: 20,
    };
  });

  const totalVerifiedInPeriod = records.length;

  return (
    <Card className="border-slate-200 shadow-sm flex flex-col justify-between">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Attendance Telemetry (Past 7 Days)</span>
          </div>
        }
        subtitle="Genuine daily check-in volume recorded in PostgreSQL"
      />
      <CardContent>
        {totalVerifiedInPeriod === 0 ? (
          <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <QrCode className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-700">No Attendance Records Yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                Attendance telemetry appears here once trainees check in via QR code or session token.
              </p>
            </div>
            <Link
              to="/check-in"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg"
            >
              Open Trainee Check-In Portal
            </Link>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={past7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1528',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} verified`, 'Attendance Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="verifiedCount"
                  stroke="#1D4ED8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
