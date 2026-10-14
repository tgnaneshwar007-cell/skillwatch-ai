import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Menu,
  Bell,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Building2,
  QrCode,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  openAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, openAlertsCount }) => {
  const { user, role, logout, switchDemoRole, isDemoMode } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const roleLabels: Record<UserRole, string> = {
    national_admin: 'National Admin',
    district_officer: 'District Officer',
    centre_manager: 'Centre Manager',
    field_inspector: 'Field Inspector',
  };

  const roleBadges: Record<UserRole, string> = {
    national_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    district_officer: 'bg-blue-100 text-blue-800 border-blue-200',
    centre_manager: 'bg-teal-100 text-teal-800 border-teal-200',
    field_inspector: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-white shadow-sm font-bold text-base tracking-wider">
              SW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight leading-tight">
                  SkillWatch AI
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  SIH26245
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Ministry of Skill Development & Entrepreneurship (MSDE)
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Right: Quick Actions, Alerts, User Profile */}
        <div className="flex items-center gap-3">
          {/* Mobile Check-In Quick Link */}
          <Link
            to="/check-in"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trainee</span> Check-In
          </Link>

          {/* Alerts Bell */}
          <Link
            to="/alerts"
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Active Alerts"
          >
            <Bell className="w-5 h-5" />
            {openAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {openAlertsCount > 9 ? '9+' : openAlertsCount}
              </span>
            )}
          </Link>

          {/* User Profile & Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-medium text-xs">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.full_name || 'Authorized Official'}
                </p>
                <span
                  className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium ${roleBadges[role]}`}
                >
                  {roleLabels[role]}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {/* Role Switcher Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in-50">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{user?.full_name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                  {user?.assigned_district && (
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      District: <span className="font-medium text-slate-700">{user.assigned_district}</span>
                    </p>
                  )}
                </div>

                {isDemoMode && (
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Hackathon Demo Role Switcher
                    </p>
                    <div className="space-y-1">
                      {(['national_admin', 'district_officer', 'centre_manager', 'field_inspector'] as UserRole[]).map(
                        r => (
                          <button
                            key={r}
                            onClick={() => {
                              switchDemoRole(r);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                              role === r ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span>{roleLabels[r]}</span>
                            {role === r && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

