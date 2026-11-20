import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../lib/dbService';
import { PimpinanAsal } from '../../types';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Users,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export const PimpinanView: React.FC = () => {
  const { pimpinanList, voters, refreshData, setAdminActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PimpinanAsal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick adjust voter modal
  const [adjustModalItem, setAdjustModalItem] = useState<PimpinanAsal | null>(null);
  const [adjustTargetCount, setAdjustTargetCount] = useState<number>(3);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVoterCount, setFormVoterCount] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Voter count lookup by pimpinan
  const getVoterCount = (pimpinanId: string) => {
    return voters.filter((v) => v.pimpinan_id === pimpinanId).length;
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormCode('');
    setFormName('');
    setFormDesc('');
    setFormVoterCount(3);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item: PimpinanAsal) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormDesc(item.description || '');
    setFormVoterCount(getVoterCount(item.id));
    setErrorMsg('');
    setModalOpen(true);
  };

  const openQuickAdjustModal = (item: PimpinanAsal) => {
    setAdjustModalItem(item);
    setAdjustTargetCount(getVoterCount(item.id));
    setAdjustError('');
  };

  const handleQuickAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    setAdjustLoading(true);
    setAdjustError('');
    try {
      await dbService.adjustVoterCountForPimpinan(adjustModalItem.id, adjustTargetCount);
      await refreshData();
      const pName = adjustModalItem.name;
      setAdjustModalItem(null);
      setSuccessBanner(`Jumlah pemilih untuk "${pName}" berhasil disesuaikan menjadi ${adjustTargetCount}!`);
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err: any) {
      console.error(err);
      setAdjustError(err?.message || 'Gagal menyesuaikan jumlah pemilih di Supabase.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formCode.trim() || !formName.trim()) {
      setErrorMsg('Kode dan Nama Pimpinan wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await dbService.updatePimpinan(editingItem.id, {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          description: formDesc.trim(),
          voter_quota: Number(formVoterCount),
        });
        // Sesuaikan jumlah pemilih jika ada perubahan
        await dbService.adjustVoterCountForPimpinan(editingItem.id, Number(formVoterCount));
      } else {
        const created = await dbService.createPimpinan({
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          description: formDesc.trim(),
          voter_quota: Number(formVoterCount),
        });
        // Buat akun pemilih untuk pimpinan baru sesuai jumlah yang dimasukkan
        if (formVoterCount > 0) {
          await dbService.adjustVoterCountForPimpinan(created.id, Number(formVoterCount));
        }
      }
      await refreshData();
      const savedName = formName.trim();
      setModalOpen(false);
      setSuccessBanner(`Data asal pimpinan "${savedName}" berhasil disimpan!`);
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setBannerError('');
    try {
      await dbService.deletePimpinan(deleteId);
      await refreshData();
      setDeleteId(null);
      setSuccessBanner('Data asal pimpinan beserta akun pemilih terkait di DPT berhasil dihapus.');
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err: any) {
      console.error(err);
      setDeleteId(null);
      setBannerError(err?.message || 'Gagal menghapus data asal pimpinan dari Supabase.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredList = pimpinanList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Bar with Exit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-600" />
            <span>Manajemen Asal Pimpinan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar Cabang, Ranting, dan Pengaturan Jumlah Alokasi Pemilih Utusan Musyawarah IPM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAdminActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-400 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-2xs group shrink-0"
            title="Keluar dari Manajemen Asal Pimpinan dan kembali ke Beranda Panlih"
          >
            <ArrowLeft className="w-4 h-4 text-amber-600 group-hover:-translate-x-1 transition-transform" />
            <span>Keluar ke Beranda</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Asal Pimpinan</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAdminActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
              title="Selesai dan kembali ke Beranda Panlih"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Keluar ke Beranda</span>
            </button>
            <button
              type="button"
              onClick={() => setSuccessBanner('')}
              className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {bannerError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{bannerError}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerError('')}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Stats Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode atau nama pimpinan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="text-xs text-slate-500 self-end sm:self-center">
          Total: <strong className="text-slate-800">{filteredList.length}</strong> Pimpinan
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">Kode</th>
                <th className="py-3 px-4">Nama Pimpinan</th>
                <th className="py-3 px-4">Deskripsi / Keterangan</th>
                <th className="py-3 px-4 w-44 text-center">Jumlah Pemilih</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data pimpinan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const voterCount = getVoterCount(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            <span>{voterCount} Pemilih</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openQuickAdjustModal(item)}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-100/70 hover:bg-amber-200 rounded-lg transition-colors"
                            title="Ubah Jumlah Pemilih untuk Pimpinan ini"
                          >
                            Ubah
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit Data Pimpinan & Jumlah Pemilih"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Exit Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>Selesai mengelola asal pimpinan & kuota pemilih? Kembali ke Beranda Panlih tanpa logout.</span>
        </div>
        <button
          type="button"
          onClick={() => setAdminActiveTab('dashboard')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Selesai & Keluar ke Beranda</span>
        </button>
      </div>

      {/* Quick Adjust Voter Count Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Ubah Jumlah Pemilih
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAdjustSubmit} className="p-5 space-y-4 text-xs">
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold">
                  {adjustError}
                </div>
              )}
              <div>
                <span className="text-slate-500 block mb-1">Nama Pimpinan:</span>
                <p className="font-bold text-slate-900 text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {adjustModalItem.name} ({adjustModalItem.code})
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Jumlah Pemilih (Utusan)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustTargetCount((prev) => Math.max(0, prev - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-base flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={adjustTargetCount}
                    onChange={(e) => setAdjustTargetCount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 text-center py-2 px-3 border border-slate-200 rounded-xl font-black text-base focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustTargetCount((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-base flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Jika jumlah ditambah, akun pemilih baru akan dibuat otomatis (contoh: <code>{adjustModalItem.code}-00X</code>). Jika dikurangi, akun pemilih yang belum memilih akan disesuaikan.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs"
                >
                  {adjustLoading ? 'Memproses...' : 'Simpan Jumlah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingItem ? 'Edit Asal Pimpinan' : 'Tambah Asal Pimpinan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Pimpinan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PC-KLJ atau PR-SMA"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pimpinan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PC IPM Klojen"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Input Jumlah Pemilih per Pimpinan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Jumlah Pemilih (Kuota Utusan) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-amber-700 font-normal">Otomatis buat akun pemilih</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormVoterCount((prev) => Math.max(0, prev - 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-sm flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formVoterCount}
                    onChange={(e) => setFormVoterCount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 text-center py-2 px-3 border border-slate-200 rounded-xl font-bold text-sm focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormVoterCount((prev) => prev + 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-sm flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Jumlah akun pemilih utusan yang dialokasikan untuk pimpinan ini.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat pimpinan..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Hapus Asal Pimpinan?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Seluruh akun pemilih yang terdaftar pada pimpinan{' '}
              <strong className="text-slate-700">
                {pimpinanList.find((p) => p.id === deleteId)?.name || 'ini'}
              </strong>{' '}
              ({getVoterCount(deleteId)} pemilih) di Daftar Pemilih Tetap (DPT) juga akan ikut terhapus secara otomatis.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
