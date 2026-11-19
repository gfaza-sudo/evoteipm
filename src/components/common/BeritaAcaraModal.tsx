import React, { useState, useRef } from 'react';
import { Formatur, AppSettings, VoteStats } from '../../types';
import {
  Download,
  X,
  FileCheck2,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  downloadBeritaAcaraPDF,
  getCurrentIndonesianDate,
  getNumberInWords,
} from '../../lib/pdfGenerator';
import {
  OfficialIpmLogoBadge,
  OfficialBasmalahCalligraphy,
} from '../../lib/ipmAssets';

interface BeritaAcaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  formaturs: Formatur[];
  stats: VoteStats | null;
  settings: AppSettings;
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  isOpen,
  onClose,
  formaturs,
  stats,
  settings,
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Dynamic Indonesian date calculated at the moment modal is viewed or downloaded
  const { fullDateText } = getCurrentIndonesianDate();

  // Sort formaturs by votes descending (tie-break by candidate number)
  const sortedFormaturs = [...formaturs].sort(
    (a, b) => (b.votes_count || 0) - (a.votes_count || 0) || a.number - b.number
  );

  const totalVotesCast = sortedFormaturs.reduce((acc, f) => acc + (f.votes_count || 0), 0);
  const requiredChoices = settings.max_formatur_choices || 7;
  const periodText = settings.org_period?.trim() || 'Periode 2026 - 2028';
  const periodHeading = periodText.toUpperCase().startsWith('PERIODE')
    ? periodText.toUpperCase()
    : `PERIODE ${periodText.toUpperCase()}`;

  // Horizontal scroll helpers for mobile view (allows full reach mentok kanan dan kiri)
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const handleScrollStart = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleScrollEnd = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: scrollContainerRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  // Handle direct 2-page PDF export via pure vector jsPDF
  const handleDownloadPDF = () => {
    setDownloadingPdf(true);
    setDownloadSuccess(false);

    try {
      const ok = downloadBeritaAcaraPDF({
        formaturs,
        stats,
        settings,
      });

      if (ok) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:max-w-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Berita Acara Pemilihan Formatur</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Format Standar 2 Halaman
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sesuai berkas resmi Panitia Pemilihan (PANLIH) Musyawarah Cabang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              title="Unduh berkas PDF resmi (2 Halaman)"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloadingPdf ? 'Membuat PDF...' : 'Unduh Berkas PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scroll Controls Bar (Visible on mobile/tablet) */}
        <div className="flex md:hidden items-center justify-between px-2.5 py-2 bg-slate-100 border-b border-slate-200 text-xs text-slate-700 font-medium select-none print:hidden gap-1.5 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleScrollStart}
              className="inline-flex items-center gap-0.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-bold shadow-2xs active:bg-slate-200 transition-colors text-[11px]"
              title="Mentok Kiri"
            >
              <span>« Mentok</span>
            </button>
            <button
              type="button"
              onClick={handleScrollLeft}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-bold shadow-2xs active:bg-slate-200 transition-colors text-[11px]"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kiri</span>
            </button>
          </div>
          
          <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap px-1">
            Geser Dokumen A4
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleScrollRight}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-bold shadow-2xs active:bg-slate-200 transition-colors text-[11px]"
            >
              <span>Kanan</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
            </button>
            <button
              type="button"
              onClick={handleScrollEnd}
              className="inline-flex items-center gap-0.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-bold shadow-2xs active:bg-slate-200 transition-colors text-[11px]"
              title="Mentok Kanan"
            >
              <span>Mentok »</span>
            </button>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 text-xs font-semibold px-6 print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Berita Acara berhasil diunduh sebagai PDF 2 halaman lengkap dengan rekapitulasi e-vote!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadSuccess(false)}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Scrollable Paper Preview (Full horizontal & vertical scrolling - Mentok Kanan & Kiri) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-6 bg-slate-200/80 print:p-0 print:bg-white print:overflow-visible scroll-smooth"
        >
          <div className="min-w-fit w-max mx-auto flex flex-col items-center gap-8 print:gap-0 print:w-full">
          
          {/* ========================================================================= */}
          {/* HALAMAN 1 (PAGE 1)                                                       */}
          {/* ========================================================================= */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 mb-2 print:hidden tracking-wider uppercase">
              Halaman 1 dari 2
            </span>
            <div
              className="w-[210mm] max-w-[210mm] bg-white shadow-xl border border-slate-300 text-slate-900 flex flex-col justify-between print:shadow-none print:border-none print:w-[210mm] print:h-[297mm] print:page-break-after-always overflow-hidden"
              style={{
                fontFamily: "'Arial Narrow', Arial, 'Liberation Sans Narrow', sans-serif",
                minHeight: '297mm',
                boxSizing: 'border-box',
              }}
            >
              {/* Inner Content with Margins */}
              <div className="p-[16mm] pb-0 flex-1 flex flex-col">
                {/* Kop Surat Resmi */}
                <div className="flex flex-col items-center text-center">
                  {/* Official IPM Logo Emblem */}
                  <div className="w-20 h-28 flex items-center justify-center mb-1">
                    <OfficialIpmLogoBadge className="w-18 h-26" />
                  </div>

                  {/* Header Organisasi (Hijau Bold) */}
                  <h2 className="text-base font-bold text-[#008744] tracking-wide uppercase leading-tight">
                    PIMPINAN CABANG
                  </h2>
                  <h2 className="text-base font-bold text-[#008744] tracking-wide uppercase leading-tight">
                    IKATAN PELAJAR MUHAMMADIYAH
                  </h2>
                  <h2 className="text-base font-bold text-[#008744] tracking-wide uppercase leading-tight">
                    SEPANJANG
                  </h2>

                  {/* Basmalah Calligraphy HD */}
                  <OfficialBasmalahCalligraphy className="my-2" />

                  {/* Panitia Pemilihan Info - Bold */}
                  <h1 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide leading-tight mt-0.5 font-bold">
                    PANITIA PEMILIHAN (PANLIH) MUSYAWARAH CABANG
                  </h1>
                  <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider leading-tight font-bold">
                    {periodHeading}
                  </h2>

                  {/* Garis Pembatas Hitam Tebal */}
                  <div className="w-full border-b-[3.5px] border-slate-950 mt-2.5 mb-4" />
                </div>

                {/* Judul Berita Acara - Bold */}
                <div className="text-center mb-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-950 font-bold">
                    BERITA ACARA REKAPITULASI DAN PENETAPAN HASIL PEMILIHAN
                  </h3>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-950 font-bold">
                    CALON FORMATUR
                  </h3>
                </div>

                {/* Paragraf Pembuka - Ukuran Font 12 */}
                <div className="space-y-2 mb-4 text-[12pt] leading-relaxed text-justify text-slate-900">
                  <p>
                    Pada hari ini, <strong className="font-bold text-slate-950">{fullDateText}</strong>, bertempat di SD Muhammadiyah 1 & 2 Taman, Panitia Pemilihan (PANLIH) telah melaksanakan pemungutan dan penghitungan suara secara e-Voting pada agenda Pemilihan Calon Formatur Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang untuk masa amanah {periodText}.
                  </p>
                  <p>
                    Pelaksanaan pemilihan diselenggarakan secara Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER & JURDIL), dengan ketentuan setiap pemilih memiliki hak suara untuk memilih <strong className="font-bold text-slate-950">{requiredChoices} ({getNumberInWords(requiredChoices)}) orang calon formatur</strong> dari total {formaturs.length} ({getNumberInWords(formaturs.length)}) calon tetap formatur.
                  </p>
                </div>

                {/* I. DATA REKAPITULASI PEMILIH & SUARA MASUK */}
                <div className="mb-4">
                  <h4 className="text-[12pt] font-bold uppercase tracking-wider text-slate-950 mb-1.5">
                    I. DATA REKAPITULASI PEMILIH & SUARA MASUK
                  </h4>
                  <table className="w-full text-[12pt] border border-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-900">
                        <th className="py-1 px-2 text-center w-10 border-r border-slate-400">No</th>
                        <th className="py-1 px-3 text-left border-r border-slate-400">Uraian Rekapitulasi Suara</th>
                        <th className="py-1 px-3 text-right w-28 border-r border-slate-400">Jumlah</th>
                        <th className="py-1 px-3 text-center w-24">Satuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      <tr>
                        <td className="py-1 px-2 text-center border-r border-slate-300">1</td>
                        <td className="py-1 px-3 border-r border-slate-300">Jumlah Pemilih Terdaftar dalam DPT</td>
                        <td className="py-1 px-3 text-right font-bold border-r border-slate-300">{stats?.totalVoters || 0}</td>
                        <td className="py-1 px-3 text-center text-slate-700">Pemilih</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-center border-r border-slate-300">2</td>
                        <td className="py-1 px-3 border-r border-slate-300">Pemilih yang Menggunakan Hak Suara</td>
                        <td className="py-1 px-3 text-right font-bold text-emerald-800 border-r border-slate-300">{stats?.votedCount || 0}</td>
                        <td className="py-1 px-3 text-center text-slate-700">Pemilih</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-center border-r border-slate-300">3</td>
                        <td className="py-1 px-3 border-r border-slate-300">Pemilih yang Tidak Menggunakan Hak Suara</td>
                        <td className="py-1 px-3 text-right font-bold text-slate-700 border-r border-slate-300">{stats?.notVotedCount || 0}</td>
                        <td className="py-1 px-3 text-center text-slate-700">Pemilih</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-center border-r border-slate-300">4</td>
                        <td className="py-1 px-3 border-r border-slate-300">Persentase Partisipasi Pemilih</td>
                        <td className="py-1 px-3 text-right font-bold text-emerald-700 border-r border-slate-300">{stats?.participationPercentage || 0}%</td>
                        <td className="py-1 px-3 text-center text-slate-700">Persen</td>
                      </tr>
                      <tr className="bg-amber-50 font-bold">
                        <td className="py-1.5 px-2 text-center border-r border-slate-300">5</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-slate-950">Total Akumulasi Suara Sah yang Masuk</td>
                        <td className="py-1.5 px-3 text-right font-extrabold text-slate-950 border-r border-slate-300">{totalVotesCast}</td>
                        <td className="py-1.5 px-3 text-center text-slate-950">Suara Sah</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* II. HASIL PEROLEHAN SUARA & PENETAPAN FORMATUR TERPILIH */}
                <div className="mb-2">
                  <h4 className="text-[12pt] font-bold uppercase tracking-wider text-slate-950 mb-1.5">
                    II. HASIL PEROLEHAN SUARA & PENETAPAN FORMATUR TERPILIH
                  </h4>
                  <table className="w-full text-[12pt] border border-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-400 text-slate-900">
                        <th className="py-1 px-2 text-center w-12 border-r border-slate-400">Rank</th>
                        <th className="py-1 px-2 text-center w-14 border-r border-slate-400">No. Urut</th>
                        <th className="py-1 px-3 text-left border-r border-slate-400">Nama Calon Formatur</th>
                        <th className="py-1 px-2 text-center w-24 border-r border-slate-400">Perolehan</th>
                        <th className="py-1 px-2 text-center w-16 border-r border-slate-400">%</th>
                        <th className="py-1 px-2 text-center w-36">Status Penetapan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {sortedFormaturs.map((formatur, idx) => {
                        const isElected =
                          totalVotesCast > 0 &&
                          idx < requiredChoices &&
                          (formatur.votes_count || 0) > 0;
                        const percentage =
                          totalVotesCast > 0
                            ? ((formatur.votes_count / totalVotesCast) * 100).toFixed(1)
                            : '0.0';

                        return (
                          <tr
                            key={formatur.id}
                            className={isElected ? 'bg-emerald-50/70 font-semibold' : 'bg-white'}
                          >
                            <td className="py-1 px-2 text-center border-r border-slate-300 font-bold">
                              #{idx + 1}
                            </td>
                            <td className="py-1 px-2 text-center border-r border-slate-300 text-slate-700">
                              [{String(formatur.number).padStart(2, '0')}]
                            </td>
                            <td className="py-1 px-3 border-r border-slate-300 text-slate-950">
                              {formatur.name}
                            </td>
                            <td className="py-1 px-2 text-center font-bold border-r border-slate-300 text-slate-900">
                              {formatur.votes_count} Suara
                            </td>
                            <td className="py-1 px-2 text-center border-r border-slate-300 text-slate-700">
                              {percentage}%
                            </td>
                            <td className="py-1 px-2 text-center">
                              {isElected ? (
                                <span className="font-bold text-emerald-800 uppercase text-[11pt]">
                                  TERPILIH (FORMATUR)
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11pt]">
                                  Belum Terpilih
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

              {/* Footer Halaman 1: Balok Hijau Full dari Kanan sampai Kiri Kertas A4 */}
              <div className="w-full mt-auto pt-4 text-center">
                <p className="text-[10pt] font-medium text-[#008744] leading-tight">
                  Kompleks Masjid Al - Manar Jl. Raya Bebekan 6A
                </p>
                <p className="text-[10pt] font-medium text-[#008744] leading-tight mb-2">
                  Sepanjang Taman – Sidoarjo 61257 Telp : ( 031 )7882971
                </p>
                {/* Balok Hijau Full Width Edge-to-Edge */}
                <div className="w-full h-5 bg-[#009944]" />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HALAMAN 2 (PAGE 2)                                                       */}
          {/* ========================================================================= */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-500 mb-2 print:hidden tracking-wider uppercase">
              Halaman 2 dari 2
            </span>
            <div
              className="w-[210mm] max-w-[210mm] bg-white shadow-xl border border-slate-300 text-slate-900 flex flex-col justify-between print:shadow-none print:border-none print:w-[210mm] print:h-[297mm] overflow-hidden"
              style={{
                fontFamily: "'Arial Narrow', Arial, 'Liberation Sans Narrow', sans-serif",
                minHeight: '297mm',
                boxSizing: 'border-box',
              }}
            >
              {/* Inner Content with Margins */}
              <div className="p-[16mm] pb-0 flex-1 flex flex-col">
                {/* Kop Halaman 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-28 flex items-center justify-center mb-1">
                    <OfficialIpmLogoBadge className="w-18 h-26" />
                  </div>
                  <h2 className="text-base font-bold text-[#008744] tracking-wide uppercase leading-tight">
                    PIMPINAN CABANG
                  </h2>
                  <h2 className="text-base font-bold text-[#008744] tracking-wide uppercase leading-tight">
                    IKATAN PELAJAR MUHAMMADIYAH
                  </h2>
                  <h2 className="text-base font-bold text-[#008744] tracking-wide uppercase leading-tight">
                    SEPANJANG
                  </h2>
                  <OfficialBasmalahCalligraphy className="my-2.5" />
                  {/* Panitia Pemilihan Info - Bold */}
                  <h1 className="text-sm font-extrabold text-slate-950 uppercase tracking-wide leading-tight mt-0.5 font-bold">
                    PANITIA PEMILIHAN (PANLIH) MUSYAWARAH CABANG
                  </h1>
                  <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider leading-tight font-bold">
                    {periodHeading}
                  </h2>
                  <div className="w-full border-b-[3.5px] border-slate-950 mt-2.5 mb-4" />
                </div>

                {/* Paragraf Penetapan & Tanggung Jawab - Ukuran Font 12 */}
                <div className="space-y-4 my-6 text-[12pt] leading-relaxed text-justify text-slate-900">
                  <p>
                    Berdasarkan hasil perhitungan, Panitia Pemilihan menetapkan <strong className="font-bold text-slate-950">{requiredChoices} ({getNumberInWords(requiredChoices)}) nama calon formatur dengan perolehan suara terbanyak (Peringkat 1 s.d. {requiredChoices})</strong> secara sah sebagai Anggota Formatur Terpilih Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang {periodText} yang bertugas menyusun kepengurusan lengkap bersama Ketua Umum terpilih dalam Rapat Formatur.
                  </p>
                  <p>
                    Demikian Berita Acara ini dibuat dan ditandatangani dengan sebenar-benarnya serta dapat dipertanggungjawabkan di hadapan Peserta Musyawarah Cabang Ikatan Pelajar Muhammadiyah Sepanjang.
                  </p>
                </div>

                {/* Tempat & Tanggal Penetapan - Ukuran Font 12 */}
                <div className="text-right text-[12pt] text-slate-900 mb-8 mt-6">
                  <p>Ditetapkan di : <span className="font-bold">Sepanjang</span></p>
                  <p>Pada tanggal : <span className="font-bold">{fullDateText}</span></p>
                </div>

                {/* Tanda Tangan Panlih */}
                <div className="text-center mt-4">
                  <h4 className="text-[12pt] font-bold text-slate-950 uppercase tracking-wider mb-8">
                    PANITIA PEMILIHAN MUSYAWARAH CABANG
                  </h4>

                  <div className="grid grid-cols-3 gap-6 text-center text-[12pt]">
                    {/* Ketua Panlih */}
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-slate-900">Ketua Panlih,</p>
                      <div className="h-28" />
                      <div className="w-40 sm:w-48 border-b-2 border-slate-950" />
                      <p className="mt-1 text-slate-700 text-[11pt]">NBA :</p>
                    </div>

                    {/* Sekretaris Panlih */}
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-slate-900">Sekretaris Panlih,</p>
                      <div className="h-28" />
                      <div className="w-40 sm:w-48 border-b-2 border-slate-950" />
                      <p className="mt-1 text-slate-700 text-[11pt]">NBA :</p>
                    </div>

                    {/* Saksi Pemilihan */}
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-slate-900">Saksi Pemilihan,</p>
                      <div className="h-28" />
                      <div className="w-40 sm:w-48 border-b-2 border-slate-950" />
                      <p className="mt-1 text-slate-700 text-[11pt]">NBA :</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Halaman 2: Balok Hijau Full dari Kanan sampai Kiri Kertas A4 */}
              <div className="w-full mt-auto pt-4 text-center">
                <p className="text-[10pt] font-medium text-[#008744] leading-tight">
                  Kompleks Masjid Al - Manar Jl. Raya Bebekan 6A
                </p>
                <p className="text-[10pt] font-medium text-[#008744] leading-tight mb-2">
                  Sepanjang Taman – Sidoarjo 61257 Telp : ( 031 )7882971
                </p>
                {/* Balok Hijau Full Width Edge-to-Edge */}
                <div className="w-full h-5 bg-[#009944]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};


