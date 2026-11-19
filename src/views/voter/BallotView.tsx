import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Formatur } from '../../types';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Eye,
  AlertCircle,
  X,
  Vote,
  Sparkles,
  ArrowLeft,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const BallotView: React.FC = () => {
  const {
    formaturs,
    currentVoter,
    settings,
    castVote,
    setVoterActiveView,
    logoutVoter,
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailCandidate, setDetailCandidate] = useState<Formatur | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 5-second success countdown state
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const requiredCount = settings.max_formatur_choices || 7;

  // Protect against direct navigation if already voted
  useEffect(() => {
    if (!currentVoter || currentVoter.has_voted) {
      setVoterActiveView('profile');
    }
  }, [currentVoter, setVoterActiveView]);

  // Handle countdown effect when vote succeeds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (voteSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (voteSuccess && countdown === 0) {
      // 5 seconds elapsed! Automatically logout and return to login screen
      logoutVoter();
    }
    return () => clearTimeout(timer);
  }, [voteSuccess, countdown, logoutVoter]);

  const toggleSelect = (candidateId: string) => {
    if (voteSuccess) return;

    if (selectedIds.includes(candidateId)) {
      setSelectedIds(selectedIds.filter((id) => id !== candidateId));
      setErrorMsg('');
    } else {
      if (selectedIds.length >= requiredCount) {
        // Can't choose more than 7
        const candidate = formaturs.find((f) => f.id === candidateId);
        const candName = candidate ? candidate.name : 'calon ini';
        setErrorMsg(
          `Kuota pilihan sudah penuh (${requiredCount}/${requiredCount} formatur). Jika ingin memilih "${candName}", klik batal (uncheck) salah satu dari ${requiredCount} formatur terpilih terlebih dahulu.`
        );
        return;
      }
      setSelectedIds([...selectedIds, candidateId]);
      setErrorMsg('');
    }
  };

  const handleOpenConfirm = () => {
    if (selectedIds.length !== requiredCount) {
      setErrorMsg(`Anda harus memilih tepat ${requiredCount} calon formatur sebelum konfirmasi.`);
      return;
    }
    setErrorMsg('');
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const result = await castVote(selectedIds);
      if (result.success) {
        setShowConfirmModal(false);
        setVoteSuccess(true);
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#EAB308'],
        });
      } else {
        setErrorMsg(result.message);
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengirim suara.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Selected formaturs list for confirmation
  const selectedCandidatesList = formaturs.filter((f) => selectedIds.includes(f.id));

  // If voting was successful, display the mandated 5-second thank you screen
  if (voteSuccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-900">
        <div className="w-full max-w-lg bg-slate-950 rounded-3xl p-8 border border-amber-500/30 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 inline-block">
              Voting Berhasil
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Suara Anda berhasil dicatat, terima kasih telah berpartisipasi
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Hak suara Anda telah sah tercatat secara anonim dan aman di dalam database musyawarah.
            </p>
          </div>

          {/* Countdown Indicator */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 mb-1">
              Otomatis kembali ke halaman login dalam:
            </span>
            <div className="text-4xl font-black text-amber-400 font-mono">
              {countdown} <span className="text-sm font-sans font-medium text-slate-400">detik</span>
            </div>
            <div className="w-48 bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-amber-400 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={logoutVoter}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Kembali ke Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Top Ballot Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVoterActiveView('profile')}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Kembali ke Biodata"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                Bilik Suara Calon Formatur
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                Pilih {requiredCount} Formatur
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Silakan pilih tepat <strong>{requiredCount} (tujuh)</strong> kandidat dari 9 calon formatur yang tersedia
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Status Pilihan:</span>
            <div className="text-sm font-extrabold text-slate-900">
              <span className={selectedIds.length === requiredCount ? 'text-emerald-600 font-black' : 'text-amber-600 font-black'}>
                {selectedIds.length}
              </span>{' '}
              / {requiredCount} Terpilih
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of Candidates in Ballot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {formaturs.map((candidate) => {
          const isSelected = selectedIds.includes(candidate.id);
          const isMaxReached = selectedIds.length >= requiredCount && !isSelected;

          return (
            <div
              key={candidate.id}
              onClick={() => {
                toggleSelect(candidate.id);
              }}
              className={`group relative rounded-3xl border-2 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/20 shadow-lg shadow-amber-500/10 scale-[1.01]'
                  : isMaxReached
                  ? 'border-slate-200 bg-slate-50/70 hover:border-amber-300'
                  : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-md'
              }`}
            >
              {/* Photo & Candidate Number */}
              <div className="relative h-72 sm:h-80 bg-slate-900 overflow-hidden">
                <img
                  src={
                    candidate.photo_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'
                  }
                  alt={candidate.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{
                    objectPosition: candidate.photo_position || '50% 20%',
                    transform: candidate.photo_scale ? `scale(${candidate.photo_scale})` : undefined,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                {/* Candidate Number Box */}
                <div className="absolute top-3 left-3 w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-md">
                  {String(candidate.number).padStart(2, '0')}
                </div>

                {/* Checkbox Icon Top Right */}
                <div className="absolute top-3 right-3">
                  {isSelected ? (
                    <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-2xl bg-black/40 backdrop-blur-xs text-white/70 flex items-center justify-center border border-white/30">
                      <Circle className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Name over Photo Bottom */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-base leading-tight">
                    {candidate.name}
                  </h3>
                  <p className="text-xs text-amber-300 font-medium line-clamp-1 mt-0.5">
                    {candidate.bio || 'Calon Formatur'}
                  </p>
                </div>
              </div>

              {/* Card Body: Vision & Mission */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                    Visi Calon:
                  </span>
                  <p className="text-slate-700 italic line-clamp-2 leading-relaxed">
                    "{candidate.vision}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailCandidate(candidate);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lihat Visi Misi</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(candidate.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : isMaxReached
                        ? 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? '✓ Terpilih' : isMaxReached ? 'Pilih (Batas 7)' : 'Pilih'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Formatur Terpilih:
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                    selectedIds.length === requiredCount
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedIds.length} dari {requiredCount} Formatur
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {selectedIds.length === requiredCount
                  ? '✓ Pilihan lengkap. Siap mengirim suara ke kotak suara.'
                  : `Kurang ${requiredCount - selectedIds.length} pilihan kandidat lagi.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={selectedIds.length !== requiredCount}
              onClick={handleOpenConfirm}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs transition-all shadow-md ${
                selectedIds.length === requiredCount
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25 active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lanjutkan & Simpan Suara ({selectedIds.length}/{requiredCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 bg-amber-500 text-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Konfirmasi Pilihan Formatur</h3>
                  <p className="text-xs text-amber-950 font-medium">
                    Periksa kembali {requiredCount} nama formatur pilihan Anda
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Candidates Summary */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                Peringatan: Setelah suara dikirim, hak suara Anda langsung tersimpan dan <strong>tidak dapat diubah kembali</strong>.
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                  Daftar {requiredCount} Formatur Pilihan Anda:
                </span>

                <div className="space-y-2">
                  {selectedCandidatesList.map((cand, idx) => (
                    <div
                      key={cand.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xs">
                          {cand.number}
                        </span>
                        <span className="font-bold text-slate-900">{cand.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{cand.bio || 'Formatur'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors"
              >
                Ubah Pilihan
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-md shadow-amber-500/20"
              >
                {submitting ? 'Menyimpan Suara...' : 'Ya, Kirim Suara Saya'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  {detailCandidate.number}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{detailCandidate.name}</h3>
                  <p className="text-[11px] text-slate-500">{detailCandidate.bio}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailCandidate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
              <div>
                <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px] text-amber-800">
                  Visi Calon:
                </span>
                <p className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed font-medium">
                  {detailCandidate.vision}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px] text-amber-800">
                  Misi Calon:
                </span>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 whitespace-pre-line leading-relaxed">
                  {detailCandidate.mission}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailCandidate(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
