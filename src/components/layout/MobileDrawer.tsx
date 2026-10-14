import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  QrCode,
  ClipboardCheck,
  AlertTriangle,
  CheckSquare,
  FileBarChart,
  Users,
  X,
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  openAlertsCount: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  openAlertsCount,
}) => {
  if (!isOpen) return null;

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/centres', label: 'Training Centres', icon: Building2 },
    { to: '/attendance-sessions', label: 'QR Attendance Sessions', icon: QrCode },
    { to: '/check-in', label: 'Mobile Trainee Check-In', icon: QrCode },
    { to: '/attendance-records', label: 'Attendance Records', icon: ClipboardCheck },
    { to: '/inspections', label: 'Infrastructure Inspections', icon: ClipboardCheck },
    {
      to: '/alerts',
      label: 'Alerts & AI Insights',
      icon: AlertTriangle,
      badge: openAlertsCount > 0 ? openAlertsCount : undefined,
    },
    { to: '/corrective-actions', label: 'Corrective Actions', icon: CheckSquare },
    { to: '/reports', label: 'Compliance Reports', icon: FileBarChart },
    { to: '/users', label: 'User & Role Access', icon: Users },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[80vw] bg-navy-950 text-slate-300 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="p-4 border-b border-navy-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm">
              SW
            </div>
            <div>
              <p className="font-bold text-white text-sm">SkillWatch AI</p>
              <p className="text-[10px] text-slate-400">MSDE Monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-700 text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-900 text-[10px] text-slate-500 text-center">
          SIH26245 • Smart Education
        </div>
      </div>
    </div>
  );
};

