import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { fetchInspections } from '../services/inspections';
import { Inspection } from '../types';

export const InspectionsPage: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInspections();
      setInspections(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Infrastructure Inspections & Physical Audits"
        subtitle="On-site compliance evaluations across MSDE 8-dimension accreditation criteria"
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
            <Link to="/inspections/new">
              <Button variant="teal" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                New Physical Audit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-xs text-slate-400">Loading audit records...</Card>
        ) : inspections.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            No inspection records found. Click "New Physical Audit" to start an assessment.
          </Card>
        ) : (
          inspections.map(insp => {
            const hasScore = insp.overall_compliance_percentage !== null;
            const score = insp.overall_compliance_percentage || 0;
            const isHighCompliance = hasScore && score >= 80;
            const isMediumCompliance = hasScore && score >= 60 && score < 80;

            const nonCompliantCount =
              insp.items?.filter(i => i.status === 'non_compliant').length || 0;

            return (
              <Card key={insp.id} className="p-5 hover:border-slate-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Centre, Inspector, Date */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{insp.centre_name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600">
                        District: {insp.district}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Auditor: {insp.inspector_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(insp.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="capitalize font-medium text-slate-700">
                        Status: {insp.status.replace('_', ' ')}
                      </span>
                    </div>

                    {insp.inspector_notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                        "{insp.inspector_notes}"
                      </p>
                    )}
                  </div>

                  {/* Right: Compliance Score & Badges */}
                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Compliance Score
                      </span>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span
                          className={`text-xl font-bold ${
                            !hasScore
                              ? 'text-slate-400'
                              : isHighCompliance
                              ? 'text-teal-700'
                              : isMediumCompliance
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {hasScore ? `${score}%` : 'Not Assessed'}
                        </span>
                      </div>
                      {nonCompliantCount > 0 && (
                        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 justify-end mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> {nonCompliantCount} Non-Compliant Items
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={isHighCompliance ? 'teal' : nonCompliantCount > 0 ? 'red' : 'amber'}
                      size="md"
                    >
                      {isHighCompliance ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      )}
                      <span>{isHighCompliance ? 'Accredited' : 'Remediation Needed'}</span>
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

