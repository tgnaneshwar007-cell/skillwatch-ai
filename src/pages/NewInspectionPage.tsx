import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InspectionChecklist, ChecklistFormItem } from '../components/inspections/InspectionChecklist';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  STANDARD_MSDE_REQUIREMENTS,
  submitInspection,
} from '../services/inspections';
import { fetchCentres } from '../services/centres';
import { Centre } from '../types';
import { ClipboardCheck, Building2, User, FileText, Send, ArrowLeft, ShieldAlert } from 'lucide-react';

export const NewInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCentre = searchParams.get('centre');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [centres, setCentres] = useState<Centre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [inspectorName, setInspectorName] = useState(user?.full_name || 'Sunita Deshmukh');
  const [generalNotes, setGeneralNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistFormItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const fetchedCentres = await fetchCentres();
      setCentres(fetchedCentres);

      if (fetchedCentres.length > 0) {
        if (preselectedCentre) {
          setSelectedCentreId(preselectedCentre);
        } else if (user?.assigned_centre_id) {
          setSelectedCentreId(user.assigned_centre_id);
        } else {
          setSelectedCentreId(fetchedCentres[0].id);
        }
      }

      // Initialize default 8-dimension checklist
      setChecklistItems(
        STANDARD_MSDE_REQUIREMENTS.map(req => ({
          ...req,
          status: 'compliant', // initial sensible default, easily adjusted
          notes: '',
        }))
      );
    }
    init();
  }, [preselectedCentre, user]);

  const handleChangeItem = (index: number, updated: ChecklistFormItem) => {
    setChecklistItems(prev => {
      const clone = [...prev];
      clone[index] = updated;
      return clone;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentreId) {
      showToast('warning', 'Please select a centre to inspect');
      return;
    }

    try {
      setIsSubmitting(true);
      const newInsp = await submitInspection({
        centre_id: selectedCentreId,
        inspector_name: inspectorName.trim() || 'Field Inspector',
        inspector_notes: generalNotes.trim(),
        items: checklistItems,
      });

      const nonCompliant = checklistItems.filter(i => i.status === 'non_compliant').length;
      if (nonCompliant > 0) {
        showToast(
          'warning',
          'Audit Submitted with Defects',
          `${nonCompliant} non-compliant item(s) logged. Automated rule alerts triggered.`
        );
      } else {
        showToast('success', 'Physical Inspection Recorded', 'All evaluated criteria logged.');
      }

      navigate('/inspections');
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumb
        items={[{ label: 'Inspections', to: '/inspections' }, { label: 'New Physical Audit' }]}
        title="Conduct Infrastructure Physical Audit"
        subtitle="Evaluate 8 mandatory MSDE accreditation criteria with photo evidence upload"
        action={
          <Link to="/inspections">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to List
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auditor & Centre Header */}
        <Card>
          <CardHeader
            title="Inspection Assessment Details"
            subtitle="Select the target facility and verify auditor credentials"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Training Centre
                </label>
                <select
                  value={selectedCentreId}
                  onChange={e => setSelectedCentreId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {centres.length === 0 ? (
                    <option value="">No registered centres found in database</option>
                  ) : (
                    centres.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district}, {c.state})
                      </option>
                    ))
                  )}
                </select>
                {centres.length === 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-1.5">
                    No facilities registered yet.{' '}
                    <Link to="/centres" className="underline font-semibold text-blue-700">
                      Register a Centre
                    </Link>{' '}
                    before initiating an on-site audit.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Field Inspector / Auditor Name
                </label>
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={e => setInspectorName(e.target.value)}
                  placeholder="Inspector Name"
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                General Field Notes & Summary Observations
              </label>
              <textarea
                rows={2}
                value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)}
                placeholder="Overall facility condition, safety culture, student interaction feedback..."
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* 8-Dimension MSDE Checklist */}
        <InspectionChecklist items={checklistItems} onChangeItem={handleChangeItem} />

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link to="/inspections">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="teal"
            isLoading={isSubmitting}
            icon={<Send className="w-4 h-4" />}
          >
            Submit Verified Physical Audit
          </Button>
        </div>
      </form>
    </div>
  );
};

