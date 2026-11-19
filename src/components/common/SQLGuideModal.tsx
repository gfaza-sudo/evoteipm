import React, { useState } from 'react';
import { Copy, Check, Database, ExternalLink, X, Code2 } from 'lucide-react';
import { SUPABASE_PROJECT_REF } from '../../lib/supabase';

interface SQLGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SQLGuideModal: React.FC<SQLGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedGrant, setCopiedGrant] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
-- E-VOTEIPM: DATABASE SCHEMA & MIGRATION SCRIPT FOR SUPABASE
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_name VARCHAR(255) NOT NULL DEFAULT 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang',
    org_logo TEXT DEFAULT 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80',
    org_logo_aspect VARCHAR(20) NOT NULL DEFAULT 'rectangle',
    org_logo_fit VARCHAR(20) NOT NULL DEFAULT 'contain',
    org_period VARCHAR(50) NOT NULL DEFAULT 'Periode 2026 - 2028',
    admin_username VARCHAR(100) NOT NULL DEFAULT 'admin',
    admin_password_hash TEXT NOT NULL DEFAULT '88c5ac40891d2b53180e83ad67104286465af8b548d681240487392da288d057',
    max_formatur_choices INT NOT NULL DEFAULT 7,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS org_logo_aspect VARCHAR(20) NOT NULL DEFAULT 'rectangle';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS org_logo_fit VARCHAR(20) NOT NULL DEFAULT 'contain';

-- 2. ASAL PIMPINAN
CREATE TABLE IF NOT EXISTS public.pimpinan_asal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    voter_quota INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pimpinan_asal ADD COLUMN IF NOT EXISTS voter_quota INT DEFAULT 3;

-- 3. PEMILIH / VOTERS
CREATE TABLE IF NOT EXISTS public.voters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(150) NOT NULL DEFAULT 'Peserta Musycab',
    pimpinan_id UUID REFERENCES public.pimpinan_asal(id) ON DELETE SET NULL,
    password_hash TEXT NOT NULL,
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,
    voted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CALON FORMATUR
CREATE TABLE IF NOT EXISTS public.formaturs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number INT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    photo_position VARCHAR(50) DEFAULT '50% 20%',
    photo_scale DOUBLE PRECISION DEFAULT 1.0,
    vision TEXT NOT NULL,
    mission TEXT NOT NULL,
    bio TEXT,
    votes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.formaturs ADD COLUMN IF NOT EXISTS photo_position VARCHAR(50) DEFAULT '50% 20%';
ALTER TABLE public.formaturs ADD COLUMN IF NOT EXISTS photo_scale DOUBLE PRECISION DEFAULT 1.0;

-- 5. KOTAK SUARA RAHASIA (SECRET BALLOT)
-- Tidak menyimpan voter_id untuk menjaga kerahasiaan pilihan pemilih!
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formatur_id UUID NOT NULL REFERENCES public.formaturs(id) ON DELETE CASCADE,
    cast_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. RPC FUNCTION TRANSAKSI PEMILIHAN (ATOMIC VOTE)
CREATE OR REPLACE FUNCTION public.submit_ballot(
    p_voter_id UUID,
    p_formatur_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_voted BOOLEAN;
    v_req_count INT;
    v_formatur_id UUID;
    v_actual_count INT;
BEGIN
    SELECT has_voted INTO v_has_voted
    FROM public.voters
    WHERE id = p_voter_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Data pemilih tidak ditemukan!');
    END IF;

    IF v_has_voted THEN
        RETURN jsonb_build_object('success', false, 'message', 'Hak suara sudah digunakan! Tidak dapat memilih kembali.');
    END IF;

    SELECT COALESCE(max_formatur_choices, 7) INTO v_req_count
    FROM public.settings
    LIMIT 1;
    IF v_req_count IS NULL THEN
        v_req_count := 7;
    END IF;

    v_actual_count := array_length(p_formatur_ids, 1);
    IF v_actual_count IS NULL OR v_actual_count != v_req_count THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda harus memilih tepat ' || v_req_count || ' formatur!');
    END IF;

    UPDATE public.voters
    SET has_voted = TRUE,
        voted_at = timezone('utc'::text, now())
    WHERE id = p_voter_id;

    FOREACH v_formatur_id IN ARRAY p_formatur_ids
    LOOP
        INSERT INTO public.votes (formatur_id) VALUES (v_formatur_id);
        UPDATE public.formaturs
        SET votes_count = votes_count + 1
        WHERE id = v_formatur_id;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi');
END;
$$;

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pimpinan_asal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formaturs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public update settings" ON public.settings;
CREATE POLICY "Public update settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read pimpinan" ON public.pimpinan_asal;
CREATE POLICY "Public read pimpinan" ON public.pimpinan_asal FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write pimpinan" ON public.pimpinan_asal;
CREATE POLICY "Allow write pimpinan" ON public.pimpinan_asal FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read voters" ON public.voters;
CREATE POLICY "Public read voters" ON public.voters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write voters" ON public.voters;
CREATE POLICY "Allow write voters" ON public.voters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read formaturs" ON public.formaturs;
CREATE POLICY "Public read formaturs" ON public.formaturs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write formaturs" ON public.formaturs;
CREATE POLICY "Allow write formaturs" ON public.formaturs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read votes" ON public.votes;
CREATE POLICY "Allow read votes" ON public.votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert votes" ON public.votes;
CREATE POLICY "Allow insert votes" ON public.votes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow delete votes" ON public.votes;
CREATE POLICY "Allow delete votes" ON public.votes FOR DELETE USING (true);

-- 7B. GRANT AKSES ROLE ANON & AUTHENTICATED (WAJIB UNTUK KLIEN SUPABASE)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.settings TO anon, authenticated;
GRANT ALL ON TABLE public.pimpinan_asal TO anon, authenticated;
GRANT ALL ON TABLE public.voters TO anon, authenticated;
GRANT ALL ON TABLE public.formaturs TO anon, authenticated;
GRANT ALL ON TABLE public.votes TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_ballot(UUID, UUID[]) TO anon, authenticated;

-- 8. INITIAL DATA
INSERT INTO public.settings (org_name, org_period, admin_username, admin_password_hash, max_formatur_choices)
SELECT 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang', 'Periode 2026 - 2028', 'admin', '88c5ac40891d2b53180e83ad67104286465af8b548d681240487392da288d057', 7
WHERE NOT EXISTS (SELECT 1 FROM public.settings);
`;

  const grantOnlyScript = `GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.settings TO anon, authenticated;
GRANT ALL ON TABLE public.pimpinan_asal TO anon, authenticated;
GRANT ALL ON TABLE public.voters TO anon, authenticated;
GRANT ALL ON TABLE public.formaturs TO anon, authenticated;
GRANT ALL ON TABLE public.votes TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_ballot(UUID, UUID[]) TO anon, authenticated;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyGrant = () => {
    navigator.clipboard.writeText(grantOnlyScript);
    setCopiedGrant(true);
    setTimeout(() => setCopiedGrant(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Skrip SQL Migrasi Supabase</h3>
              <p className="text-xs text-slate-500">
                Jalankan script ini di SQL Editor pada dashboard Supabase project Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 flex-1">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Code2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-semibold mb-1">Panduan 3 Langkah Cepat:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Buka dashboard Supabase Anda di URL project yang telah ditentukan.</li>
                <li>Pilih menu <strong>SQL Editor</strong> di bilah kiri &rarr; <strong>New Query</strong>.</li>
                <li>Klik tombol <strong>Salin Seluruh SQL</strong> di bawah, paste ke editor Supabase, lalu tekan tombol <strong>Run</strong>.</li>
              </ol>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">
                Jika Tabel Sudah Dibuat (Mengatasi Error 42501 / Permission Denied):
              </span>
              <button
                type="button"
                onClick={handleCopyGrant}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-[11px] transition-colors"
              >
                {copiedGrant ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedGrant ? 'GRANT Tersalin!' : 'Salin GRANT Cepat'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto">
              {grantOnlyScript}
            </pre>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                PostgreSQL Script (Tables, RPC & RLS)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh SQL'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-amber-400/90 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
              {sqlScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <a
            href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium underline"
          >
            <span>Buka SQL Editor Langsung di Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
