import { jsPDF } from 'jspdf';
import { Formatur, AppSettings, VoteStats } from '../types';
import { getIpmLogoDataUrl, getBasmalahDataUrl } from './ipmAssets';

export interface GeneratePdfOptions {
  formaturs: Formatur[];
  stats: VoteStats | null;
  settings: AppSettings;
}

// Helper to convert number to Indonesian words
export const getNumberInWords = (num: number): string => {
  const words = [
    'nol',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
    'dua belas',
    'tiga belas',
    'empat belas',
    'lima belas',
  ];
  return words[num] || String(num);
};

// Get current date formatted in formal Indonesian
export const getCurrentIndonesianDate = () => {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const dayName = days[now.getDay()];
  const dateFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  return {
    dayName,
    dateFormatted,
    fullDateText: `${dayName}, ${dateFormatted}`,
    fileDateSuffix: `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(
      now.getDate()
    ).padStart(2, '0')}`,
  };
};

/**
 * Generates and triggers downloading the official Berita Acara PDF
 */
export const downloadBeritaAcaraPDF = (options: GeneratePdfOptions): boolean => {
  try {
    const { formaturs, stats, settings } = options;
    const dateInfo = getCurrentIndonesianDate();
    const sortedFormaturs = [...formaturs].sort(
      (a, b) => (b.votes_count || 0) - (a.votes_count || 0) || a.number - b.number
    );
    const totalVotesCast = sortedFormaturs.reduce((acc, f) => acc + (f.votes_count || 0), 0);
    const requiredChoices = settings.max_formatur_choices || 7;

    // Dynamic period from settings
    const periodRaw = settings.org_period?.trim() || 'Periode 2026 - 2028';
    const periodText = periodRaw.toUpperCase().startsWith('PERIODE')
      ? periodRaw.toUpperCase()
      : `PERIODE ${periodRaw.toUpperCase()}`;

    // Initialize standard ISO A4 document (210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true,
    });

    // Explicitly set A4 document metadata & properties
    doc.setProperties({
      title: 'Berita Acara Rekapitulasi Pemilihan Formatur - IPM Sepanjang',
      subject: `Musyawarah Cabang ${periodText} (Standar Kertas A4)`,
      author: 'Panitia Pemilihan Musyawarah Cabang IPM Sepanjang',
      keywords: 'Berita Acara, Pemilihan Formatur, IPM Sepanjang, A4, SMA Muhammadiyah 1 Taman',
      creator: 'Panlih Musyawarah IPM Sepanjang',
    });

    const pageWidth = 210;
    const marginX = 16;
    const contentWidth = pageWidth - marginX * 2; // 178mm

    // Generate crisp assets
    const logoDataUrl = getIpmLogoDataUrl();
    const basmalahDataUrl = getBasmalahDataUrl();

    // =========================================================================
    // HELPER: DRAW KOP SURAT
    // =========================================================================
    const drawKopSurat = (yStart: number) => {
      // Official IPM Shield Emblem (centered at top)
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 6.8, yStart, 13.6, 26.3);
      }

      let y = yStart + 29;

      // Organization Header (Green)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(0, 135, 68); // #008744
      doc.text('PIMPINAN CABANG', pageWidth / 2, y, { align: 'center' });
      y += 5.2;
      doc.text('IKATAN PELAJAR MUHAMMADIYAH', pageWidth / 2, y, { align: 'center' });
      y += 5.2;
      doc.text('SEPANJANG', pageWidth / 2, y, { align: 'center' });
      y += 3.0;

      // Basmalah Calligraphy - Use HD Graphic (NO doc.text to avoid arabic glyph / code corruption!)
      if (basmalahDataUrl) {
        const basmalahW = 56;
        const basmalahH = 11;
        try {
          const imgType = basmalahDataUrl.startsWith('data:image/svg+xml') ? 'SVG' : 'PNG';
          doc.addImage(
            basmalahDataUrl,
            imgType,
            pageWidth / 2 - basmalahW / 2,
            y,
            basmalahW,
            basmalahH
          );
        } catch (e) {
          console.warn('doc.addImage fallback:', e);
        }
        y += basmalahH + 1.5;
      } else {
        y += 7.0;
      }

      // Panlih Info (Black Bold) - Periode 2024 - 2026
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('PANITIA PEMILIHAN (PANLIH) MUSYAWARAH CABANG', pageWidth / 2, y, {
        align: 'center',
      });
      y += 4.5;
      doc.text(periodText, pageWidth / 2, y, { align: 'center' });
      y += 3.5;

      // Thick divider line
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.8);
      doc.line(marginX, y, marginX + contentWidth, y);

      return y + 5.5;
    };

    // =========================================================================
    // HELPER: DRAW FOOTER (FULL WIDTH BALOK HIJAU DARI KIRI SAMPAI KANAN A4)
    // =========================================================================
    const drawFooter = () => {
      const footerY = 277;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 135, 68); // #008744
      doc.text(
        'Kompleks Masjid Al - Manar Jl. Raya Bebekan 6A',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text(
        'Sepanjang Taman – Sidoarjo 61257 Telp : ( 031 )7882971',
        pageWidth / 2,
        footerY + 4,
        { align: 'center' }
      );

      // Balok hijau di bagian footer buat full dari kanan sampai kiri kertas A4 (0 to 210mm)
      doc.setFillColor(0, 153, 68); // #009944
      doc.rect(0, 287, 210, 10, 'F');
    };

    // =========================================================================
    // PAGE 1: REKAPITULASI & PEROLEHAN SUARA
    // =========================================================================
    let cursorY = drawKopSurat(10);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(
      'BERITA ACARA REKAPITULASI DAN PENETAPAN HASIL PEMILIHAN',
      pageWidth / 2,
      cursorY,
      { align: 'center' }
    );
    cursorY += 4.5;
    doc.text('CALON FORMATUR', pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6.5;

    // Redaksi Opening Paragraphs (Font Size 12)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11); // Set to crisp 11-12pt redaksi
    doc.setTextColor(30, 41, 59);

    const para1 = `Pada hari ini, ${dateInfo.fullDateText}, bertempat di SMA Muhammadiyah 1 Taman, Panitia Pemilihan (PANLIH) telah melaksanakan pemungutan dan penghitungan suara secara e-Voting pada agenda Pemilihan Calon Formatur Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang untuk masa amanah ${periodText}.`;
    const splitPara1 = doc.splitTextToSize(para1, contentWidth);
    doc.text(splitPara1, marginX, cursorY);
    cursorY += splitPara1.length * 4.6 + 2.5;

    const para2 = `Pelaksanaan pemilihan diselenggarakan secara Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER & JURDIL), dengan ketentuan setiap pemilih memiliki hak suara untuk memilih ${requiredChoices} (${getNumberInWords(
      requiredChoices
    )}) orang calon formatur dari total ${formaturs.length} (${getNumberInWords(
      formaturs.length
    )}) calon tetap formatur.`;
    const splitPara2 = doc.splitTextToSize(para2, contentWidth);
    doc.text(splitPara2, marginX, cursorY);
    cursorY += splitPara2.length * 4.6 + 4.5;

    // SECTION I: DATA REKAPITULASI PEMILIH & SUARA MASUK
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('I. DATA REKAPITULASI PEMILIH & SUARA MASUK', marginX, cursorY);
    cursorY += 3.5;

    // Table I: Columns: No (10mm), Uraian (98mm), Jumlah (40mm), Satuan (30mm) = 178mm
    const colI = { no: 10, uraian: 98, jumlah: 40, satuan: 30 };
    const rowHeightI = 5.2;

    // Header Table I
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.2);
    doc.rect(marginX, cursorY, contentWidth, rowHeightI, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('No', marginX + colI.no / 2, cursorY + 3.6, { align: 'center' });
    doc.text('Uraian Rekapitulasi Suara', marginX + colI.no + 3, cursorY + 3.6);
    doc.text(
      'Jumlah',
      marginX + colI.no + colI.uraian + colI.jumlah - 4,
      cursorY + 3.6,
      { align: 'right' }
    );
    doc.text(
      'Satuan',
      marginX + colI.no + colI.uraian + colI.jumlah + colI.satuan / 2,
      cursorY + 3.6,
      { align: 'center' }
    );

    cursorY += rowHeightI;

    const dataRekap = [
      {
        no: '1',
        label: 'Jumlah Pemilih Terdaftar dalam DPT',
        value: String(stats?.totalVoters || 0),
        unit: 'Pemilih',
      },
      {
        no: '2',
        label: 'Pemilih yang Menggunakan Hak Suara',
        value: String(stats?.votedCount || 0),
        unit: 'Pemilih',
      },
      {
        no: '3',
        label: 'Pemilih yang Tidak Menggunakan Hak Suara',
        value: String(stats?.notVotedCount || 0),
        unit: 'Pemilih',
      },
      {
        no: '4',
        label: 'Persentase Partisipasi Pemilih',
        value: `${stats?.participationPercentage || 0}%`,
        unit: 'Persen',
      },
      {
        no: '5',
        label: 'Total Akumulasi Suara Sah yang Masuk',
        value: String(totalVotesCast),
        unit: 'Suara Sah',
        highlight: true,
      },
    ];

    dataRekap.forEach((row) => {
      if (row.highlight) {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.rect(marginX, cursorY, contentWidth, rowHeightI, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(marginX, cursorY, contentWidth, rowHeightI, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
      }

      // Vertical separators
      doc.line(marginX + colI.no, cursorY, marginX + colI.no, cursorY + rowHeightI);
      doc.line(
        marginX + colI.no + colI.uraian,
        cursorY,
        marginX + colI.no + colI.uraian,
        cursorY + rowHeightI
      );
      doc.line(
        marginX + colI.no + colI.uraian + colI.jumlah,
        cursorY,
        marginX + colI.no + colI.uraian + colI.jumlah,
        cursorY + rowHeightI
      );

      doc.setFontSize(9);
      doc.text(row.no, marginX + colI.no / 2, cursorY + 3.6, { align: 'center' });
      doc.text(row.label, marginX + colI.no + 3, cursorY + 3.6);
      doc.text(
        row.value,
        marginX + colI.no + colI.uraian + colI.jumlah - 4,
        cursorY + 3.6,
        { align: 'right' }
      );
      doc.text(
        row.unit,
        marginX + colI.no + colI.uraian + colI.jumlah + colI.satuan / 2,
        cursorY + 3.6,
        { align: 'center' }
      );

      cursorY += rowHeightI;
    });

    cursorY += 4.5;

    // SECTION II: HASIL PEROLEHAN SUARA & PENETAPAN FORMATUR TERPILIH
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(
      'II. HASIL PEROLEHAN SUARA & PENETAPAN FORMATUR TERPILIH',
      marginX,
      cursorY
    );
    cursorY += 3.5;

    // Table II Columns:
    // Rank (12mm), No. Urut (16mm), Nama (66mm), Suara (28mm), Persen (20mm), Status (36mm) = 178mm
    const colII = {
      rank: 12,
      noUrut: 16,
      nama: 66,
      suara: 28,
      persen: 20,
      status: 36,
    };
    const rowHeightII = 5.0;

    // Header Table II
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, cursorY, contentWidth, rowHeightII, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Rank', marginX + colII.rank / 2, cursorY + 3.4, { align: 'center' });
    doc.text(
      'No. Urut',
      marginX + colII.rank + colII.noUrut / 2,
      cursorY + 3.4,
      { align: 'center' }
    );
    doc.text(
      'Nama Calon Formatur',
      marginX + colII.rank + colII.noUrut + 3,
      cursorY + 3.4
    );
    doc.text(
      'Perolehan Suara',
      marginX + colII.rank + colII.noUrut + colII.nama + colII.suara / 2,
      cursorY + 3.4,
      { align: 'center' }
    );
    doc.text(
      'Persentase',
      marginX +
        colII.rank +
        colII.noUrut +
        colII.nama +
        colII.suara +
        colII.persen / 2,
      cursorY + 3.4,
      { align: 'center' }
    );
    doc.text(
      'Status Penetapan',
      marginX +
        colII.rank +
        colII.noUrut +
        colII.nama +
        colII.suara +
        colII.persen +
        colII.status / 2,
      cursorY + 3.4,
      { align: 'center' }
    );

    cursorY += rowHeightII;

    // Rows Table II
    sortedFormaturs.forEach((formatur, idx) => {
      const isElected =
        totalVotesCast > 0 &&
        idx < requiredChoices &&
        (formatur.votes_count || 0) > 0;
      const percentage =
        totalVotesCast > 0
          ? ((formatur.votes_count / totalVotesCast) * 100).toFixed(1)
          : '0.0';

      if (isElected) {
        doc.setFillColor(240, 253, 244); // light emerald-50
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(marginX, cursorY, contentWidth, rowHeightII, 'FD');

      // Grid dividers
      let xAcc = marginX;
      xAcc += colII.rank;
      doc.line(xAcc, cursorY, xAcc, cursorY + rowHeightII);
      xAcc += colII.noUrut;
      doc.line(xAcc, cursorY, xAcc, cursorY + rowHeightII);
      xAcc += colII.nama;
      doc.line(xAcc, cursorY, xAcc, cursorY + rowHeightII);
      xAcc += colII.suara;
      doc.line(xAcc, cursorY, xAcc, cursorY + rowHeightII);
      xAcc += colII.persen;
      doc.line(xAcc, cursorY, xAcc, cursorY + rowHeightII);

      doc.setFont('helvetica', isElected ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(
        isElected ? 6 : 51,
        isElected ? 95 : 65,
        isElected ? 70 : 85
      );

      // Rank
      doc.text(`#${idx + 1}`, marginX + colII.rank / 2, cursorY + 3.4, {
        align: 'center',
      });

      // No. Urut
      doc.text(
        `[${String(formatur.number).padStart(2, '0')}]`,
        marginX + colII.rank + colII.noUrut / 2,
        cursorY + 3.4,
        { align: 'center' }
      );

      // Name
      doc.text(
        formatur.name,
        marginX + colII.rank + colII.noUrut + 3,
        cursorY + 3.4
      );

      // Suara
      doc.text(
        `${formatur.votes_count} Suara`,
        marginX + colII.rank + colII.noUrut + colII.nama + colII.suara / 2,
        cursorY + 3.4,
        { align: 'center' }
      );

      // Persen
      doc.text(
        `${percentage}%`,
        marginX +
          colII.rank +
          colII.noUrut +
          colII.nama +
          colII.suara +
          colII.persen / 2,
        cursorY + 3.4,
        { align: 'center' }
      );

      // Status
      if (isElected) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 120, 87);
        doc.text(
          'TERPILIH (FORMATUR)',
          marginX +
            colII.rank +
            colII.noUrut +
            colII.nama +
            colII.suara +
            colII.persen +
            colII.status / 2,
          cursorY + 3.4,
          { align: 'center' }
        );
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          'Belum Terpilih',
          marginX +
            colII.rank +
            colII.noUrut +
            colII.nama +
            colII.suara +
            colII.persen +
            colII.status / 2,
          cursorY + 3.4,
          { align: 'center' }
        );
      }

      cursorY += rowHeightII;
    });

    drawFooter();

    // =========================================================================
    // PAGE 2: PENETAPAN & TANDA TANGAN PANLIH (STANDAR KERTAS A4)
    // =========================================================================
    doc.addPage('a4', 'portrait');
    let cursorY2 = drawKopSurat(10);

    cursorY2 += 6;

    // Redaksi Penetapan (Font Size 12)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);

    const paraPage2A = `Berdasarkan hasil perhitungan suara yang dihimpun secara sah melalui sistem e-Voting, Panitia Pemilihan menetapkan ${requiredChoices} (${getNumberInWords(
      requiredChoices
    )}) nama calon formatur dengan perolehan suara terbanyak (Peringkat 1 sampai dengan Peringkat ${requiredChoices}) secara resmi sebagai Anggota Formatur Terpilih Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang ${periodText}.`;
    const splitPara2A = doc.splitTextToSize(paraPage2A, contentWidth);
    doc.text(splitPara2A, marginX, cursorY2);
    cursorY2 += splitPara2A.length * 5.0 + 4.5;

    const paraPage2B = `Anggota Formatur Terpilih tersebut selanjutnya bertugas mengadakan Rapat Formatur untuk bermusyawarah dan menetapkan Ketua Umum beserta susunan personalia lengkap Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang untuk masa amanah kepengurusan berikutnya.`;
    const splitPara2B = doc.splitTextToSize(paraPage2B, contentWidth);
    doc.text(splitPara2B, marginX, cursorY2);
    cursorY2 += splitPara2B.length * 5.0 + 4.5;

    const paraPage2C = `Demikian Berita Acara ini dibuat dan disahkan dengan sebenar-benarnya serta dapat dipertanggungjawabkan di hadapan seluruh Peserta Musyawarah Cabang Ikatan Pelajar Muhammadiyah Sepanjang.`;
    const splitPara2C = doc.splitTextToSize(paraPage2C, contentWidth);
    doc.text(splitPara2C, marginX, cursorY2);
    cursorY2 += splitPara2C.length * 5.0 + 12;

    // Ditetapkan di & Tanggal (Right aligned)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const dateBoxX = pageWidth - marginX - 70;
    doc.text('Ditetapkan di', dateBoxX, cursorY2);
    doc.text(':', dateBoxX + 24, cursorY2);
    doc.setFont('helvetica', 'bold');
    doc.text('Sepanjang', dateBoxX + 27, cursorY2);
    cursorY2 += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.text('Pada tanggal', dateBoxX, cursorY2);
    doc.text(':', dateBoxX + 24, cursorY2);
    doc.setFont('helvetica', 'bold');
    doc.text(dateInfo.fullDateText, dateBoxX + 27, cursorY2);
    cursorY2 += 16;

    // Panitia Pemilihan Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(
      'PANITIA PEMILIHAN MUSYAWARAH CABANG',
      pageWidth / 2,
      cursorY2,
      { align: 'center' }
    );
    cursorY2 += 10;

    // 3 Signatures: Ketua Panlih, Sekretaris Panlih, Saksi Pemilihan
    const colWidthSig = contentWidth / 3;
    const col1X = marginX + colWidthSig * 0.5;
    const col2X = marginX + colWidthSig * 1.5;
    const col3X = marginX + colWidthSig * 2.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('Ketua Panlih,', col1X, cursorY2, { align: 'center' });
    doc.text('Sekretaris Panlih,', col2X, cursorY2, { align: 'center' });
    doc.text('Saksi Pemilihan,', col3X, cursorY2, { align: 'center' });

    cursorY2 += 28; // Space for signature

    // Signature lines (w=44mm each)
    const lineW = 44;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(col1X - lineW / 2, cursorY2, col1X + lineW / 2, cursorY2);
    doc.line(col2X - lineW / 2, cursorY2, col2X + lineW / 2, cursorY2);
    doc.line(col3X - lineW / 2, cursorY2, col3X + lineW / 2, cursorY2);

    cursorY2 += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text('NBA :', col1X - lineW / 2 + 2, cursorY2);
    doc.text('NBA :', col2X - lineW / 2 + 2, cursorY2);
    doc.text('NBA :', col3X - lineW / 2 + 2, cursorY2);

    drawFooter();

    // =========================================================================
    // SAVE & DIRECT DOWNLOAD TRIGGER
    // =========================================================================
    const filename = `Berita_Acara_Pemilihan_Formatur_IPM_Sepanjang_${dateInfo.fileDateSuffix}.pdf`;
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);

    return true;
  } catch (err) {
    console.error('Error generating PDF with jsPDF:', err);
    return false;
  }
};
