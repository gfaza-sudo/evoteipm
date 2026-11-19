import React from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut, User, ShieldCheck, Vote, CheckCircle2, AlertCircle } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const { settings, role, currentVoter, logoutAdmin, logoutVoter, dbStatus } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-amber-200/70 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            {role === 'admin' && onOpenMobileMenu && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                aria-label="Buka Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div
                className={`h-10 sm:h-11 px-2 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center overflow-hidden shrink-0 shadow-xs transition-all ${
                  settings.org_logo_aspect === 'square'
                    ? 'w-10 sm:w-11'
                    : 'w-auto max-w-[110px] sm:max-w-[180px] min-w-[38px] sm:min-w-[44px]'
                }`}
              >
                {settings.org_logo ? (
                  <img
                    src={settings.org_logo}
                    alt="Logo Organisasi"
                    className={`max-h-full max-w-full ${
                      settings.org_logo_fit === 'cover' ? 'w-full h-full object-cover' : 'object-contain'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Vote className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                )}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg inline-flex items-baseline whitespace-nowrap shrink-0">
                  <span className="text-amber-600 font-black">e-vote</span>
                  <span className="text-slate-900 font-bold">ipm</span>
                </span>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate max-w-[180px] sm:max-w-md block mt-0.5 leading-tight">
                  {settings.org_name || 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-3">
            {/* DB status indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
              <span className={`w-2 h-2 rounded-full ${dbStatus.tablesReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>{dbStatus.tablesReady ? 'Supabase Aktif' : 'Mode Siap / Local DB'}</span>
            </div>

            {role === 'admin' && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Admin Panel</span>
                </div>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  title="Logout / Keluar dari Sesi Portal Panlih"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Sesi</span>
                </button>
              </div>
            )}

            {role === 'voter' && currentVoter && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700 font-bold text-xs">
                    {currentVoter.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{currentVoter.name}</p>
                    <p className="text-[11px] text-slate-500 leading-tight">{currentVoter.user_id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logoutVoter}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  title="Logout Pemilih"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
