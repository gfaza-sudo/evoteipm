import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { AdminSidebar } from './components/layout/AdminSidebar';

// Admin Views
import { DashboardView } from './views/admin/DashboardView';
import { PimpinanView } from './views/admin/PimpinanView';
import { VotersView } from './views/admin/VotersView';
import { FormatursView } from './views/admin/FormatursView';
import { VoteResultsView } from './views/admin/VoteResultsView';
import { SettingsView } from './views/admin/SettingsView';
import { AdminLoginView } from './views/admin/AdminLoginView';

// Voter Views
import { VoterLoginView } from './views/voter/VoterLoginView';
import { VoterProfileView } from './views/voter/VoterProfileView';
import { BallotView } from './views/voter/BallotView';

const AppContent: React.FC = () => {
  const { role, adminLoggedIn, adminActiveTab, voterActiveView, setVoterActiveView, loading } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [guestPortal, setGuestPortal] = useState<'voter-login' | 'admin-login'>('voter-login');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-amber-400 text-sm tracking-wider">Memuat e-voteipm...</p>
      </div>
    );
  }

  // --- RENDER ADMIN LAYOUT ---
  if (role === 'admin' && adminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Navbar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
        <div className="flex-1 flex overflow-hidden">
          <AdminSidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {adminActiveTab === 'dashboard' && <DashboardView />}
              {adminActiveTab === 'pimpinan' && <PimpinanView />}
              {adminActiveTab === 'voters' && <VotersView />}
              {adminActiveTab === 'formaturs' && <FormatursView />}
              {adminActiveTab === 'results' && <VoteResultsView />}
              {adminActiveTab === 'settings' && <SettingsView />}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- RENDER VOTER LOGGED IN LAYOUT ---
  if (role === 'voter') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          {voterActiveView === 'profile' && <VoterProfileView />}
          {voterActiveView === 'ballot' && <BallotView />}
          {voterActiveView === 'login' && (
            <VoterLoginView onSwitchToAdmin={() => setGuestPortal('admin-login')} />
          )}
        </main>
      </div>
    );
  }

  // --- RENDER GUEST / LOGIN PORTALS ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        {guestPortal === 'voter-login' ? (
          <VoterLoginView onSwitchToAdmin={() => setGuestPortal('admin-login')} />
        ) : (
          <AdminLoginView onBackToVoter={() => setGuestPortal('voter-login')} />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
