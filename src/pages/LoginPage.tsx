import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ShieldCheck, LogIn, Lock, Mail, AlertCircle, Info, Sparkles } from 'lucide-react';
import { DEMO_PROFILES } from '../lib/mockData';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isDemoMode, switchDemoRole } = useAuth();

  const [email, setEmail] = useState('admin.national@msde.gov.in');
  const [password, setPassword] = useState('SkillWatch@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(result.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleQuickDemoLogin = (profile: typeof DEMO_PROFILES[0]) => {
    setEmail(profile.email || '');
    switchDemoRole(profile.role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-radial from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-700 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-700/30 font-bold text-2xl tracking-wider mb-3">
            SW
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">SkillWatch AI</h2>
          <p className="mt-1 text-xs text-slate-400">
            Real-Time Training Centre Monitoring & Compliance
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 text-[11px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50 rounded-full">
            Smart India Hackathon 2026 • SIH26245
          </span>
        </div>

        <Card className="mt-6 border-slate-700/60 shadow-2xl bg-white/95 backdrop-blur-md">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                    placeholder="officer@msde.gov.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                icon={<LogIn className="w-4 h-4" />}
              >
                Sign In to Monitoring Console
              </Button>
            </form>

            {/* Quick Demo Login Switchers */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>1-Click Hackathon Evaluator Roles:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {DEMO_PROFILES.map(p => {
                  const titles: Record<UserRole, string> = {
                    national_admin: 'National Admin',
                    district_officer: 'District Officer',
                    centre_manager: 'Centre Manager',
                    field_inspector: 'Field Inspector',
                  };
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(p)}
                      className="text-left p-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                    >
                      <p className="font-semibold text-slate-800 text-[11px] leading-tight">
                        {titles[p.role]}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{p.full_name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Academic prototype designed for Smart India Hackathon 2026.
        </p>
      </div>
    </div>
  );
};

