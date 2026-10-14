import React from 'react';
import { Centre } from '../../types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Users, CheckCircle2, AlertCircle } from 'lucide-react';

interface CentresTableProps {
  centres: Centre[];
  isLoading?: boolean;
}

export const CentresTable: React.FC<CentresTableProps> = ({ centres, isLoading }) => {
  return (
    <Card>
      <CardHeader
        title="Monitored Training Centres"
        subtitle="Operational status and capacity across authorized districts"
        action={
          <Link
            to="/centres"
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            View All Centres <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3">Centre Name & Code</th>
              <th className="px-5 py-3">District / State</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Trainees Enrolled</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  Loading centres data...
                </td>
              </tr>
            ) : centres.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="font-semibold text-xs text-slate-700">No Training Centres Registered</p>
                    <p className="text-[11px] text-slate-400">Accredited PMKVY facilities will appear here once added to the database.</p>
                    <Link
                      to="/centres"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg mt-1"
                    >
                      Manage Centres Directory
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              centres.slice(0, 5).map(centre => {
                const isOp = centre.status === 'operational';
                return (
                  <tr key={centre.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <div>
                        <Link
                          to={`/centres/${centre.id}`}
                          className="hover:text-blue-700 hover:underline font-semibold"
                        >
                          {centre.name}
                        </Link>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{centre.code}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {centre.district}, {centre.state}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={isOp ? 'teal' : 'amber'} size="sm">
                        {isOp ? (
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                        )}
                        <span className="capitalize">{centre.status.replace('_', ' ')}</span>
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-900">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <Users className="w-3 h-3 text-slate-400" />
                        {centre.enrolled_trainees}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/centres/${centre.id}`}
                        className="text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-0.5"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

