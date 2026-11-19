import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService } from '../lib/dbService';
import { hashPassword } from '../lib/supabase';
import { AppSettings, Formatur, PimpinanAsal, UserRole, Voter, VoteStats } from '../types';

interface AppContextType {
  role: UserRole;
  adminLoggedIn: boolean;
  currentVoter: Voter | null;
  settings: AppSettings;
  stats: VoteStats | null;
  formaturs: Formatur[];
  pimpinanList: PimpinanAsal[];
  voters: Voter[];
  loading: boolean;
  dbStatus: { connected: boolean; tablesReady: boolean; error?: string };
  // Navigation
  adminActiveTab: 'dashboard' | 'pimpinan' | 'voters' | 'formaturs' | 'results' | 'settings';
  setAdminActiveTab: (tab: 'dashboard' | 'pimpinan' | 'voters' | 'formaturs' | 'results' | 'settings') => void;
  voterActiveView: 'login' | 'profile' | 'ballot';
  setVoterActiveView: (view: 'login' | 'profile' | 'ballot') => void;
  // Auth methods
  loginAdmin: (username: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;
  logoutAdmin: () => void;
  loginVoter: (userId: string, passwordPlain: string) => Promise<{ success: boolean; message: string }>;
  logoutVoter: () => void;
  // Voting
  castVote: (formaturIds: string[]) => Promise<{ success: boolean; message: string }>;
  // Refresh & updates
  refreshData: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_ADMIN_AUTH = 'evote_admin_auth';
const STORAGE_KEY_VOTER_AUTH = 'evote_current_voter';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('guest');
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(false);
  const [currentVoter, setCurrentVoter] = useState<Voter | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    org_name: 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang',
    org_logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80',
    org_period: 'Periode 2026 - 2028',
    admin_username: 'admin',
    admin_password_hash: '88c5ac40891d2b53180e83ad67104286465af8b548d681240487392da288d057',
    max_formatur_choices: 7,
  });

  const [stats, setStats] = useState<VoteStats | null>(null);
  const [formaturs, setFormaturs] = useState<Formatur[]>([]);
  const [pimpinanList, setPimpinanList] = useState<PimpinanAsal[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; tablesReady: boolean; error?: string }>({
    connected: false,
    tablesReady: false,
  });

  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'pimpinan' | 'voters' | 'formaturs' | 'results' | 'settings'>('dashboard');
  const [voterActiveView, setVoterActiveView] = useState<'login' | 'profile' | 'ballot'>('login');

  const refreshData = async () => {
    try {
      const status = await dbService.initStatus();
      setDbStatus(status);

      await dbService.syncVotesWithVoters();

      const [fetchedSettings, fetchedFormaturs, fetchedPimpinan, fetchedVoters, fetchedStats] =
        await Promise.all([
          dbService.getSettings(),
          dbService.getFormaturs(),
          dbService.getPimpinanList(),
          dbService.getVoters(),
          dbService.getStats(),
        ]);

      setSettings(fetchedSettings);
      setFormaturs(fetchedFormaturs);
      setPimpinanList(fetchedPimpinan);
      setVoters(fetchedVoters);
      setStats(fetchedStats);

      // If voter is currently logged in, update their local status
      if (currentVoter) {
        const updatedVoter = fetchedVoters.find((v) => v.id === currentVoter.id);
        if (updatedVoter) {
          setCurrentVoter(updatedVoter);
          sessionStorage.setItem(STORAGE_KEY_VOTER_AUTH, JSON.stringify(updatedVoter));
        }
      }
    } catch (e) {
      console.error('Error refreshing data:', e);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const status = await dbService.initStatus();
      setDbStatus(status);
      await refreshData();

      // Check existing admin session
      const adminAuth = sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
      if (adminAuth === 'true') {
        setAdminLoggedIn(true);
        setRole('admin');
      }

      // Check existing voter session
      const savedVoterStr = sessionStorage.getItem(STORAGE_KEY_VOTER_AUTH);
      if (savedVoterStr) {
        try {
          const voter = JSON.parse(savedVoterStr);
          setCurrentVoter(voter);
          setRole('voter');
          setVoterActiveView(voter.has_voted ? 'profile' : 'profile');
        } catch {}
      }

      setLoading(false);
    };

    init();
  }, []);

  // Admin login
  const loginAdmin = async (username: string, passwordPlain: string): Promise<{ success: boolean; message: string }> => {
    const currentSettings = await dbService.getSettings();
    const hash = await hashPassword(passwordPlain.trim());
    const isValidUsername =
      username.trim().toLowerCase() === currentSettings.admin_username.trim().toLowerCase();
    const isValidPassword = hash === currentSettings.admin_password_hash;

    if (isValidUsername && isValidPassword) {
      setAdminLoggedIn(true);
      setRole('admin');
      sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
      return { success: true, message: 'Login Administrator Berhasil!' };
    }

    return { success: false, message: 'Username atau Password Administrator salah!' };
  };

  const logoutAdmin = () => {
    setAdminLoggedIn(false);
    setRole('guest');
    sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    setAdminActiveTab('dashboard');
  };

  // Voter login
  const loginVoter = async (userId: string, passwordPlain: string): Promise<{ success: boolean; message: string }> => {
    const result = await dbService.voterLogin(userId, passwordPlain);
    if (result.success && result.voter) {
      setCurrentVoter(result.voter);
      setRole('voter');
      sessionStorage.setItem(STORAGE_KEY_VOTER_AUTH, JSON.stringify(result.voter));
      setVoterActiveView('profile');
      return { success: true, message: result.message };
    }
    return { success: false, message: result.message };
  };

  const logoutVoter = () => {
    setCurrentVoter(null);
    setRole('guest');
    sessionStorage.removeItem(STORAGE_KEY_VOTER_AUTH);
    setVoterActiveView('login');
  };

  // Submit Ballot
  const castVote = async (formaturIds: string[]): Promise<{ success: boolean; message: string }> => {
    if (!currentVoter) {
      return { success: false, message: 'Sesi pemilih tidak valid.' };
    }

    const result = await dbService.submitVote(currentVoter.id, formaturIds);
    if (result.success) {
      // Refresh local stats
      await refreshData();
      // Update active voter instance
      setCurrentVoter((prev) => (prev ? { ...prev, has_voted: true, voted_at: new Date().toISOString() } : null));
    }
    return result;
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await dbService.updateSettings(newSettings);
    setSettings(updated);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        adminLoggedIn,
        currentVoter,
        settings,
        stats,
        formaturs,
        pimpinanList,
        voters,
        loading,
        dbStatus,
        adminActiveTab,
        setAdminActiveTab,
        voterActiveView,
        setVoterActiveView,
        loginAdmin,
        logoutAdmin,
        loginVoter,
        logoutVoter,
        castVote,
        refreshData,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
