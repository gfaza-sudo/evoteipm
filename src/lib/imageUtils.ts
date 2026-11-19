/**
 * Utility untuk pengolahan dan kompresi gambar client-side (browser canvas).
 * Mengonversi gambar ukuran besar (hingga 10MB) menjadi WebP/JPEG ringan (~30KB - 80KB)
 * dengan resolusi optimal agar tidak membebani localStorage dan database.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 1000, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan berkas gambar yang valid (JPG, PNG, WEBP).'));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas gambar. Silakan coba kembali.'));
    };

    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result !== 'string') {
        return reject(new Error('Format berkas gambar tidak terbaca.'));
      }

      const img = new Image();

      img.onerror = () => {
        reject(new Error('Gambar rusak atau format tidak didukung browser.'));
      };

      img.onload = () => {
        try {
          let { naturalWidth: width, naturalHeight: height } = img;
          if (!width || !height) {
            width = img.width || 600;
            height = img.height || 800;
          }

          // Hitung dimensi baru proporsional jika melebihi batas maksimal
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback ke string asli jika canvas tidak tersedia
            return resolve(result);
          }

          // Kualitas render tinggi
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Isi background putih untuk menghindari background hitam pada PNG transparan yang dikonversi ke JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Gambar foto calon
          ctx.drawImage(img, 0, 0, width, height);

          // Kompresi ke format JPEG dengan kualitas optimal
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err: any) {
          console.warn('Gagal kompresi canvas, menggunakan fallback:', err);
          resolve(result);
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format ukuran byte ke string human-readable (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
