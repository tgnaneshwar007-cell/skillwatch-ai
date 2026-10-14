import React from 'react';
import { Alert } from '../../types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatTimeAgo } from '../../lib/calculations';

interface RecentAlertsProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export const RecentAlerts: React.FC<RecentAlertsProps> = ({ alerts, isLoading }) => {
  return (
    <Card>
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Rule-Based Alerts & Irregularities</span>
          </div>
        }
        subtitle="Automated anomaly flags requiring district officer review"
        action={
          <Link
            to="/alerts"
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            Review All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      />
      <div className="divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-teal-500" />
            <p className="font-semibold text-slate-700">Zero Active Compliance Anomalies</p>
            <p className="text-[11px] text-slate-400">All monitored centres are operating within MSDE threshold standards.</p>
          </div>
        ) : (
          alerts.slice(0, 4).map(alert => {
            const severityColors = {
              critical: 'red',
              high: 'amber',
              medium: 'blue',
              low: 'slate',
            } as const;

            const isCritical = alert.severity === 'critical';

            return (
              <div key={alert.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={severityColors[alert.severity]} size="sm">
                        {isCritical && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        <span className="uppercase font-bold text-[10px]">{alert.severity}</span>
                      </Badge>
                      <span className="text-xs font-semibold text-slate-900">{alert.title}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{alert.explanation}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="font-medium text-slate-600">{alert.centre_name}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(alert.created_at)}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400">{alert.rule_code}</span>
                    </div>
                  </div>

                  <Link
                    to="/alerts"
                    className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Take Action
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

