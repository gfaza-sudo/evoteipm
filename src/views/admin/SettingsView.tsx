import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { hashPassword, SUPABASE_URL } from '../../lib/supabase';
import { dbService } from '../../lib/dbService';
import {
  Settings,
  Shield,
  Building,
  Save,
  CheckCircle2,
  Database,
  ExternalLink,
  Code2,
  Upload,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { SQLGuideModal } from '../../components/common/SQLGuideModal';
import { compressImageFile } from '../../lib/imageUtils';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, dbStatus, refreshData } = useApp();
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showResetVotesModal, setShowResetVotesModal] = useState(false);
  const [resettingVotes, setResettingVotes] = useState(false);
  const [checkingDb, setCheckingDb] = useState(false);

  // Organisasi states
  const [orgName, setOrgName] = useState(settings.org_name);
  const [orgPeriod, setOrgPeriod] = useState(settings.org_period);
  const [orgLogo, setOrgLogo] = useState(settings.org_logo);
  const [orgLogoAspect, setOrgLogoAspect] = useState<'rectangle' | 'square'>(settings.org_logo_aspect || 'rectangle');
  const [orgLogoFit, setOrgLogoFit] = useState<'contain' | 'cover'>(settings.org_logo_fit || 'contain');
  const [maxChoices, setMaxChoices] = useState(settings.max_formatur_choices || 7);

  // Keep local form states in sync whenever settings change in context
  useEffect(() => {
    setOrgName(settings.org_name || '');
    setOrgPeriod(settings.org_period || '');
    setOrgLogo(settings.org_logo || '');
    setOrgLogoAspect(settings.org_logo_aspect || 'rectangle');
    setOrgLogoFit(settings.org_logo_fit || 'contain');
    setMaxChoices(settings.max_formatur_choices || 7);
    setAdminUsername(settings.admin_username || 'admin');
  }, [settings]);

  // Admin Credentials states
  const [adminUsername, setAdminUsername] = useState(settings.admin_username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Handle local image upload for logo with compression
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.target;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file logo maksimal 10MB!');
      inputEl.value = '';
      return;
    }

    setUploadingLogo(true);
    setErrorMsg('');
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });
      setOrgLogo(compressed);
      setSuccessMsg('Logo berhasil diunggah & dioptimalkan!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses gambar logo.');
    } finally {
      setUploadingLogo(false);
      inputEl.value = '';
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSaving(true);

    try {
      await updateSettings({
        org_name: orgName.trim(),
        org_period: orgPeriod.trim(),
        org_logo: orgLogo.trim(),
        org_logo_aspect: orgLogoAspect,
        org_logo_fit: orgLogoFit,
        max_formatur_choices: Number(maxChoices),
      });
      await refreshData();
      setSuccessMsg('Pengaturan identitas organisasi & logo berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan pengaturan organisasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAllVotes = async () => {
    setResettingVotes(true);
    setErrorMsg('');
    try {
      await dbService.resetAllVotes();
      await refreshData();
      setShowResetVotesModal(false);
      setSuccessMsg('Seluruh suara berhasil direset ke 0! Data perolehan suara kembali bersih.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setShowResetVotesModal(false);
      setErrorMsg(err?.message || 'Gagal mereset perolehan suara.');
    } finally {
      setResettingVotes(false);
    }
  };

  const handleSaveAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!adminUsername.trim()) {
      setErrorMsg('Username admin tidak boleh kosong!');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok!');
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        admin_username: adminUsername.trim(),
      };

      if (newPassword) {
        updates.admin_password_hash = await hashPassword(newPassword.trim());
      }

      await updateSettings(updates);
      setSuccessMsg('Kredensial Administrator berhasil diperbarui!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengubah password administrator.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Bar */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-amber-600" />
          <span>Pengaturan Sistem & Organisasi</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi identitas musyawarah, aturan pemilihan formatur, dan kredensial panitia
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Database Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Status Database Supabase</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  dbStatus.tablesReady
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {dbStatus.tablesReady ? 'Online & Terhubung' : 'Siap Sinkronisasi'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              URL: <span className="font-mono text-slate-700">{SUPABASE_URL}</span>
            </p>
            {dbStatus.error && !dbStatus.tablesReady && (
              <p className="text-[11px] text-amber-700 mt-1">{dbStatus.error}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={checkingDb}
            onClick={async () => {
              setCheckingDb(true);
              await refreshData();
              setCheckingDb(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${checkingDb ? 'animate-spin' : ''}`} />
            <span>Cek Koneksi</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Buka Skrip SQL Supabase</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form: Identitas Organisasi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-sm">Identitas & Periode Organisasi</h2>
          </div>

          <form onSubmit={handleSaveOrganization} noValidate className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Organisasi / Pelaksana Musyawarah
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Periode Organisasi
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Periode 2026 - 2028"
                value={orgPeriod}
                onChange={(e) => setOrgPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Pengaturan Logo Organisasi & Format Kolom */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">
                  Logo Organisasi (Format Persegi Panjang / Pas Kolom)
                </label>
                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Auto-Fit Kolom
                </span>
              </div>

              {/* Rectangular Preview Container */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Pratinjau Kolom Logo:</span>
                  <span>{orgLogoAspect === 'rectangle' ? 'Format Persegi Panjang (Landscape)' : 'Format Bujur Sangkar'}</span>
                </div>

                <div
                  className={`mx-auto rounded-xl border-2 border-dashed border-amber-300 bg-white flex items-center justify-center p-2.5 overflow-hidden transition-all shadow-inner ${
                    orgLogoAspect === 'rectangle'
                      ? 'h-24 w-full sm:w-80'
                      : 'w-24 h-24'
                  }`}
                >
                  {orgLogo ? (
                    <img
                      src={orgLogo}
                      alt="Logo Pratinjau"
                      className={`transition-all duration-200 ${
                        orgLogoFit === 'cover'
                          ? 'w-full h-full object-cover'
                          : 'max-h-full max-w-full object-contain'
                      }`}
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">Belum Ada Logo</span>
                    </div>
                  )}
                </div>

                {/* Logo Frame & Fit Adjustments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      Bentuk Kolom:
                    </span>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOrgLogoAspect('rectangle')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-colors ${
                          orgLogoAspect === 'rectangle'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Persegi Panjang
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrgLogoAspect('square')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-colors ${
                          orgLogoAspect === 'square'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Bujur Sangkar
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      Kesesuaian Gambar (Fit):
                    </span>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setOrgLogoFit('contain')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-colors ${
                          orgLogoFit === 'contain'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Gambar utuh terlihat tanpa terpotong (Rekomendasi)"
                      >
                        Pas Kolom
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrgLogoFit('cover')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-colors ${
                          orgLogoFit === 'cover'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Gambar mengisi penuh kotak kolom"
                      >
                        Penuh Kolom
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload & Controls */}
                <div className="space-y-2 pt-1 border-t border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl cursor-pointer font-bold text-xs shadow-xs transition-colors">
                      {uploadingLogo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingLogo ? 'Mengoptimalkan...' : 'Unggah Logo Gambar'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingLogo}
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setOrgLogo('https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80');
                        setOrgLogoAspect('rectangle');
                        setOrgLogoFit('contain');
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Reset Logo IPM Default
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Atau tempel URL gambar logo eksternal di sini..."
                    value={orgLogo.startsWith('data:') ? 'Logo terunggah secara lokal (Teroptimasi)' : orgLogo}
                    onChange={(e) => setOrgLogo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    Mendukung semua format gambar (PNG transparan, JPG, WebP, SVG). Gambar akan disesuaikan otomatis agar pas dengan kolom navbar, bilik suara, dan berita acara.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Formatur yang Dipilih Setiap Pemilih
              </label>
              <input
                type="number"
                min={1}
                max={9}
                required
                value={maxChoices}
                onChange={(e) => setMaxChoices(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sesuai ketentuan Musyawarah IPM: memilih 7 dari 9 formatur.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-colors shadow-xs"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Simpan Identitas Organisasi</span>
              </button>
            </div>
          </form>
        </div>

        {/* Form: Akun Administrator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-sm">Akun & Kredensial Administrator</h2>
          </div>

          <form onSubmit={handleSaveAdminCredentials} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username Admin
              </label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1">
              <span className="font-semibold block text-slate-700">Ubah Password Administrator:</span>
              <p className="text-[11px]">
                Biarkan kolom password kosong jika tidak ingin mengubah password saat ini.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ulangi Password Baru
              </label>
              <input
                type="password"
                placeholder="Ketik ulang password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Simpan Kredensial Admin</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Zona Panlih: Reset Simulasi Pemilihan */}
      <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Zona Panlih: Sinkronisasi & Reset Simulasi Suara</h2>
            <p className="text-xs text-slate-500">Mulai ulang seluruh perolehan suara menjadi 0 sebelum hari-H pemungutan suara resmi</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-50/60 rounded-xl border border-rose-100 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-rose-950 block">Bersihkan Data Uji Coba (Reset ke 0 Suara)</span>
            <p className="text-rose-800/90 leading-relaxed max-w-xl text-[11px]">
              Tindakan ini akan mengembalikan status seluruh pemilih menjadi <strong>Belum Memilih</strong> dan menghitung ulang seluruh perolehan suara formatur ke <strong>0</strong> secara sinkron. Data akun DPT dan formatur tetap aman.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetVotesModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shrink-0 transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Seluruh Suara ke 0</span>
          </button>
        </div>
      </div>

      {/* Reset Votes Confirmation Modal */}
      {showResetVotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Seluruh Suara Pemilihan?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Semua surat suara simulasi akan dihapus, seluruh pemilih dapat memilih ulang, dan grafik batang formatur kembali ke 0 suara.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetVotesModal(false)}
                disabled={resettingVotes}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetAllVotes}
                disabled={resettingVotes}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {resettingVotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{resettingVotes ? 'Mereset...' : 'Ya, Bersihkan & Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <SQLGuideModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} />
    </div>
  );
};
