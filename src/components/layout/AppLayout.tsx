import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { Footer } from './Footer';
import { ConfigBanner } from '../ui/ConfigBanner';
import { fetchAlerts } from '../../services/alerts';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAlertsCount, setOpenAlertsCount] = useState<number>(0);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const alerts = await fetchAlerts();
        const open = alerts.filter(a => a.status === 'open' || a.status === 'in_progress').length;
        setOpenAlertsCount(open);
      } catch (e) {
        console.error('Error fetching alerts count for layout:', e);
      }
    }
    loadAlerts();
    // Refresh alert count periodically
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <ConfigBanner />
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
        openAlertsCount={openAlertsCount}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar openAlertsCount={openAlertsCount} />
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          openAlertsCount={openAlertsCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          <div className="max-w-7xl w-full mx-auto flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

