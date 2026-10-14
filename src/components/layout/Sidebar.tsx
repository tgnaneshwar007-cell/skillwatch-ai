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
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  openAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ openAlertsCount }) => {
  const { role } = useAuth();

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/centres', label: 'Training Centres', icon: Building2 },
    { to: '/attendance-sessions', label: 'QR Attendance Sessions', icon: QrCode },
    { to: '/attendance-records', label: 'Attendance Records', icon: ClipboardCheck },
    {
      to: '/inspections',
      label: 'Infrastructure Inspections',
      icon: ClipboardCheck,
    },
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
    <aside className="hidden lg:flex flex-col w-64 bg-navy-950 text-slate-300 border-r border-navy-900 shrink-0">
      {/* Top Banner inside Sidebar */}
      <div className="p-4 border-b border-navy-900/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Monitoring Network
          </span>
        </div>
        <p className="text-[11px] text-slate-300 mt-1">PMKVY & DGT Real-Time Auditing</p>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`
              }
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Mobile Trainee Check-in Quick Link Card */}
      <div className="p-3 m-3 rounded-xl bg-navy-900/90 border border-navy-800 text-xs">
        <div className="flex items-center justify-between font-semibold text-white mb-1">
          <span className="flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            Trainee Check-In
          </span>
          <ExternalLink className="w-3 h-3 text-slate-300" />
        </div>
        <p className="text-[11px] text-slate-300 mb-2">
          Test mobile camera scanner or manual token entry flow.
        </p>
        <NavLink
          to="/check-in"
          className="block w-full py-1.5 text-center font-medium bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs"
        >
          Open Scanner UI
        </NavLink>
      </div>

      {/* Government Disclaimer */}
      <div className="p-3 border-t border-navy-900 text-[10px] text-slate-300 text-center">
        <span>SIH 2026 Prototype • Problem SIH26245</span>
      </div>
    </aside>
  );
};

