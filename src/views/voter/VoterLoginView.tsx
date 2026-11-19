import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Vote,
  KeyRound,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react';

interface VoterLoginViewProps {
  onSwitchToAdmin: () => void;
}

export const VoterLoginView: React.FC<VoterLoginViewProps> = ({ onSwitchToAdmin }) => {
  const { loginVoter, settings, voters } = useApp();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!userId.trim() || !password.trim()) {
      setErrorMsg('User ID dan Password wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const result = await loginVoter(userId.trim(), password.trim());
      if (!result.success) {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal melakukan login pemilih.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo account pickers
  const notVotedVoter = voters.find((v) => !v.has_voted);
  const alreadyVotedVoter = voters.find((v) => v.has_voted);

  const handleQuickLogin = (demoVoter: any) => {
    if (!demoVoter) return;
    setUserId(demoVoter.user_id);
    setPassword('pemilih123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-radial from-amber-500/10 via-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-amber-200/60 overflow-hidden">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center p-2.5 shadow-inner mb-3 transition-all ${
                settings.org_logo_aspect === 'square'
                  ? 'w-16 h-16'
                  : 'h-16 w-auto max-w-[240px] px-4'
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
                <Vote className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              e-voteipm
            </h1>
            <p className="text-xs text-amber-100 font-medium mt-1 max-w-xs">
              {settings.org_name || 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang'}
            </p>
            <span className="mt-2 text-[11px] font-bold px-3 py-0.5 rounded-full bg-black/20 text-white border border-white/20">
              {settings.org_period || 'Periode 2026 - 2028'}
            </span>
          </div>

          {/* Watermark shape */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Vote className="w-40 h-40" />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900">Masuk Sebagai Pemilih</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan User ID (Nomor Peserta) dan Password yang diberikan PANLIH
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
              <Lock className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                User ID Pemilih
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: IPM-2026-004"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono uppercase text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-md shadow-amber-500/20"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Bilik Suara'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider text-center">
              STATUS AKUN
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {notVotedVoter && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(notVotedVoter)}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-left transition-colors"
                >
                  <span className="font-bold block truncate">Akun Belum Memilih</span>
                  <span className="text-[10px] text-emerald-700 block font-mono truncate">{notVotedVoter.user_id}</span>
                </button>
              )}

              {alreadyVotedVoter && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(alreadyVotedVoter)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left transition-colors"
                >
                  <span className="font-bold block truncate">Akun Sudah Memilih</span>
                  <span className="text-[10px] text-slate-500 block font-mono truncate">{alreadyVotedVoter.user_id}</span>
                </button>
              )}
            </div>
          </div>

          {/* Switch to Admin Portal */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-700 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Login Sebagai Panitia / Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
