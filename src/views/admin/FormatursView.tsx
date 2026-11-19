import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../lib/dbService';
import { Formatur } from '../../types';
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  Eye,
  AlertTriangle,
  Image as ImageIcon,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Target,
  Maximize2,
  Check,
  User,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { compressImageFile, formatFileSize } from '../../lib/imageUtils';

export const FormatursView: React.FC = () => {
  const { formaturs, refreshData, settings, setAdminActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDetailItem, setViewDetailItem] = useState<Formatur | null>(null);
  const [editingItem, setEditingItem] = useState<Formatur | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string>('');
  const [bannerError, setBannerError] = useState<string>('');

  // Dedicated Photo Position Adjustment Modal State
  const [positionModalItem, setPositionModalItem] = useState<Formatur | null>(null);
  const [posModalX, setPosModalX] = useState<number>(50);
  const [posModalY, setPosModalY] = useState<number>(20);
  const [posModalScale, setPosModalScale] = useState<number>(1.0);
  const [savingPosition, setSavingPosition] = useState(false);
  const [posError, setPosError] = useState<string>('');

  // Form states for Add / Edit
  const [formNumber, setFormNumber] = useState<number>(1);
  const [formName, setFormName] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [formPosX, setFormPosX] = useState<number>(50);
  const [formPosY, setFormPosY] = useState<number>(20);
  const [formScale, setFormScale] = useState<number>(1.0);
  const [formVision, setFormVision] = useState('');
  const [formMission, setFormMission] = useState('');
  const [formBio, setFormBio] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Parse object position string e.g. "50% 20%" to numbers
  const parsePos = (posStr?: string): { x: number; y: number } => {
    if (!posStr) return { x: 50, y: 20 };
    const parts = posStr.trim().split(' ');
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]) || 50;
      const y = parseFloat(parts[1]) || 20;
      return { x, y };
    }
    return { x: 50, y: 20 };
  };

  // Suggested next number
  const getNextNumber = () => {
    if (formaturs.length === 0) return 1;
    return Math.max(...formaturs.map((f) => f.number)) + 1;
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormNumber(getNextNumber());
    setFormName('');
    setFormPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80');
    setFormPosX(50);
    setFormPosY(20);
    setFormScale(1.0);
    setFormVision('');
    setFormMission('');
    setFormBio('');
    setErrorMsg('');
    setPhotoUploadSuccess('');
    setUploadingPhoto(false);
    setShowUrlInput(false);
    setModalOpen(true);
  };

  const openEditModal = (item: Formatur) => {
    setEditingItem(item);
    setFormNumber(item.number);
    setFormName(item.name);
    setFormPhotoUrl(item.photo_url || '');
    const { x, y } = parsePos(item.photo_position);
    setFormPosX(x);
    setFormPosY(y);
    setFormScale(item.photo_scale || 1.0);
    setFormVision(item.vision);
    setFormMission(item.mission);
    setFormBio(item.bio || '');
    setErrorMsg('');
    setPhotoUploadSuccess('');
    setUploadingPhoto(false);
    setShowUrlInput(!item.photo_url?.startsWith('data:'));
    setModalOpen(true);
  };

  // Open Quick Position Modal
  const openPositionModal = (item: Formatur) => {
    setPositionModalItem(item);
    const { x, y } = parsePos(item.photo_position);
    setPosModalX(x);
    setPosModalY(y);
    setPosModalScale(item.photo_scale || 1.0);
    setPosError('');
  };

  const handleSaveQuickPosition = async () => {
    if (!positionModalItem) return;
    setSavingPosition(true);
    setPosError('');
    try {
      const newPosStr = `${posModalX}% ${posModalY}%`;
      await dbService.updateFormatur(positionModalItem.id, {
        photo_position: newPosStr,
        photo_scale: posModalScale,
      });
      await refreshData();
      const candName = positionModalItem.name;
      setPositionModalItem(null); // Kembali ke tampilan manajemen formatur
      setSuccessBanner(`Posisi foto formatur "${candName}" berhasil disimpan! Kembali ke tampilan manajemen formatur.`);
      setTimeout(() => setSuccessBanner(''), 4500);
    } catch (e: any) {
      console.error(e);
      setPosError(e?.message || 'Gagal menyimpan posisi foto ke Supabase.');
    } finally {
      setSavingPosition(false);
    }
  };

  // Handle local file image upload with automatic compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value on input element so re-picking the same file works
    const inputEl = e.target;

    // Mendukung foto hingga 10MB karena dikompres otomatis di browser
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`Ukuran berkas (${formatFileSize(file.size)}) melebihi batas maksimal 10MB!`);
      inputEl.value = '';
      return;
    }

    setUploadingPhoto(true);
    setErrorMsg('');
    setPhotoUploadSuccess('');

    try {
      // Kompres otomatis menjadi JPEG optimal (< 80KB)
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 1000,
        quality: 0.82,
      });

      setFormPhotoUrl(compressedDataUrl);
      setPhotoUploadSuccess(`Foto berhasil diunggah (${formatFileSize(file.size)} dioptimalkan)!`);
      setTimeout(() => setPhotoUploadSuccess(''), 4500);
    } catch (err: any) {
      console.error('Image compression error:', err);
      setErrorMsg(err?.message || 'Gagal memproses berkas foto. Pastikan format file gambar JPG/PNG/WEBP.');
    } finally {
      setUploadingPhoto(false);
      inputEl.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formName.trim() || !formVision.trim() || !formMission.trim()) {
      setErrorMsg('Nama, Visi, dan Misi Formatur wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const posString = `${formPosX}% ${formPosY}%`;
      if (editingItem) {
        await dbService.updateFormatur(editingItem.id, {
          number: Number(formNumber),
          name: formName.trim(),
          photo_url: formPhotoUrl.trim(),
          photo_position: posString,
          photo_scale: Number(formScale),
          vision: formVision.trim(),
          mission: formMission.trim(),
          bio: formBio.trim(),
        });
      } else {
        await dbService.createFormatur({
          number: Number(formNumber),
          name: formName.trim(),
          photo_url: formPhotoUrl.trim(),
          photo_position: posString,
          photo_scale: Number(formScale),
          vision: formVision.trim(),
          mission: formMission.trim(),
          bio: formBio.trim(),
        });
      }
      await refreshData();
      const candName = formName.trim();
      setModalOpen(false); // Kembali ke tampilan manajemen formatur
      setSuccessBanner(`Data calon formatur "${candName}" berhasil disimpan! Kembali ke tampilan manajemen formatur.`);
      setTimeout(() => setSuccessBanner(''), 4500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan calon formatur.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setBannerError('');
    try {
      await dbService.deleteFormatur(deleteId);
      await refreshData();
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      setDeleteId(null);
      setBannerError(err?.message || 'Gagal menghapus calon formatur dari Supabase.');
    }
  };

  const filteredFormaturs = formaturs.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(f.number).includes(searchTerm) ||
      f.vision.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar with Exit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-600" />
            <span>Manajemen Calon Formatur</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-1.5 font-normal">
            <span>
              Total <span className="font-semibold text-slate-800">{formaturs.length}</span> Calon Formatur
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-medium text-[11px]">
              ({settings.max_formatur_choices} akan dipilih oleh pemilih)
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAdminActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-400 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-2xs group shrink-0"
            title="Keluar dari Manajemen Calon Formatur dan kembali ke Beranda Panlih"
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
            <span>Tambah Calon Formatur</span>
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor urut, nama, visi formatur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="text-slate-800">{filteredFormaturs.length}</strong> Formatur
        </div>
      </div>

      {/* Grid of Candidate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFormaturs.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between"
          >
            {/* Candidate Header with Image & Number Badge */}
            <div className="relative h-72 sm:h-80 bg-slate-950 overflow-hidden">
              <img
                src={item.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'}
                alt={item.name}
                className="w-full h-full object-cover transition-all duration-300"
                style={{
                  objectPosition: item.photo_position || '50% 20%',
                  transform: item.photo_scale ? `scale(${item.photo_scale})` : undefined,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Number Urut Badge */}
              <div className="absolute top-3 left-3 w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-md">
                {String(item.number).padStart(2, '0')}
              </div>

              {/* Quick Adjust Photo Button over image */}
              <button
                type="button"
                onClick={() => openPositionModal(item)}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-amber-300 hover:text-white hover:bg-slate-900 text-[11px] font-bold border border-white/20 shadow-md transition-all"
                title="Atur posisi geser atas/bawah/kiri/kanan agar pas di frame"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Atur Posisi Foto</span>
              </button>

              {/* Current Votes Badge */}
              <div className="absolute bottom-16 right-3 px-2.5 py-1 rounded-lg bg-slate-900/70 backdrop-blur-xs text-white text-xs font-bold border border-white/20">
                {item.votes_count || 0} Suara
              </div>

              {/* Name over bottom of image */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="font-extrabold text-base tracking-tight leading-tight line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-[11px] text-amber-300 font-medium line-clamp-1">
                  {item.bio || 'Calon Formatur IPM'}
                </p>
              </div>
            </div>

            {/* Content Body: Vision & Mission snippet */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
              <div>
                <div className="mb-2">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-0.5">
                    Visi Utama:
                  </span>
                  <p className="text-slate-600 italic line-clamp-2 leading-relaxed">
                    "{item.vision}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewDetailItem(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold transition-colors text-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lihat Visi & Misi</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openPositionModal(item)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Geser / Pas Foto Frame"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Edit Data"
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Exit Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Award className="w-4 h-4 text-amber-600" />
          <span>Selesai mengelola calon formatur? Kembali ke Beranda Panlih tanpa logout.</span>
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

      {/* QUICK PHOTO POSITION ADJUSTMENT MODAL */}
      {positionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Atur Posisi Foto: {positionModalItem.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Nomor Urut {positionModalItem.number} · Geser foto agar pas di frame
                  </p>
                </div>
              </div>

              {/* Top Quick Finish & Close Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingPosition}
                  onClick={handleSaveQuickPosition}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Selesai & Simpan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPositionModalItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                  title="Tutup & Batal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {posError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold">
                  {posError}
                </div>
              )}
              {/* Petunjuk / Instruksi Selesai */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-slate-900 text-xs">Instruksi Selesai:</span>
                  <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                    1. Gunakan tombol panah atau slider di bawah untuk menggeser posisi foto.<br />
                    2. Setelah posisi foto sesuai, klik tombol <strong>"SELESAI & SIMPAN"</strong> (di atas atau tombol hijau di bawah) untuk menyimpan dan otomatis kembali ke halaman manajemen formatur.
                  </p>
                </div>
              </div>

              {/* Interactive Preview Frame */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Pratinjau Langsung di Frame Kartu
                </span>
                <div className="w-56 h-64 rounded-2xl bg-slate-950 overflow-hidden relative shadow-lg border-4 border-amber-400">
                  <img
                    src={positionModalItem.photo_url || ''}
                    alt={positionModalItem.name}
                    className="w-full h-full object-cover transition-all"
                    style={{
                      objectPosition: `${posModalX}% ${posModalY}%`,
                      transform: `scale(${posModalScale})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-bold truncate">
                    {positionModalItem.name}
                  </div>
                </div>

                {/* Tombol Cepat Selesai tepat di bawah foto preview */}
                <button
                  type="button"
                  disabled={savingPosition}
                  onClick={handleSaveQuickPosition}
                  className="mt-3 w-full max-w-xs flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingPosition ? 'Menyimpan...' : 'Posisi Sudah Pas? Klik Selesai Disini'}</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="font-bold text-slate-700 block mb-2 text-[11px] uppercase tracking-wider">
                  Preset Cepat:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPosModalX(50);
                      setPosModalY(15);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 font-semibold text-slate-700 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pas Wajah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosModalX(50);
                      setPosModalY(50);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 font-semibold text-slate-700 transition-colors"
                  >
                    <Target className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tengah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosModalX(50);
                      setPosModalY(0);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 font-semibold text-slate-700 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Paling Atas</span>
                  </button>
                </div>
              </div>

              {/* Directional Nudge Pad (Geser Kiri/Kanan/Atas/Bawah) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Navigasi Geser (Klik Tombol Panah):
                </span>
                <div className="grid grid-cols-3 gap-1.5 w-36">
                  <div />
                  <button
                    type="button"
                    onClick={() => setPosModalY((prev) => Math.max(0, prev - 5))}
                    className="p-2 bg-white hover:bg-amber-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-800"
                    title="Geser Ke Atas"
                  >
                    <ArrowUp className="w-4 h-4 text-amber-700" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => setPosModalX((prev) => Math.max(0, prev - 5))}
                    className="p-2 bg-white hover:bg-amber-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-800"
                    title="Geser Ke Kiri"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosModalX(50);
                      setPosModalY(50);
                    }}
                    className="p-2 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs flex items-center justify-center font-bold text-slate-950 text-[10px]"
                    title="Reset Tengah"
                  >
                    Tengah
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosModalX((prev) => Math.min(100, prev + 5))}
                    className="p-2 bg-white hover:bg-amber-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-800"
                    title="Geser Ke Kanan"
                  >
                    <ArrowRight className="w-4 h-4 text-amber-700" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => setPosModalY((prev) => Math.min(100, prev + 5))}
                    className="p-2 bg-white hover:bg-amber-100 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center font-bold text-slate-800"
                    title="Geser Ke Bawah"
                  >
                    <ArrowDown className="w-4 h-4 text-amber-700" />
                  </button>
                  <div />
                </div>
              </div>

              {/* Precision Sliders */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Geser Horisontal (Kiri - Kanan):</span>
                    <span className="font-mono text-amber-700">{posModalX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posModalX}
                    onChange={(e) => setPosModalX(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Geser Vertikal (Atas - Bawah):</span>
                    <span className="font-mono text-amber-700">{posModalY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={posModalY}
                    onChange={(e) => setPosModalY(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Perbesar / Skala Zoom:</span>
                    <span className="font-mono text-amber-700">{posModalScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="1.8"
                    step="0.05"
                    value={posModalScale}
                    onChange={(e) => setPosModalScale(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <button
                type="button"
                onClick={() => setPositionModalItem(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batal & Kembali ke Manajemen Formatur</span>
              </button>
              <button
                type="button"
                disabled={savingPosition}
                onClick={handleSaveQuickPosition}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-md"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>{savingPosition ? 'Menyimpan...' : '✓ SELESAI & SIMPAN (KEMBALI KE MANAJEMEN)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Formatur Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingItem ? 'Edit Calon Formatur' : 'Tambah Calon Formatur Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Urut <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap Formatur <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Calon"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Photo Input (URL + Local File Upload) with Position Adjuster */}
              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Foto Formatur & Pengaturan Posisi Frame
                  </label>
                  {uploadingPhoto && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mengompres foto...
                    </span>
                  )}
                  {photoUploadSuccess && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {photoUploadSuccess}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-20 h-24 rounded-xl border border-slate-300 overflow-hidden bg-slate-900 shrink-0 relative shadow-inner">
                    {formPhotoUrl ? (
                      <img
                        src={formPhotoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${formPosX}% ${formPosY}%`,
                          transform: `scale(${formScale})`,
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400 m-auto mt-8" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl cursor-pointer font-bold text-xs shadow-xs transition-colors">
                        {uploadingPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingPhoto ? 'Memproses Berkas...' : 'Unggah Foto dari Komputer / HP'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingPhoto}
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold underline underline-offset-2"
                      >
                        {showUrlInput ? 'Tutup Input URL' : 'Atau gunakan URL online'}
                      </button>
                    </div>

                    {formPhotoUrl && formPhotoUrl.startsWith('data:') && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Foto berkas lokal terpasang & teroptimasi</span>
                      </div>
                    )}

                    {showUrlInput && (
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Masukkan URL Foto (https://...)"
                          value={formPhotoUrl.startsWith('data:') ? '' : formPhotoUrl}
                          onChange={(e) => setFormPhotoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 bg-white text-xs"
                        />
                        <p className="text-[10px] text-slate-500">
                          Masukkan URL gambar online langsung (JPG/PNG/WebP)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Position Adjuster within form */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Atur Posisi (Geser Kiri/Kanan/Atas/Bawah):</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormPosX(50);
                          setFormPosY(18);
                        }}
                        className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[10px]"
                      >
                        Pas Wajah
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormPosX(50);
                          setFormPosY(50);
                        }}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-[10px]"
                      >
                        Tengah
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="flex justify-between text-slate-500 mb-0.5">
                        <span>Horisontal (X):</span>
                        <span className="font-mono">{formPosX}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formPosX}
                        onChange={(e) => setFormPosX(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-500 mb-0.5">
                        <span>Vertikal (Y):</span>
                        <span className="font-mono">{formPosY}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formPosY}
                        onChange={(e) => setFormPosY(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biodata / Pengalaman Organisasi Singkat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kabid Perkaderan PC IPM Lowokwaru"
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Visi Calon <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ketik visi utama calon formatur..."
                  value={formVision}
                  onChange={(e) => setFormVision(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Misi Calon <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="1. Misi pertama&#10;2. Misi kedua&#10;3. Misi ketiga"
                  value={formMission}
                  onChange={(e) => setFormMission(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-sans focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Batal & Kembali ke Manajemen Formatur</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>{submitting ? 'Menyimpan...' : 'Selesai & Kembali ke Manajemen Formatur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (Visi & Misi) */}
      {viewDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  {viewDetailItem.number}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{viewDetailItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
              {viewDetailItem.bio && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block mb-0.5">Biodata & Riwayat:</span>
                  <p>{viewDetailItem.bio}</p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px] text-amber-800">
                  Visi Calon:
                </span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                  {viewDetailItem.vision}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px] text-amber-800">
                  Misi Calon:
                </span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed">
                  {viewDetailItem.mission}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewDetailItem(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
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
            <h3 className="text-base font-bold text-slate-900 mb-1">Hapus Calon Formatur?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Calon formatur ini akan dihapus dari daftar bilik suara musyawarah.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
