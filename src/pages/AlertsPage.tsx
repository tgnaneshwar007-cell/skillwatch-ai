import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAlerts, updateAlertStatus } from '../services/alerts';
import { createCorrectiveAction } from '../services/actions';
import { Alert, AlertSeverity, AlertStatus } from '../types';
import { formatTimeAgo } from '../lib/calculations';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  ArrowRight,
  Send,
  UserCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AlertStatus>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Corrective Action Modal State
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [actionDescription, setActionDescription] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [assignedToEmail, setAssignedToEmail] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledge = async (alert: Alert) => {
    try {
      await updateAlertStatus(alert.id, 'acknowledged', user?.full_name || 'District Officer');
      showToast('info', 'Alert Acknowledged', `Notice logged under ${user?.full_name}`);
      await loadAlerts();
    } catch (e: any) {
      showToast('error', 'Update Failed', e.message);
    }
  };

  const handleOpenActionModal = (alert: Alert) => {
    setSelectedAlertForAction(alert);
    setActionDescription(`Remediate ${alert.title}: ${alert.recommended_step}`);
    setAssignedToName('Vikramaditya Meena (Centre Manager)');
    setAssignedToEmail('manager@skillindia.org');
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertForAction) return;

    try {
      setIsSubmittingAction(true);
      await createCorrectiveAction(
        {
          alert_id: selectedAlertForAction.id,
          centre_id: selectedAlertForAction.centre_id,
          centre_name: selectedAlertForAction.centre_name,
          description: actionDescription,
          assigned_to_name: assignedToName,
          assigned_to_email: assignedToEmail,
          due_date: dueDate,
        },
        user?.full_name || 'District Officer'
      );

      showToast(
        'success',
        'Corrective Action Assigned',
        `Remediation notice dispatched to ${assignedToName}`
      );
      setSelectedAlertForAction(null);
      await loadAlerts();
    } catch (err: any) {
      showToast('error', 'Action Assignment Failed', err.message);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Rule-Based Alerts & Irregularity Detection"
        subtitle="Transparent automated triggers flagging attendance deficits and infrastructure non-compliance"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        }
      />

      {/* Methodology Banner */}
      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-blue-950">Deterministic Rule Engine Transparency</p>
          <p className="text-blue-800 leading-relaxed">
            All irregularities are evaluated against explicit, transparent MSDE rules: attendance
            falling below the 70% threshold, duplicate check-ins, expired QR gates, and
            non-compliant physical inspection criteria. No black-box guesses or opaque scores.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-medium text-slate-600">Status:</span>
          {(['ALL', 'open', 'acknowledged', 'in_progress', 'resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-slate-600">Severity:</span>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as any)}
            className="text-xs rounded-md border border-slate-300 py-1 px-2.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center text-xs text-slate-400">Loading alerts data...</Card>
        ) : filteredAlerts.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            No compliance alerts found for the selected filters.
          </Card>
        ) : (
          filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            const isResolved = alert.status === 'resolved';

            const severityBadgeMap = {
              critical: 'red',
              high: 'amber',
              medium: 'blue',
              low: 'slate',
            } as const;

            return (
              <Card
                key={alert.id}
                className={`p-5 transition-all ${
                  isCritical && !isResolved
                    ? 'border-red-300 bg-red-50/15'
                    : isResolved
                    ? 'border-slate-200 opacity-75'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Alert Information */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={severityBadgeMap[alert.severity]} size="sm">
                        {isCritical && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        <span className="uppercase font-bold text-[10px]">{alert.severity}</span>
                      </Badge>
                      <h3 className="font-bold text-sm text-slate-900">{alert.title}</h3>
                      <Badge
                        variant={
                          alert.status === 'resolved'
                            ? 'teal'
                            : alert.status === 'in_progress'
                            ? 'amber'
                            : 'slate'
                        }
                        size="sm"
                      >
                        <span className="capitalize">{alert.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="font-semibold text-slate-800">{alert.centre_name}</span>
                      <span>•</span>
                      <span>District: {alert.district}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(alert.created_at)}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {alert.rule_code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-lg border border-slate-200/60">
                      <strong className="text-slate-900 block mb-0.5">Rule Explanation:</strong>
                      {alert.explanation}
                    </p>

                    <div className="text-xs text-blue-900 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200/80">
                      <strong>Recommended Officer Action: </strong>
                      {alert.recommended_step}
                    </div>

                    {alert.acknowledged_by && (
                      <p className="text-[11px] text-slate-400">
                        Acknowledged by <strong>{alert.acknowledged_by}</strong> on{' '}
                        {new Date(alert.acknowledged_at || alert.created_at).toLocaleDateString(
                          'en-IN'
                        )}
                      </p>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                    {alert.status === 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Acknowledge
                      </Button>
                    )}

                    {alert.status !== 'resolved' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenActionModal(alert)}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Assign Action
                      </Button>
                    )}

                    {alert.status === 'in_progress' && (
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={async () => {
                          await updateAlertStatus(alert.id, 'resolved', user?.full_name || 'Officer');
                          showToast('success', 'Alert Resolved', 'Status updated to resolved.');
                          await loadAlerts();
                        }}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Corrective Action Assignment Modal */}
      <Modal
        isOpen={Boolean(selectedAlertForAction)}
        onClose={() => setSelectedAlertForAction(null)}
        title="Assign Corrective Action Notice"
        description={`Centre: ${selectedAlertForAction?.centre_name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Remediation Description
            </label>
            <textarea
              required
              rows={3}
              value={actionDescription}
              onChange={e => setActionDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Responsible Official
              </label>
              <input
                type="text"
                required
                value={assignedToName}
                onChange={e => setAssignedToName(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                required
                value={assignedToEmail}
                onChange={e => setAssignedToEmail(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remediation SLA Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedAlertForAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingAction}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Dispatch Corrective Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
