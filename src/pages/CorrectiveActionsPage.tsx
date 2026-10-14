import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchCorrectiveActions, resolveCorrectiveAction } from '../services/actions';
import { CorrectiveAction, CorrectiveActionStatus } from '../types';
import {
  CheckSquare,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Send,
  Building2,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

export const CorrectiveActionsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Resolution Modal State
  const [selectedActionForResolution, setSelectedActionForResolution] =
    useState<CorrectiveAction | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const loadActions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCorrectiveActions();
      setActions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleOpenResolutionModal = (action: CorrectiveAction) => {
    setSelectedActionForResolution(action);
    setResolutionNotes(
      action.resolution_notes ||
        'Defect rectified on-site. Verified replacement installed and compliance restored.'
    );
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActionForResolution) return;

    try {
      setIsResolving(true);
      await resolveCorrectiveAction(
        selectedActionForResolution.id,
        resolutionNotes,
        user?.full_name || 'District Officer'
      );

      showToast(
        'success',
        'Action Marked Completed',
        'Resolution documented and linked alert closed.'
      );
      setSelectedActionForResolution(null);
      await loadActions();
    } catch (err: any) {
      showToast('error', 'Resolution Failed', err.message);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Corrective Action Plans & SLA Tracking"
        subtitle="Enforce remediation deadlines for infrastructure and attendance deficiencies"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={loadActions}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-xs text-slate-400">Loading corrective actions...</Card>
        ) : actions.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            No active corrective action plans on record. All facilities compliant.
          </Card>
        ) : (
          actions.map(action => {
            const isCompleted = action.status === 'completed';
            const isOverdue =
              !isCompleted && new Date(action.due_date).getTime() < Date.now();

            return (
              <Card key={action.id} className="p-5 hover:border-slate-300">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Action description & centre */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{action.centre_name}</span>
                      <Badge
                        variant={isCompleted ? 'teal' : isOverdue ? 'red' : 'amber'}
                        size="sm"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                        ) : isOverdue ? (
                          <AlertCircle className="w-3 h-3 text-red-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span className="capitalize">
                          {isOverdue ? 'Overdue' : action.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-slate-800">{action.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                      <p className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Assigned To: <strong className="text-slate-800">{action.assigned_to_name}</strong>
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          SLA Deadline:{' '}
                          <strong className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-800'}>
                            {new Date(action.due_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </strong>
                        </span>
                      </p>
                    </div>

                    {action.resolution_notes && (
                      <div className="mt-2 p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-xs text-teal-950">
                        <span className="font-bold flex items-center gap-1 text-teal-800 mb-0.5">
                          <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                          Resolution Evidence Notes:
                        </span>
                        <p>{action.resolution_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Resolve action */}
                  <div className="shrink-0 pt-2 lg:pt-0 flex justify-end">
                    {!isCompleted ? (
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={() => handleOpenResolutionModal(action)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Submit Resolution
                      </Button>
                    ) : (
                      <span className="text-xs text-teal-700 font-semibold flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Remediation Completed
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Resolution Submission Modal */}
      <Modal
        isOpen={Boolean(selectedActionForResolution)}
        onClose={() => setSelectedActionForResolution(null)}
        title="Submit Remediation Verification"
        description={`Centre: ${selectedActionForResolution?.centre_name}`}
      >
        <form onSubmit={handleConfirmResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remediation Notes & Compliance Proof
            </label>
            <textarea
              required
              rows={4}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="Detail how the defect was resolved (e.g. invoice number, photo inspection confirmation)..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedActionForResolution(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              isLoading={isResolving}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Mark Resolved & Close Alert
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

