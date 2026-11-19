import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Building2,
  Award,
  CheckCircle2,
  Clock,
  PieChart,
  ArrowRight,
  Sparkles,
  Database,
  RefreshCw,
} from 'lucide-react';
import { SQLGuideModal } from '../../components/common/SQLGuideModal';

export const DashboardView: React.FC = () => {
  const { stats, settings, setAdminActiveTab, refreshData, dbStatus } = useApp();
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const totalVoters = stats?.totalVoters || 0;
  const votedCount = stats?.votedCount || 0;
  const notVotedCount = stats?.notVotedCount || 0;
  const participationPct = stats?.participationPercentage || 0;

  return (
    <div className="space-y-6">
      {/* Banner & Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-black/25 border border-white/20 text-xs font-semibold backdrop-blur-md mb-3 text-amber-100 shadow-xs">
            <span className="tracking-wide font-medium text-amber-50">pusat kendali e-voting Musyawarah Cabang</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Selamat Datang di Panitia Pemilihan (PANLIH)
          </h1>
          <p className="inline-block text-amber-950 bg-amber-100/90 backdrop-blur-xs border border-amber-200/80 px-3.5 py-2 rounded-xl text-xs sm:text-sm leading-relaxed mb-5 font-medium shadow-xs">
            Aplikasi resmi pemilihan Calon Formatur <span className="font-semibold text-amber-950">{settings.org_name || 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang'}</span> <span className="inline-flex items-center ml-1.5 px-2.5 py-0.5 rounded-md bg-amber-200/70 text-amber-900 border border-amber-300/80 font-medium text-xs">{settings.org_period || 'Periode 2026 - 2028'}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAdminActiveTab('results')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 text-amber-400 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors shadow-sm"
            >
              <span>Lihat Perolehan Suara Real-Time</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl text-xs backdrop-blur-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute right-[-20px] bottom-[-30px] opacity-15 pointer-events-none">
          <Award className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Database Warning if tables are not yet ready or lack permissions in Supabase */}
      {!dbStatus.tablesReady && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start sm:items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">
                {dbStatus.connected
                  ? 'Database Supabase Terhubung — Perlu Konfigurasi Izin / Schema'
                  : 'Koneksi Database Supabase Perlu Diperiksa'}
              </p>
              <p className="text-amber-800 mt-0.5">
                {dbStatus.error ||
                  'Aplikasi belum dapat mengakses tabel di Supabase. Jalankan skrip SQL schema & GRANT di SQL Editor Supabase.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shrink-0 transition-colors shadow-xs"
          >
            Lihat & Salin SQL Schema
          </button>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pemilih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Pemilih (DPT)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalVoters}</div>
          <p className="text-xs text-slate-500 mt-1">Pemilih terverifikasi</p>
        </div>

        {/* Asal Pimpinan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Asal Pimpinan</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.totalPimpinan || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Cabang & Ranting</p>
        </div>

        {/* Calon Formatur */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Calon Formatur</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats?.totalFormaturs || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Dipilih {settings.max_formatur_choices} formatur</p>
        </div>

        {/* Persentase Partisipasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Partisipasi Suara</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{participationPct}%</div>
          <p className="text-xs text-slate-500 mt-1">{votedCount} dari {totalVoters} suara masuk</p>
        </div>
      </div>

      {/* Progress & Voting Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participation Bar Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Status Partisipasi Pemilih</h2>
              <p className="text-xs text-slate-500">Pantauan suara yang telah digunakan oleh peserta musyawarah</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
              Target: 100%
            </span>
          </div>

          {/* Large Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sudah Memilih: {votedCount} ({participationPct}%)
              </span>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Belum Memilih: {notVotedCount} ({100 - participationPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700 ease-out"
                style={{ width: `${participationPct}%` }}
              />
              <div
                className="bg-slate-200 transition-all duration-700"
                style={{ width: `${100 - participationPct}%` }}
              />
            </div>
          </div>

          {/* Quick Metrics Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-emerald-800 font-medium leading-tight">Sudah Menggunakan Hak Suara</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-900 mt-0.5 truncate">{votedCount} Pemilih</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-600 font-medium leading-tight">Belum Menggunakan Hak Suara</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 truncate">{notVotedCount} Pemilih</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & System Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base mb-1">Aksi Cepat Panlih</h2>
            <p className="text-xs text-slate-500 mb-4">Navigasi langsung ke modul manajemen</p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setAdminActiveTab('voters')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-xs font-semibold text-slate-800 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Kelola Daftar Pemilih (DPT)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setAdminActiveTab('formaturs')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-xs font-semibold text-slate-800 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Kelola Calon Formatur</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setAdminActiveTab('pimpinan')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-xs font-semibold text-slate-800 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Kelola Asal Pimpinan</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500">
              <span>Metode Pemilihan:</span>
              <span className="font-bold text-slate-800">{settings.max_formatur_choices} dari 9 Formatur</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Prinsip Keamanan:</span>
              <span className="font-bold text-emerald-700">LUBER & JURDIL (Secret Ballot)</span>
            </div>
          </div>
        </div>
      </div>

      <SQLGuideModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} />
    </div>
  );
};
