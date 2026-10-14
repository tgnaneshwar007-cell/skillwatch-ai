import React from 'react';
import { ChecklistItemStatus, ItemSeverity } from '../../types';
import { EvidenceUploader } from './EvidenceUploader';
import { calculateComplianceScore } from '../../lib/calculations';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export interface ChecklistFormItem {
  category: string;
  requirement: string;
  description: string;
  status: ChecklistItemStatus;
  severity: ItemSeverity;
  notes?: string;
  evidence_url?: string;
  evidence_filename?: string;
}

interface InspectionChecklistProps {
  items: ChecklistFormItem[];
  onChangeItem: (index: number, updated: ChecklistFormItem) => void;
}

export const InspectionChecklist: React.FC<InspectionChecklistProps> = ({
  items,
  onChangeItem,
}) => {
  const compliance = calculateComplianceScore(items);

  const statusOptions: { value: ChecklistItemStatus; label: string; icon: React.ReactNode; color: string }[] = [
    {
      value: 'compliant',
      label: 'Compliant',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      color: 'hover:border-teal-400 peer-checked:bg-teal-50 peer-checked:border-teal-500 peer-checked:text-teal-900',
    },
    {
      value: 'non_compliant',
      label: 'Non-Compliant',
      icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      color: 'hover:border-red-400 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-900',
    },
    {
      value: 'needs_review',
      label: 'Needs Review',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      color: 'hover:border-amber-400 peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-900',
    },
    {
      value: 'not_inspected',
      label: 'Not Inspected',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
      color: 'hover:border-slate-300 peer-checked:bg-slate-100 peer-checked:border-slate-400 peer-checked:text-slate-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Live Compliance Score Sticky Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-16 z-20">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Live Compliance Calculation
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              className={clsx(
                'text-2xl font-bold tracking-tight',
                compliance.percentage === null
                  ? 'text-slate-500'
                  : compliance.percentage >= 80
                  ? 'text-teal-700'
                  : compliance.percentage >= 60
                  ? 'text-amber-600'
                  : 'text-red-600'
              )}
            >
              {compliance.formatted}
            </span>
            <span className="text-xs text-slate-500">
              ({compliance.compliantCount} of {compliance.inspectedCount} applicable inspected items)
            </span>
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
          <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {compliance.compliantCount} Compliant
          </span>
          <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200">
            {compliance.nonCompliantCount} Non-Compliant
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {compliance.needsReviewCount} Review
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {compliance.notInspectedCount} Uninspected
          </span>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className={clsx(
              'p-4 sm:p-5 rounded-xl border transition-all bg-white',
              item.status === 'non_compliant'
                ? 'border-red-300 shadow-2xs'
                : item.status === 'compliant'
                ? 'border-teal-200'
                : 'border-slate-200'
            )}
          >
            {/* Category & Requirement Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  {item.category}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 mt-0.5">{item.requirement}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
              </div>

              {/* Severity Selector */}
              <div className="shrink-0 flex items-center gap-1.5 self-start">
                <span className="text-[11px] text-slate-400 font-medium">Severity:</span>
                <select
                  value={item.severity}
                  onChange={e =>
                    onChangeItem(index, { ...item, severity: e.target.value as ItemSeverity })
                  }
                  className="text-xs font-semibold rounded-md border border-slate-300 py-1 px-2 bg-slate-50 text-slate-700"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Status Radio Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {statusOptions.map(opt => (
                <label
                  key={opt.value}
                  className="relative flex items-center gap-2 p-2 rounded-lg border border-slate-200 text-xs font-medium cursor-pointer transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/60"
                >
                  <input
                    type="radio"
                    name={`status-${index}`}
                    value={opt.value}
                    checked={item.status === opt.value}
                    onChange={() => onChangeItem(index, { ...item, status: opt.value })}
                    className="accent-blue-600"
                  />
                  <div className="flex items-center gap-1.5">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Inspector Notes & Photo Attachment */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Optional inspector field observation notes..."
                value={item.notes || ''}
                onChange={e => onChangeItem(index, { ...item, notes: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800"
              />

              <div className="flex items-center justify-between pt-1">
                <EvidenceUploader
                  existingUrl={item.evidence_url}
                  existingFilename={item.evidence_filename}
                  onEvidenceUploaded={(url, filename) =>
                    onChangeItem(index, {
                      ...item,
                      evidence_url: url,
                      evidence_filename: filename,
                    })
                  }
                />

                {item.status === 'non_compliant' && (
                  <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Will trigger rule alert upon submit
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

