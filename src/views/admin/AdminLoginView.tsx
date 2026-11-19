import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, KeyRound, User, ArrowLeft, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

interface AdminLoginViewProps {
  onBackToVoter: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onBackToVoter }) => {
  const { loginAdmin, settings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan Password wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const result = await loginAdmin(username.trim(), password.trim());
      if (!result.success) {
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal login admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-900">
      <div className="w-full max-w-md bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/50 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-white tracking-wide">
            PORTAL PANLIH
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {settings.org_name || 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Username Admin
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="panlih-admin-username"
                  autoComplete="off"
                  required
                  placeholder="Masukkan username admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="panlih-admin-password"
                  autoComplete="new-password"
                  required
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-md shadow-amber-500/20 mt-2"
            >
              <span>{loading ? 'Memproses...' : 'Masuk Dashboard Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onBackToVoter}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Login Pemilih</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
