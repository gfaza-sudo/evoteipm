import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Table as TableIcon,
  Award,
  Vote,
  Printer,
  RefreshCw,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  FileCheck2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { BeritaAcaraModal } from '../../components/common/BeritaAcaraModal';

export const VoteResultsView: React.FC = () => {
  const { formaturs, stats, settings, refreshData, setAdminActiveTab } = useApp();
  const [viewMode, setViewMode] = useState<'both' | 'chart' | 'table'>('both');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);
  const [showBeritaAcara, setShowBeritaAcara] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullScreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Ensure results view always loads latest synchronized counts from Supabase
  useEffect(() => {
    refreshData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
    setRefreshToast(true);
    setTimeout(() => setRefreshToast(false), 3500);
  };

  const handleOpenBeritaAcara = async () => {
    await refreshData();
    setShowBeritaAcara(true);
  };

  // Sort formaturs by votes descending for ranking (tie-break by candidate number)
  const sortedFormaturs = [...formaturs].sort(
    (a, b) => (b.votes_count || 0) - (a.votes_count || 0) || a.number - b.number
  );

  const requiredChoices = settings.max_formatur_choices || 7;
  const totalVotesCast = sortedFormaturs.reduce((acc, f) => acc + (f.votes_count || 0), 0);
  const totalDpt = stats?.totalVoters || 0;
  // Benchmark scale: scales proportionally to total voters (DPT) so each formatur's bar corresponds
  // to the true incoming vote proportion rather than artificially stretching to 100% full.
  const benchmarkScale = Math.max(totalDpt, ...sortedFormaturs.map((f) => f.votes_count || 0), 10);

  return (
    <div className={`space-y-6 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-50 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6' : ''}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => {
                if (isFullScreen) setIsFullScreen(false);
                setAdminActiveTab('dashboard');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-bold rounded-lg text-xs transition-colors shadow-2xs border border-slate-200"
              title="Kembali ke Beranda Admin"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>Kembali ke Beranda Admin</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <span>Perolehan Suara Calon Formatur</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hasil Rekapitulasi real-time pemilihan Calon Formatur {settings.org_name || 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang'} ({settings.org_period || 'Periode 2026 - 2028'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Full Screen Button */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border ${
              isFullScreen
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 ring-2 ring-amber-400/50'
                : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-950 border-slate-200'
            }`}
            title={isFullScreen ? 'Keluar dari mode layar penuh (Esc)' : 'Tampilkan grafik batang dan tabel dalam layar penuh'}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-slate-950" />
                <span>Keluar Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Full Screen</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-xs"
            title="Muat ulang dan sinkronkan data suara terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{refreshing ? 'Menyegarkan...' : 'Segarkan'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenBeritaAcara}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            title="Buka pratinjau Berita Acara resmi dan unduh PDF"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Berita Acara</span>
          </button>
        </div>
      </div>

      {/* Refresh Success Toast */}
      {refreshToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Data perolehan suara berhasil disegarkan dan tersinkronisasi 100% secara real-time!</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshToast(false)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Secret Ballot & Integrity Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Asas Kerahasiaan Terjamin (LUBER & JURDIL):</span>
            <span className="text-emerald-700 ml-1">
              Data suara tersimpan tanpa menghubungkan identitas pemilih dengan formatur yang dipilih.
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 font-semibold text-emerald-800 bg-white/70 px-2.5 py-1 rounded-lg border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tervalidasi Database</span>
        </div>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Akumulasi Suara Masuk</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalVotesCast} Suara</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari {stats?.votedCount || 0} pemilih ({requiredChoices} formatur per pemilih)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Kandidat Terpilih (Formatur)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{requiredChoices} dari {formaturs.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">{requiredChoices} suara tertinggi menjadi formatur terpilih</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Partisipasi Musyawarah</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats?.participationPercentage || 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.votedCount || 0} dari {stats?.totalVoters || 0} Pemilih telah memilih
          </p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Visualisasi & Tabel Rekapitulasi
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              viewMode === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              viewMode === 'chart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Grafik
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Tabel
          </button>
        </div>
      </div>

      {/* Interactive Chart Section */}
      {(viewMode === 'both' || viewMode === 'chart') && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Grafik Batang Perolehan Suara</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {sortedFormaturs.length} Calon Formatur
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualisasi perolehan suara seluruh calon formatur secara real-time
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={toggleFullScreen}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-semibold text-xs border border-slate-200 transition-colors"
                title="Tampilkan grafik dalam layar penuh"
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Layar Penuh</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Kuorum: {requiredChoices} Formatur Terpilih</span>
              </div>
            </div>
          </div>

          {/* Mobile scroll hint */}
          <div className="sm:hidden flex items-center justify-center text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
            <span>↔ Geser grafik ke kanan/kiri untuk melihat detail</span>
          </div>

          {/* Horizontally scrollable container on mobile */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[520px] sm:min-w-0 space-y-3 pt-1">
              {sortedFormaturs.map((formatur, originalIndex) => {
                const isElected =
                  totalVotesCast > 0 &&
                  originalIndex < requiredChoices &&
                  (formatur.votes_count || 0) > 0;
                const percentage = totalVotesCast > 0 ? ((formatur.votes_count / totalVotesCast) * 100).toFixed(1) : '0';
                // Proportional bar width following actual incoming votes per candidate
                const barWidth = formatur.votes_count > 0 ? Math.max((formatur.votes_count / benchmarkScale) * 100, 2) : 0;

                return (
                  <div key={formatur.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                            isElected
                              ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {formatur.number}
                        </span>
                        <span className="font-bold text-slate-900 truncate">
                          {formatur.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            isElected
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-amber-50 text-amber-800 font-semibold border border-amber-200'
                          }`}
                        >
                          Ranking #{originalIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="font-bold text-slate-900">{formatur.votes_count} Suara</span>
                        <span className="text-slate-500 text-[11px]">({percentage}%)</span>
                      </div>
                    </div>

                    {/* Horizontal Bar with animation and vibrant colors for all formaturs */}
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex shadow-inner p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isElected
                            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 shadow-xs'
                            : 'bg-gradient-to-r from-amber-400 to-amber-300 shadow-2xs'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Tabel Hasil Perolehan Suara & Peringkat</h2>
              <p className="text-xs text-slate-500">Urutan peringkat suara calon formatur terpilih</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullScreen}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-950 font-semibold text-xs border border-slate-200 transition-colors shadow-2xs"
                title="Tampilkan tabel dalam layar penuh"
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Layar Penuh</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1 rounded-lg border border-amber-200">
                <Trophy className="w-3.5 h-3.5 text-amber-700" />
                <span>Kuorum: {requiredChoices} Formatur Terpilih</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4 w-20 text-center">No. Urut</th>
                  <th className="py-3 px-4">Nama Calon Formatur</th>
                  <th className="py-3 px-4 w-28 text-right">Perolehan Suara</th>
                  <th className="py-3 px-4 w-24 text-right">Persentase</th>
                  <th className="py-3 px-4 w-36 text-center">Status Formatur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedFormaturs.map((item, idx) => {
                  const isElected =
                    totalVotesCast > 0 &&
                    idx < requiredChoices &&
                    (item.votes_count || 0) > 0;
                  const pct = totalVotesCast > 0 ? ((item.votes_count / totalVotesCast) * 100).toFixed(1) : '0';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        isElected ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold">
                        {idx + 1 === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black shadow-xs">
                            1
                          </span>
                        ) : isElected ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-950 font-bold border border-amber-300 shadow-2xs">
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-semibold">
                            {idx + 1}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {String(item.number).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            style={{ objectPosition: item.photo_position || '50% 20%' }}
                          />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {item.votes_count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {pct}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isElected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            <span>Terpilih Formatur</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Tidak Terpilih
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Navigation & Action Bar */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Kendali Rekapitulasi Panlih</p>
            <p className="text-[11px] text-slate-500">
              Navigasi langsung kembali ke beranda admin tanpa keluar dari portal.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenBeritaAcara}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Cetak Berita Acara (PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminActiveTab('dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Admin</span>
          </button>
        </div>
      </div>

      {/* Official Berita Acara Modal Preview & Export */}
      <BeritaAcaraModal
        isOpen={showBeritaAcara}
        onClose={() => setShowBeritaAcara(false)}
        formaturs={formaturs}
        stats={stats}
        settings={settings}
      />
    </div>
  );
};
