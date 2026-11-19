import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://gcowwfmvpmjjvldfmmzl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjb3d3Zm12cG1qanZsZGZtbXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNzc3MjIsImV4cCI6MjExMDY1MzcyMn0.qdLElXivnj1dSn0-RHT2NJv3wc2SG8zza4e1EB21uBA';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isStaleProject = !envUrl || envUrl.includes('tpplvionzmkowyfsovzi');

export const SUPABASE_URL = isStaleProject ? DEFAULT_SUPABASE_URL : envUrl;
const SUPABASE_ANON_KEY = isStaleProject || !envKey ? DEFAULT_SUPABASE_ANON_KEY : envKey;

export const SUPABASE_PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split('.')[0] || 'gcowwfmvpmjjvldfmmzl';
  } catch {
    return 'gcowwfmvpmjjvldfmmzl';
  }
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Hash password securely with Web Crypto API (SHA-256)
 * Prevents plain-text password storage.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Translate common Supabase / PostgreSQL error codes into clear Indonesian messages
 */
export function formatSupabaseError(error: any, context?: string): string {
  const code = error?.code || '';
  const msg = String(error?.message || error || '');
  const lowerMsg = msg.toLowerCase();

  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('load failed') ||
    lowerMsg.includes('fetch')
  ) {
    return `Gagal terhubung ke server Supabase (${SUPABASE_URL}). Periksa koneksi internet Anda atau muat ulang halaman (Ctrl+R).`;
  }
  if (code === '42501' || lowerMsg.includes('permission denied')) {
    return `Akses database Supabase ditolak (42501${context ? ` pada tabel ${context}` : ''}). Jalankan perintah GRANT & RLS di SQL Editor Supabase terlebih dahulu (buka Pengaturan -> Skrip SQL Supabase).`;
  }
  if (code === 'PGRST205' || msg.includes('not find the table')) {
    return `Tabel${context ? ` "${context}"` : ''} belum dibuat di Supabase. Silakan jalankan skrip SQL migrasi di SQL Editor Supabase.`;
  }
  if (code === '23505' || lowerMsg.includes('duplicate key')) {
    return `Data duplikat terdeteksi (${context || 'kode / ID / nomor'} sudah terdaftar di Supabase). Gunakan nilai yang berbeda.`;
  }
  if (code === '22P02' || lowerMsg.includes('invalid input syntax for type uuid')) {
    return 'Referensi ID tidak valid (UUID). Segarkan halaman agar data tersinkron dengan Supabase.';
  }
  return msg || 'Terjadi kesalahan saat menyimpan data ke Supabase.';
}

/**
 * Checks if Supabase connection and tables are ready
 */
export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        return {
          connected: true,
          tablesReady: false,
          error:
            'Tabel sudah ada di Supabase, tetapi izin akses role anon belum diberikan (Error 42501). Jalankan perintah GRANT di SQL Editor Supabase.',
        };
      }
      if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
        return {
          connected: true,
          tablesReady: false,
          error: 'Tabel database belum dibuat di Supabase. Silakan jalankan script SQL migration di SQL Editor Supabase.',
        };
      }
      return {
        connected: false,
        tablesReady: false,
        error: error.message,
      };
    }
    return {
      connected: true,
      tablesReady: true,
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesReady: false,
      error: err?.message || 'Gagal terhubung ke Supabase.',
    };
  }
}
