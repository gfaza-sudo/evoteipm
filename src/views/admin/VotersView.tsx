import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { dbService } from '../../lib/dbService';
import { Voter } from '../../types';
import {
  Users,
  Plus,
  Minus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  KeyRound,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
} from 'lucide-react';

type VoterSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'user_id_asc'
  | 'user_id_desc'
  | 'pimpinan_asc'
  | 'pimpinan_desc'
  | 'status_voted_first'
  | 'status_not_voted_first'
  | 'newest';

const VOTER_SORT_OPTIONS: { value: VoterSortOption; label: string; shortLabel: string }[] = [
  { value: 'name_asc', label: 'Nama Lengkap (A - Z)', shortLabel: 'Nama (A-Z)' },
  { value: 'name_desc', label: 'Nama Lengkap (Z - A)', shortLabel: 'Nama (Z-A)' },
  { value: 'user_id_asc', label: 'User ID (A - Z / 0 - 9)', shortLabel: 'User ID (A-Z)' },
  { value: 'user_id_desc', label: 'User ID (Z - A / 9 - 0)', shortLabel: 'User ID (Z-A)' },
  { value: 'pimpinan_asc', label: 'Asal Pimpinan (A - Z)', shortLabel: 'Pimpinan (A-Z)' },
  { value: 'pimpinan_desc', label: 'Asal Pimpinan (Z - A)', shortLabel: 'Pimpinan (Z-A)' },
  { value: 'status_voted_first', label: 'Status: Sudah Memilih dulu', shortLabel: 'Sudah Memilih' },
  { value: 'status_not_voted_first', label: 'Status: Belum Memilih dulu', shortLabel: 'Belum Memilih' },
  { value: 'newest', label: 'Terbaru Ditambahkan', shortLabel: 'Terbaru' },
];

const SAMPLE_NAMES_POOL = [
  'Ahmad Fauzi',
  'Budi Santoso',
  'Chairul Anwar',
  'Dimas Prasetyo',
  'Eko Wahyudi',
  'Faisal Rahman',
  'Gunawan Wibowo',
  'Hendra Setiawan',
  'Irfan Hakim',
  'Joko Susilo',
  'Kurniawan Dwi',
  'Lukman Hakim',
  'Muhammad Ridwan',
  'Nur Hidayat',
  'Oki Pratama',
  'Prasetyo Utomo',
  'Qomaruddin Aziz',
  'Rian Hidayatullah',
  'Syahrul Ramadhan',
  'Taufiq Hidayat',
  'Umar Faruq',
  'Wahyu Wicaksono',
  'Yusuf Maulana',
  'Zainal Abidin',
  'Aris Munandar',
  'Bagus Permana',
  'Candra Wijaya',
  'Dedi Suhendar',
  'Erwin Syahputra',
  'Fajar Nugraha',
  'Guruh Pratama',
  'Hadi Sucipto',
  'Ilham Robbani',
  'Jefri Ramadhan',
  'Khaerul Umam',
];

export const VotersView: React.FC = () => {
  const { voters, pimpinanList, refreshData, setAdminActiveTab } = useApp();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'voted' | 'not_voted'>('all');
  const [pimpinanFilter, setPimpinanFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<VoterSortOption>('name_asc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [bannerError, setBannerError] = useState('');

  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sortMenuOpen]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Voter | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetVoterId, setResetVoterId] = useState<string | null>(null);
  const [resettingVote, setResettingVote] = useState(false);
  const [resetError, setResetError] = useState('');

  // Sample management states
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [sampleCount, setSampleCount] = useState<number>(5);
  const [sampleTargetPimpinan, setSampleTargetPimpinan] = useState<string>('');
  const [sampleNameMode, setSampleNameMode] = useState<'realistic' | 'numbered' | 'delegasi'>('realistic');
  const [sampleOperating, setSampleOperating] = useState(false);

  // Form states
  const [formUserId, setFormUserId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('Peserta Musyda');
  const [formPimpinanId, setFormPimpinanId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setFormUserId(`IPM-${new Date().getFullYear()}-${String(voters.length + 1).padStart(3, '0')}`);
    setFormName('');
    setFormPosition('Peserta Musyda');
    setFormPimpinanId(pimpinanList[0]?.id || '');
    setFormPassword('pemilih123');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (item: Voter) => {
    setEditingItem(item);
    setFormUserId(item.user_id);
    setFormName(item.name);
    setFormPosition(item.position);
    setFormPimpinanId(item.pimpinan_id || '');
    setFormPassword(''); // leave blank if no change
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formUserId.trim() || !formName.trim()) {
      setErrorMsg('User ID dan Nama Pemilih wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await dbService.updateVoter(editingItem.id, {
          user_id: formUserId.trim().toUpperCase(),
          name: formName.trim(),
          position: formPosition.trim(),
          pimpinan_id: formPimpinanId || undefined,
          newPasswordPlain: formPassword.trim() ? formPassword.trim() : undefined,
        });
      } else {
        if (!formPassword.trim()) {
          setErrorMsg('Password pemilih wajib diisi saat membuat akun baru!');
          setSubmitting(false);
          return;
        }
        await dbService.createVoter({
          user_id: formUserId.trim().toUpperCase(),
          name: formName.trim(),
          position: formPosition.trim(),
          pimpinan_id: formPimpinanId || undefined,
          passwordPlain: formPassword.trim(),
        });
      }
      await refreshData();
      const savedName = formName.trim();
      setModalOpen(false);
      setSuccessBanner(`Data pemilih "${savedName}" berhasil disimpan!`);
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan data pemilih.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setBannerError('');
    try {
      await dbService.deleteVoter(deleteId);
      await refreshData();
      setDeleteId(null);
      setSuccessBanner('Data pemilih berhasil dihapus.');
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      console.error(err);
      setDeleteId(null);
      setBannerError(err?.message || 'Gagal menghapus data pemilih dari Supabase.');
    }
  };

  const handleResetVote = async () => {
    if (!resetVoterId) return;
    setResettingVote(true);
    setResetError('');
    setBannerError('');
    try {
      await dbService.resetVoterStatus(resetVoterId);
      await refreshData();
      setResetVoterId(null);
      setSuccessBanner('Status hak suara pemilih berhasil direset di Supabase dan data telah diperbarui.');
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      console.error(err);
      const message = err?.message || 'Gagal mereset status hak suara di Supabase.';
      setResetError(message);
      setBannerError(message);
    } finally {
      setResettingVote(false);
    }
  };

  const getPimpinanUserIdPrefix = (pimpinanId?: string) => {
    const target = pimpinanList.find((p) => p.id === pimpinanId) || pimpinanList[0];
    if (!target?.code) return 'IPM';
    const cleaned = target.code
      .trim()
      .replace(/[^a-zA-Z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toUpperCase();
    return cleaned || 'IPM';
  };

  // Sample voters generator and manager
  const handleAddSampleVoters = async (
    countToGenerate: number = 5,
    selectedPimpinanId?: string,
    mode: 'realistic' | 'numbered' | 'delegasi' = sampleNameMode
  ) => {
    setSampleOperating(true);
    setErrorMsg('');
    try {
      const targetPimpinanId = selectedPimpinanId || sampleTargetPimpinan || pimpinanList[0]?.id || undefined;
      const targetPimpinanObj = pimpinanList.find((p) => p.id === targetPimpinanId);
      const userIdPrefix = getPimpinanUserIdPrefix(targetPimpinanId);

      const existingIds = new Set(voters.map((v) => v.user_id.toUpperCase()));
      const existingPimpinanCount = targetPimpinanId
        ? voters.filter((v) => v.pimpinan_id === targetPimpinanId).length
        : voters.length;

      let seq = existingPimpinanCount;
      const existingCount = voters.length;

      for (let i = 0; i < countToGenerate; i++) {
        seq += 1;
        let userId = `${userIdPrefix}-${String(seq).padStart(3, '0')}`;
        while (existingIds.has(userId)) {
          seq += 1;
          userId = `${userIdPrefix}-${String(seq).padStart(3, '0')}`;
        }
        existingIds.add(userId);

        const globalSeq = existingCount + i + 1;
        let voterName = '';
        let voterPosition = 'Peserta Musycab (Sample)';

        if (mode === 'delegasi') {
          const delegasiLabel = targetPimpinanObj?.name || 'Utusan Pimpinan';
          voterName = `Delegasi ${delegasiLabel} #${String(seq).padStart(2, '0')}`;
          voterPosition = `Delegasi ${delegasiLabel}`;
        } else if (mode === 'numbered') {
          voterName = `Peserta Sample #${globalSeq}`;
        } else {
          const poolIndex = (existingCount + i) % SAMPLE_NAMES_POOL.length;
          voterName = SAMPLE_NAMES_POOL[poolIndex];
          if (voters.some((v) => v.name.toLowerCase() === voterName.toLowerCase())) {
            voterName = `${voterName} #${globalSeq}`;
          }
        }

        await dbService.createVoter({
          user_id: userId,
          name: voterName,
          position: voterPosition,
          pimpinan_id: targetPimpinanId,
          passwordPlain: 'pemilih123',
        });
      }

      await refreshData();
      setSuccessBanner(`Berhasil menambahkan ${countToGenerate} peserta sample secara langsung!`);
      setTimeout(() => setSuccessBanner(''), 4000);
      setSampleModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Gagal menambahkan sample pemilih.');
    } finally {
      setSampleOperating(false);
    }
  };

  const handleRemoveSampleVoters = async (countToRemove: number = 5) => {
    setSampleOperating(true);
    setErrorMsg('');
    try {
      const unvoted = voters.filter((v) => !v.has_voted);
      if (unvoted.length === 0) {
        setErrorMsg('Tidak dapat menghapus: semua pemilih telah menggunakan hak suara atau data pemilih kosong.');
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }

      // Prioritaskan peserta yang memiliki label sample terlebih dahulu
      const sampleVoters = unvoted.filter(
        (v) =>
          v.name.toLowerCase().includes('sample') ||
          v.position.toLowerCase().includes('sample')
      );
      const regularUnvoted = unvoted.filter(
        (v) =>
          !v.name.toLowerCase().includes('sample') &&
          !v.position.toLowerCase().includes('sample')
      );

      // Ambil dari sample terlebih dahulu, lalu dari urutan paling baru ditambahkan
      const candidateList = [...sampleVoters, ...[...regularUnvoted].reverse()];
      const toDelete = candidateList.slice(0, countToRemove);

      for (const voter of toDelete) {
        await dbService.deleteVoter(voter.id);
      }

      await refreshData();
      const removedNames = toDelete.map((v) => v.name).slice(0, 3).join(', ');
      const suffix = toDelete.length > 3 ? ` dan ${toDelete.length - 3} lainnya` : '';
      setSuccessBanner(
        `Berhasil mengurangi ${toDelete.length} peserta pemilih (${removedNames}${suffix}).`
      );
      setTimeout(() => setSuccessBanner(''), 4000);
      setSampleModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Gagal mengurangi sample pemilih.');
    } finally {
      setSampleOperating(false);
    }
  };

  const filteredList = voters
    .filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.pimpinan_name && v.pimpinan_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        v.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'voted'
          ? v.has_voted
          : !v.has_voted;

      const matchPimpinan =
        pimpinanFilter === 'all' ? true : v.pimpinan_id === pimpinanFilter;

      return matchSearch && matchStatus && matchPimpinan;
    })
    .sort((a, b) => {
      const compareStrings = (s1: string, s2: string) =>
        s1.localeCompare(s2, 'id', { numeric: true, sensitivity: 'base' });

      switch (sortBy) {
        case 'name_asc':
          return compareStrings(a.name || '', b.name || '');
        case 'name_desc':
          return compareStrings(b.name || '', a.name || '');
        case 'user_id_asc':
          return compareStrings(a.user_id || '', b.user_id || '');
        case 'user_id_desc':
          return compareStrings(b.user_id || '', a.user_id || '');
        case 'pimpinan_asc':
          return (
            compareStrings(a.pimpinan_name || '', b.pimpinan_name || '') ||
            compareStrings(a.user_id || '', b.user_id || '')
          );
        case 'pimpinan_desc':
          return (
            compareStrings(b.pimpinan_name || '', a.pimpinan_name || '') ||
            compareStrings(a.user_id || '', b.user_id || '')
          );
        case 'status_voted_first':
          return Number(b.has_voted) - Number(a.has_voted) || compareStrings(a.name || '', b.name || '');
        case 'status_not_voted_first':
          return Number(a.has_voted) - Number(b.has_voted) || compareStrings(a.name || '', b.name || '');
        case 'newest': {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tB - tA || compareStrings(a.name || '', b.name || '');
        }
        default:
          return 0;
      }
    });

  const activeSortOption = VOTER_SORT_OPTIONS.find((opt) => opt.value === sortBy) || VOTER_SORT_OPTIONS[0];

  const handleToggleColumnSort = (column: 'user_id' | 'name' | 'pimpinan' | 'status') => {
    if (column === 'user_id') {
      setSortBy((prev) => (prev === 'user_id_asc' ? 'user_id_desc' : 'user_id_asc'));
    } else if (column === 'name') {
      setSortBy((prev) => (prev === 'name_asc' ? 'name_desc' : 'name_asc'));
    } else if (column === 'pimpinan') {
      setSortBy((prev) => (prev === 'pimpinan_asc' ? 'pimpinan_desc' : 'pimpinan_asc'));
    } else if (column === 'status') {
      setSortBy((prev) =>
        prev === 'status_voted_first' ? 'status_not_voted_first' : 'status_voted_first'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Exit Button on Right & Title on Left */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Daftar Pemilih Tetap (DPT)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data pemilih, hak suara, dan akun peserta musyawarah
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Keluar ke Beranda dipindahkan ke sebelah kanan */}
          <button
            type="button"
            onClick={() => setAdminActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-400 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-2xs group shrink-0"
            title="Keluar dari Kelola Daftar Pemilih dan kembali ke Beranda Panlih"
          >
            <ArrowLeft className="w-4 h-4 text-amber-600 group-hover:-translate-x-1 transition-transform" />
            <span>Keluar ke Beranda</span>
          </button>

          {/* Tombol Edit & Pengaturan Sample Pemilih (tanpa logo icon) */}
          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setSampleTargetPimpinan(pimpinanList[0]?.id || '');
              setSampleModalOpen(true);
            }}
            className="inline-flex items-center justify-center px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-2xs"
            title="Edit dan sesuaikan jumlah serta pengaturan sample pemilih"
          >
            <span>Edit Sample</span>
          </button>

          {/* Tombol Tambah Pemilih Manual */}
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Pemilih</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari User ID, nama, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({voters.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('voted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'voted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sudah ({voters.filter((v) => v.has_voted).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('not_voted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'not_voted'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belum ({voters.filter((v) => !v.has_voted).length})
          </button>
        </div>

        {/* Pimpinan Filter & Sort By Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="w-full sm:w-48">
            <select
              value={pimpinanFilter}
              onChange={(e) => setPimpinanFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-white"
            >
              <option value="all">Semua Asal Pimpinan</option>
              {pimpinanList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Button & Dropdown */}
          <div ref={sortMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setSortMenuOpen((prev) => !prev)}
              aria-expanded={sortMenuOpen}
              aria-haspopup="listbox"
              className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 rounded-xl border font-semibold transition-colors shadow-2xs ${
                sortMenuOpen
                  ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="Urutkan daftar pemilih tetap (Sort by)"
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-slate-500 font-medium">Sort by:</span>
                <span className="font-bold text-slate-900 truncate">{activeSortOption.shortLabel}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  sortMenuOpen ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </button>

            {sortMenuOpen && (
              <div
                role="listbox"
                aria-label="Urutkan Daftar Pemilih Tetap"
                className="absolute right-0 mt-2 w-full sm:w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Urutkan Berdasarkan
                </div>
                {VOTER_SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-50 text-amber-950 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Mobile Horizontal Navigation & Scroll Toolbar */}
        <div className="sm:hidden flex items-center justify-between gap-2 px-3 py-2 bg-amber-50/90 border-b border-amber-200 text-xs">
          <span className="text-[11px] font-semibold text-amber-950 flex items-center gap-1 shrink-0">
            <span>↔ Geser Tabel</span>
            <span className="text-[10px] text-amber-800 font-normal">(No s/d Aksi)</span>
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => tableContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })}
              className="px-2 py-1 bg-white hover:bg-amber-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-[10px] shadow-2xs transition-colors"
              title="Geser mentok ke No (paling kiri)"
            >
              ⇤ No
            </button>
            <button
              type="button"
              onClick={() => tableContainerRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
              className="p-1 bg-white hover:bg-amber-100 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-colors"
              title="Geser ke kiri"
              aria-label="Geser ke kiri"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => tableContainerRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
              className="p-1 bg-white hover:bg-amber-100 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-colors"
              title="Geser ke kanan"
              aria-label="Geser ke kanan"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (tableContainerRef.current) {
                  tableContainerRef.current.scrollTo({
                    left: tableContainerRef.current.scrollWidth,
                    behavior: 'smooth',
                  });
                }
              }}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] shadow-2xs transition-colors"
              title="Geser mentok ke Aksi (paling kanan)"
            >
              Aksi ⇥
            </button>
          </div>
        </div>

        <div ref={tableContainerRef} className="overflow-x-auto touch-auto scroll-smooth">
          <table className="w-full min-w-[780px] sm:min-w-[850px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3 w-12 text-center shrink-0">No</th>
                <th className="py-3 px-3 w-32 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleColumnSort('user_id')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                    title="Urutkan berdasarkan User ID"
                  >
                    <span>User ID</span>
                    {sortBy === 'user_id_asc' ? (
                      <ArrowUp className="w-3 h-3 text-amber-600" />
                    ) : sortBy === 'user_id_desc' ? (
                      <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => handleToggleColumnSort('name')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                    title="Urutkan berdasarkan Nama Lengkap"
                  >
                    <span>Nama Lengkap</span>
                    {sortBy === 'name_asc' ? (
                      <ArrowUp className="w-3 h-3 text-amber-600" />
                    ) : sortBy === 'name_desc' ? (
                      <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 min-w-[150px]">Jabatan</th>
                <th className="py-3 px-4 min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => handleToggleColumnSort('pimpinan')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                    title="Urutkan berdasarkan Asal Pimpinan"
                  >
                    <span>Asal Pimpinan</span>
                    {sortBy === 'pimpinan_asc' ? (
                      <ArrowUp className="w-3 h-3 text-amber-600" />
                    ) : sortBy === 'pimpinan_desc' ? (
                      <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-36 text-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleColumnSort('status')}
                    className="inline-flex items-center justify-center gap-1 hover:text-slate-900 transition-colors"
                    title="Urutkan berdasarkan Status Suara"
                  >
                    <span>Status Suara</span>
                    {sortBy === 'status_voted_first' ? (
                      <ArrowUp className="w-3 h-3 text-amber-600" />
                    ) : sortBy === 'status_not_voted_first' ? (
                      <ArrowDown className="w-3 h-3 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-28 text-center shrink-0">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data pemilih yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((voter, idx) => (
                  <tr key={voter.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 text-center font-medium text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {voter.user_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {voter.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {voter.position}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {voter.pimpinan_name || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {voter.has_voted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sudah Memilih</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Belum Memilih</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {voter.has_voted && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetError('');
                              setResetVoterId(voter.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Reset Status Suara (Untuk Uji Coba Panlih)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(voter)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Data Pemilih"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(voter.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Pemilih"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Exit Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Users className="w-4 h-4 text-amber-600" />
          <span>Selesai mengelola data pemilih (DPT)? Kembali ke Beranda Panlih tanpa logout.</span>
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

      {/* Add / Edit Voter Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingItem ? 'Edit Data Pemilih' : 'Tambah Pemilih Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  User ID (NISN / Nomor Peserta) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: IPM-2024-001"
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pemilih <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Peserta"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan / Status Peserta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ketua Ranting / Utusan Cabang"
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asal Pimpinan
                </label>
                <select
                  value={formPimpinanId}
                  onChange={(e) => setFormPimpinanId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Pilih Asal Pimpinan --</option>
                  {pimpinanList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Password Akun Pemilih {editingItem && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                  </span>
                  {!editingItem && <span className="text-amber-700 font-normal">Default: pemilih123</span>}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={editingItem ? 'Ketik password baru jika ingin mengubah...' : 'Password login pemilih'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Password akan dienkripsi secara aman dengan algoritma SHA-256.
                </p>
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

      {/* Sample Voters Manager & Edit Modal */}
      {sampleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kelola & Edit Sample Pemilih
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tambah atau kurangi peserta uji coba secara instan dan terstruktur
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSampleModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notice inside Sample Modal */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Status Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Total DPT</p>
                <p className="text-base font-extrabold text-slate-800">{voters.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase">Belum Memilih</p>
                <p className="text-base font-extrabold text-emerald-700">
                  {voters.filter((v) => !v.has_voted).length}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Sudah Memilih</p>
                <p className="text-base font-extrabold text-slate-500">
                  {voters.filter((v) => v.has_voted).length}
                </p>
              </div>
            </div>

            {/* Quick Actions: 5 Peserta Langsung */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 via-amber-50/50 to-rose-50/80 rounded-xl border border-slate-200/80 mb-5">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>Aksi Cepat 5 Peserta Langsung:</span>
                <span className="text-[10px] font-medium text-slate-500">1-Klik</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSampleVoters(5)}
                  disabled={sampleOperating}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>+5 Peserta Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSampleVoters(5)}
                  disabled={sampleOperating || voters.filter((v) => !v.has_voted).length === 0}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                  <span>-5 Peserta Langsung</span>
                </button>
              </div>
            </div>

            {/* Form Pengaturan Kustom */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Jumlah Peserta Kustom:</span>
                  <span className="text-amber-700 font-extrabold">{sampleCount} Peserta</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setSampleCount(Math.max(1, sampleCount - 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={sampleCount}
                      onChange={(e) =>
                        setSampleCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))
                      }
                      className="w-16 text-center py-2 font-bold text-slate-900 border-x border-slate-200 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setSampleCount(Math.min(50, sampleCount + 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                  {/* Preset chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 3, 5, 10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSampleCount(num)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          sampleCount === num
                            ? 'bg-amber-500 text-slate-950 shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Asal Pimpinan untuk Peserta Baru:
                </label>
                <select
                  value={sampleTargetPimpinan}
                  onChange={(e) => setSampleTargetPimpinan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-medium focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">
                    -- Pimpinan Pertama ({pimpinanList[0] ? `${pimpinanList[0].name} - ${pimpinanList[0].code}` : 'Default'}) --
                  </option>
                  {pimpinanList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  User ID otomatis mengikuti kode asal pimpinan:{' '}
                  <code className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {getPimpinanUserIdPrefix(sampleTargetPimpinan || pimpinanList[0]?.id)}-00X
                  </code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Format Penamaan Sample:
                </label>
                {(() => {
                  const previewPimpinan =
                    pimpinanList.find((p) => p.id === (sampleTargetPimpinan || pimpinanList[0]?.id)) ||
                    pimpinanList[0];
                  const previewName = previewPimpinan?.name || 'Asal Pimpinan';
                  const previewPrefix = getPimpinanUserIdPrefix(previewPimpinan?.id);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSampleNameMode('realistic')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          sampleNameMode === 'realistic'
                            ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-bold ring-1 ring-amber-500'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <p className="font-bold">Nama Realistis</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          Contoh: Ahmad Fauzi, Budi Santoso
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleNameMode('numbered')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          sampleNameMode === 'numbered'
                            ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-bold ring-1 ring-amber-500'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <p className="font-bold">Format Nomor</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          Contoh: Peserta Sample #01, #02
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleNameMode('delegasi')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          sampleNameMode === 'delegasi'
                            ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-bold ring-1 ring-amber-500'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <p className="font-bold">Delegasi Pimpinan</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          Delegasi {previewName} #01 ({previewPrefix}-001)
                        </p>
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Password Akun Default: <strong>pemilih123</strong>
                  </span>
                </p>
                <p className="text-[11px] text-amber-800/80">
                  Keamanan suara: Mengurangi peserta hanya berlaku bagi yang belum memilih agar hasil pemilihan tetap utuh dan valid.
                </p>
              </div>

              {/* Action Buttons for custom count */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSampleVoters(sampleCount)}
                  disabled={sampleOperating}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah {sampleCount} Peserta</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSampleVoters(sampleCount)}
                  disabled={sampleOperating || voters.filter((v) => !v.has_voted).length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                  <span>- Kurangi {sampleCount} Peserta</span>
                </button>
              </div>

              {/* Pilihan Tambah Pemilih Manual */}
              <div className="pt-3 border-t border-slate-200 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <span>Ingin input data pemilih manual satu per satu?</span>
                <button
                  type="button"
                  onClick={() => {
                    setSampleModalOpen(false);
                    openAddModal();
                  }}
                  className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Buka Form Tambah Pemilih</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Vote Modal */}
      {resetVoterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Reset Hak Suara Pemilih?</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Status pemilih di database Supabase akan diubah menjadi <strong>Belum Memilih</strong> sehingga dapat memberikan suara kembali.
            </p>
            {resetError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-left font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}
            <div className="flex justify-center gap-2">
              <button
                type="button"
                disabled={resettingVote}
                onClick={() => {
                  setResetError('');
                  setResetVoterId(null);
                }}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resettingVote}
                onClick={handleResetVote}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
              >
                {resettingVote ? 'Mereset...' : 'Ya, Reset Status'}
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
            <h3 className="text-base font-bold text-slate-900 mb-1">Hapus Data Pemilih?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Pemilih ini akan dihapus permanen dari Daftar Pemilih Tetap (DPT).
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
