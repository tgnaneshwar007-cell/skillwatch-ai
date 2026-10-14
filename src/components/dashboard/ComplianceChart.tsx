import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Inspection } from '../../types';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ShieldCheck } from 'lucide-react';

interface ComplianceChartProps {
  inspections: Inspection[];
}

export const ComplianceChart: React.FC<ComplianceChartProps> = ({ inspections }) => {
  // Extract all inspection items across all completed inspections
  const allItems = inspections.flatMap(i => i.items || []);

  const categories = [
    'Classroom & Infrastructure',
    'Biometrics & IT Lab',
    'Training Equipment & Labs',
    'Fire Safety & Emergency Exits',
    'Sanitation & Drinking Water',
    'Accessibility (PwD)',
    'Power Backup & Electrical Safety',
    'Domain Safety & PPE',
  ];

  // Calculate real compliant rate per category
  const dynamicComplianceData = categories.map(cat => {
    const matchingItems = allItems.filter(item =>
      item.category.toLowerCase().includes(cat.toLowerCase().split(' ')[0])
    );

    const assessedItems = matchingItems.filter(i => i.status !== 'not_inspected');
    const compliantItems = assessedItems.filter(i => i.status === 'compliant');

    const score =
      assessedItems.length > 0
        ? Math.round((compliantItems.length / assessedItems.length) * 100)
        : null;

    // Short name for X-axis readability
    const shortName = cat.split(' ')[0].replace('&', '');

    return {
      category: shortName,
      fullName: cat,
      score: score !== null ? score : 0,
      assessedCount: assessedItems.length,
      isAssessed: score !== null,
    };
  });

  const totalAssessedItems = allItems.filter(i => i.status !== 'not_inspected').length;

  return (
    <Card className="border-slate-200 shadow-sm flex flex-col justify-between">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Infrastructure Compliance Breakdown</span>
          </div>
        }
        subtitle="Audited compliance percentage calculated from physical checklist items"
      />
      <CardContent>
        {totalAssessedItems === 0 ? (
          <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <ClipboardCheck className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-700">No Audit Inspections Yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                Compliance scores will compute automatically once a field inspector conducts an audit.
              </p>
            </div>
            <Link
              to="/inspections/new"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg"
            >
              Start New Physical Audit
            </Link>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicComplianceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1528',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, _: any, props: any) => [
                    props?.payload?.isAssessed ? `${value}%` : 'Not Assessed',
                    props?.payload?.fullName,
                  ]}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {dynamicComplianceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        !entry.isAssessed
                          ? '#94A3B8'
                          : entry.score >= 80
                          ? '#0D9488'
                          : entry.score >= 60
                          ? '#D97706'
                          : '#DC2626'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
