import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  Search,
  MapPin,
  Users,
  BookOpen,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
} from 'lucide-react';
import { fetchCentres, createCentre } from '../services/centres';
import { Centre, CentreStatus } from '../types';

export const CentresPage: React.FC = () => {
  const { showToast } = useToast();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [district, setDistrict] = useState('Jaipur');
  const [state, setState] = useState('Rajasthan');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [enrolledTrainees, setEnrolledTrainees] = useState(120);
  const [activeCourses, setActiveCourses] = useState(4);
  const [status, setStatus] = useState<CentreStatus>('operational');

  const loadCentres = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCentres();
      setCentres(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCentres();
  }, []);

  const handleCreateCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      showToast('warning', 'Name and Code are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createCentre({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        district: district.trim(),
        state: state.trim(),
        address: address.trim(),
        contact_person: contactPerson.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        enrolled_trainees: Number(enrolledTrainees),
        active_courses: Number(activeCourses),
        status,
      });

      showToast('success', 'Training Centre Registered', `${name} added to database.`);
      setIsAddModalOpen(false);
      // Reset form
      setName('');
      setCode('');
      setAddress('');
      await loadCentres();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const districts = ['ALL', ...Array.from(new Set(centres.map(c => c.district)))];

  const filteredCentres = centres.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = districtFilter === 'ALL' || c.district === districtFilter;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Training Centres Directory"
        subtitle="Accredited PMKVY and DGT partner skill training facilities under monitoring"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Register New Centre
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by centre name, code, or city..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {districts.map(d => (
              <option key={d} value={d}>
                District: {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Centres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400">
            Loading centres directory...
          </div>
        ) : filteredCentres.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No Training Centres Found</p>
            <p className="text-[11px] text-slate-400">
              No centres match your filter criteria or none have been added to the database yet.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2"
            >
              Add First Centre
            </Button>
          </div>
        ) : (
          filteredCentres.map(centre => {
            const isOp = centre.status === 'operational';
            return (
              <Card key={centre.id} className="p-5 flex flex-col justify-between hover:border-slate-300">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {centre.code}
                    </span>
                    <Badge variant={isOp ? 'teal' : 'amber'} size="sm">
                      {isOp ? (
                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                      )}
                      <span className="capitalize">{centre.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{centre.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {centre.district}, {centre.state}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{centre.address}</p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{centre.enrolled_trainees} Trainees</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{centre.active_courses} Trades</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Spoc: {centre.contact_person.split(' ')[0]}
                  </span>
                  <Link
                    to={`/centres/${centre.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Register New Centre Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Accredited Training Centre"
        description="Add a new PMKVY / DGT facility into MSDE monitoring database"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCentre} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Facility Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. PMKK Skill Academy Jaipur"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accreditation Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. PMKK-RJ-JAI-105"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                required
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Plot / Street / Area / PIN"
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person (SPOC)
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="Manager Name"
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
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="spoc@centre.org"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+91 98..."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enrolled Trainees
              </label>
              <input
                type="number"
                min={0}
                value={enrolledTrainees}
                onChange={e => setEnrolledTrainees(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Courses
              </label>
              <input
                type="number"
                min={1}
                value={activeCourses}
                onChange={e => setActiveCourses(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as CentreStatus)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 bg-white"
              >
                <option value="operational">Operational</option>
                <option value="under_review">Under Review</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Save Centre Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
