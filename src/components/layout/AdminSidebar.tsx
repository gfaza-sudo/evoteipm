import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  Award,
  BarChart3,
  Settings,
  LogOut,
  X,
  Vote,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { adminActiveTab, setAdminActiveTab, logoutAdmin, stats, settings } = useApp();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pimpinan',
      label: 'Asal Pimpinan',
      icon: Building2,
      badge: stats ? stats.totalPimpinan : null,
    },
    {
      id: 'voters',
      label: 'Pemilih / User',
      icon: Users,
      badge: stats ? stats.totalVoters : null,
    },
    {
      id: 'formaturs',
      label: 'Calon Formatur',
      icon: Award,
      badge: stats ? stats.totalFormaturs : null,
    },
    {
      id: 'results',
      label: 'Perolehan Suara',
      icon: BarChart3,
      badge: stats ? `${stats.participationPercentage}%` : null,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId: any) => {
    setAdminActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="text-left">
          <h2 className="font-bold text-white text-base tracking-wide flex items-center gap-1">
            PANLIH <span className="text-amber-400">IPM</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Sistem Pemilihan Digital</p>
        </div>

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Utama Panlih
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = adminActiveTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Administrator Sesi</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logoutAdmin}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 shadow-xl z-20">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
