import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CentresPage } from './pages/CentresPage';
import { CentreDetailPage } from './pages/CentreDetailPage';
import { AttendancePage } from './pages/AttendancePage';
import { CheckInPage } from './pages/CheckInPage';
import { AttendanceRecordsPage } from './pages/AttendanceRecordsPage';
import { InspectionsPage } from './pages/InspectionsPage';
import { NewInspectionPage } from './pages/NewInspectionPage';
import { AlertsPage } from './pages/AlertsPage';
import { CorrectiveActionsPage } from './pages/CorrectiveActionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-500">
        Authenticating SkillWatch AI session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Standalone Trainee Mobile Check-in (accessible by students/trainees) */}
            <Route
              path="/check-in"
              element={
                <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex flex-col justify-center">
                  <CheckInPage />
                  <div className="text-center mt-6">
                    <a
                      href="/"
                      className="text-xs text-blue-700 hover:underline font-medium"
                    >
                      ← Return to Staff Monitoring Console
                    </a>
                  </div>
                </div>
              }
            />

            {/* Authenticated Application Console */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="centres" element={<CentresPage />} />
              <Route path="centres/:id" element={<CentreDetailPage />} />
              <Route path="attendance-sessions" element={<AttendancePage />} />
              <Route path="attendance-records" element={<AttendanceRecordsPage />} />
              <Route path="inspections" element={<InspectionsPage />} />
              <Route path="inspections/new" element={<NewInspectionPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="corrective-actions" element={<CorrectiveActionsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
