import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Vote,
  CheckCircle2,
  Clock,
  Building2,
  Award,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  LogOut,
  Calendar,
} from 'lucide-react';

export const VoterProfileView: React.FC = () => {
  const { currentVoter, settings, setVoterActiveView, logoutVoter } = useApp();

  if (!currentVoter) {
    return null;
  }

  const hasVoted = currentVoter.has_voted;
  const maxChoices = settings.max_formatur_choices || 7;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden space-y-6">
        {/* Banner with Status Highlight */}
        <div
          className={`p-6 sm:p-8 text-white relative overflow-hidden ${
            hasVoted
              ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500'
          }`}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/20 text-white border border-white/20 inline-block mb-2">
                Kartu Tanda Pemilih Musyawarah
              </span>
              <h1 className="text-2xl font-black tracking-tight">{currentVoter.name}</h1>
              <p className="text-xs text-white/80 font-mono mt-0.5">{currentVoter.user_id}</p>
            </div>

            {/* Voting Status Stamp */}
            <div className="self-start sm:self-center">
              {hasVoted ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-extrabold text-xs shadow-inner">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SUDAH MEMILIH</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 border border-white/30 text-white font-extrabold text-xs shadow-inner">
                  <Clock className="w-4 h-4 text-white" />
                  <span>BELUM MEMILIH</span>
                </div>
              )}
            </div>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <Vote className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* Biodata Section */}
        <div className="px-6 sm:px-8 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Biodata Lengkap Pemilih
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block mb-0.5">Nomor ID Pemilih (NISN)</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{currentVoter.user_id}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block mb-0.5">Jabatan / Utusan</span>
              <span className="font-bold text-slate-900 text-sm">{currentVoter.position || 'Peserta Musyda'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block mb-0.5">Asal Pimpinan</span>
              <span className="font-bold text-slate-900 text-sm">{currentVoter.pimpinan_name || '-'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block mb-0.5">Hak Suara Formatur</span>
              <span className="font-bold text-amber-700 text-sm">Memilih {maxChoices} Formatur</span>
            </div>
          </div>
        </div>

        {/* Voting Action or Already Voted Warning */}
        <div className="px-6 sm:px-8 pb-8 space-y-4">
          {hasVoted ? (
            /* ALREADY VOTED STATE */
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Anda sudah menggunakan hak suara
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Hak suara Anda telah sah tercatat dalam kotak suara rahasia. Sesuai asas demokrasi, satu pemilih hanya diperbolehkan memberikan suara satu kali.
                </p>
                {currentVoter.voted_at && (
                  <p className="text-[11px] text-emerald-700 font-mono mt-2">
                    Waktu pencatatan suara: {new Date(currentVoter.voted_at).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={logoutVoter}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Selesai & Keluar Sesi</span>
                </button>
              </div>
            </div>
          ) : (
            /* NOT YET VOTED STATE */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Petunjuk Penting Sebelum Masuk Bilik Suara:</span>
                </div>
                <ul className="list-disc ml-5 space-y-1 text-slate-700">
                  <li>Anda memiliki hak untuk memilih <strong>{maxChoices} (tujuh)</strong> dari 9 Calon Formatur yang tersedia.</li>
                  <li>Pelajari visi dan misi setiap kandidat sebelum menentukan pilihan.</li>
                  <li>Setelah konfirmasi pemilihan dikirim, pilihan <strong>tidak dapat diubah</strong> kembali.</li>
                </ul>
              </div>

              {/* Big Voting Button */}
              <button
                type="button"
                onClick={() => setVoterActiveView('ballot')}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.99]"
              >
                <Vote className="w-5 h-5 text-slate-950" />
                <span>Berikan Suara (Buka Bilik Suara)</span>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
