-- ====================================================================
-- E-VOTEIPM: DATABASE SCHEMA & MIGRATION SCRIPT FOR SUPABASE
-- Aplikasi Pemilihan Formatur Ikatan Pelajar Muhammadiyah (IPM)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE: settings (Pengaturan Organisasi & Sistem)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_name VARCHAR(255) NOT NULL DEFAULT 'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang',
    org_logo TEXT DEFAULT 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80',
    org_logo_aspect VARCHAR(20) NOT NULL DEFAULT 'rectangle',
    org_logo_fit VARCHAR(20) NOT NULL DEFAULT 'contain',
    org_period VARCHAR(50) NOT NULL DEFAULT 'Periode 2026 - 2028',
    admin_username VARCHAR(100) NOT NULL DEFAULT 'admin',
    admin_password_hash TEXT NOT NULL DEFAULT '88c5ac40891d2b53180e83ad67104286465af8b548d681240487392da288d057', -- default 'panlih123' sha256
    max_formatur_choices INT NOT NULL DEFAULT 7,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS org_logo_aspect VARCHAR(20) NOT NULL DEFAULT 'rectangle';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS org_logo_fit VARCHAR(20) NOT NULL DEFAULT 'contain';

-- 3. TABLE: pimpinan_asal (Asal Cabang / Ranting / Pimpinan)
CREATE TABLE IF NOT EXISTS public.pimpinan_asal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    voter_quota INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pimpinan_asal ADD COLUMN IF NOT EXISTS voter_quota INT DEFAULT 3;

-- 4. TABLE: voters (Data Pemilih / Peserta Musyda / Musycab)
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

-- 5. TABLE: formaturs (Calon Formatur IPM)
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

-- 6. TABLE: votes (Tabel Kotak Suara Rahasia - ASAS LUBER & JURDIL)
-- CATATAN PENTING KEAMANAN & KERAHASIAAN SUARA:
-- Tabel votes sengaja TIDAK MENYIMPAN voter_id agar pilihan pemilih bersifat rahasia (anonymized),
-- sesuai prinsip demokrasi pemilu. Status bahwa pemilih sudah memilih tersimpan di tabel voters(has_voted).
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formatur_id UUID NOT NULL REFERENCES public.formaturs(id) ON DELETE CASCADE,
    cast_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FUNCTION & RPC: submit_ballot
-- Mekanisme transaksi atomik anti-kecurangan:
-- 1. Memvalidasi bahwa voter belum pernah memilih (validasi tingkat database)
-- 2. Memvalidasi jumlah formatur yang dipilih harus persis sesuai max_formatur_choices (default 7)
-- 3. Mengubah has_voted = true dan mencatat voted_at
-- 4. Memasukkan suara ke tabel votes
-- 5. Mengupdate counter formaturs.votes_count
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
    -- 1. Cek status hak suara pemilih dengan row lock FOR UPDATE
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

    -- 2. Dapatkan batas formatur yang harus dipilih (default 7)
    SELECT COALESCE(max_formatur_choices, 7) INTO v_req_count
    FROM public.settings
    LIMIT 1;
    IF v_req_count IS NULL THEN
        v_req_count := 7;
    END IF;

    -- 3. Validasi jumlah pilihan
    v_actual_count := array_length(p_formatur_ids, 1);
    IF v_actual_count IS NULL OR v_actual_count != v_req_count THEN
        RETURN jsonb_build_object('success', false, 'message', 'Anda harus memilih tepat ' || v_req_count || ' formatur!');
    END IF;

    -- 4. Tandai pemilih telah memilih
    UPDATE public.voters
    SET has_voted = TRUE,
        voted_at = timezone('utc'::text, now())
    WHERE id = p_voter_id;

    -- 5. Masukkan pilihan suara rahasia dan update hitungan formatur
    FOREACH v_formatur_id IN ARRAY p_formatur_ids
    LOOP
        -- Insert vote anonymously
        INSERT INTO public.votes (formatur_id) VALUES (v_formatur_id);

        -- Update aggregator
        UPDATE public.formaturs
        SET votes_count = votes_count + 1
        WHERE id = v_formatur_id;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi');
END;
$$;

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pimpinan_asal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formaturs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Policies:
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

-- 8B. GRANT AKSES ROLE ANON & AUTHENTICATED (WAJIB UNTUK KLIEN SUPABASE)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.settings TO anon, authenticated;
GRANT ALL ON TABLE public.pimpinan_asal TO anon, authenticated;
GRANT ALL ON TABLE public.voters TO anon, authenticated;
GRANT ALL ON TABLE public.formaturs TO anon, authenticated;
GRANT ALL ON TABLE public.votes TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_ballot(UUID, UUID[]) TO anon, authenticated;

-- 9. SEED DATA DEFAULT (Inisialisasi Data Musyawarah IPM)
INSERT INTO public.settings (org_name, org_period, admin_username, admin_password_hash, max_formatur_choices)
SELECT
    'Pimpinan Cabang Ikatan Pelajar Muhammadiyah Sepanjang',
    'Periode 2026 - 2028',
    'admin',
    '88c5ac40891d2b53180e83ad67104286465af8b548d681240487392da288d057',
    7
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- Seed Asal Pimpinan
INSERT INTO public.pimpinan_asal (code, name, description, voter_quota) VALUES
('PC-KLJ', 'PC IPM Klojen', 'Pimpinan Cabang IPM Kecamatan Klojen', 3),
('PC-LKW', 'PC IPM Lowokwaru', 'Pimpinan Cabang IPM Kecamatan Lowokwaru', 3),
('PC-SKN', 'PC IPM Sukun', 'Pimpinan Cabang IPM Kecamatan Sukun', 2),
('PC-BLB', 'PC IPM Blimbing', 'Pimpinan Cabang IPM Kecamatan Blimbing', 2),
('PC-KDK', 'PC IPM Kedungkandang', 'Pimpinan Cabang IPM Kecamatan Kedungkandang', 2),
('PR-MMA', 'PR IPM MA Muhammadiyah 1', 'Pimpinan Ranting IPM MAM 1', 2),
('PR-SMA', 'PR IPM SMA Muhammadiyah 1', 'Pimpinan Ranting IPM SMAM 1', 2)
ON CONFLICT (code) DO NOTHING;

-- Seed 9 Calon Formatur
INSERT INTO public.formaturs (number, name, photo_url, vision, mission, bio) VALUES
(1, 'Ahmad Fauzi Rahman', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80', 'Mewujudkan Pelajar Muhammadiyah yang Unggul, Beradab, dan Berdaya Saing Digital.', '1. Mengoptimalkan kaderisasi berbasis minat dan bakat digital.\n2. Menguatkan literasi keislaman yang moderat dan berkemajuan.\n3. Membangun kolaborasi lintas organisasi pelajar se-daerah.', 'Ketua Bidang Perkaderan PC IPM Lowokwaru, Aktif di Komunitas Pelajar Menulis.'),
(2, 'Nabila Azzahra Putri', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80', 'IPM Progresif: Wadah Aktualisasi Pelajar Kritis, Kreatif, dan Solutif.', '1. Membuka ruang advokasi kesehatan mental dan perlindungan pelajar.\n2. Menumbuhkan kewirausahaan pelajar mandiri (Studentpreneur).\n3. Revitalisasi ranting IPM berbasis sekolah dan pesantren.', 'Sekretaris Umum PR IPM SMA Muhammadiyah 1, Duta Pelajar Berprestasi 2023.'),
(3, 'Muhammad Zaki Pratama', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80', 'Transformasi Gerakan Pelajar Menuju IPM yang Inklusif dan Berdampak Nyata.', '1. Digitalisasi administrasi dan keanggotaan IPM terpadu.\n2. Gerakan peduli lingkungan & aksi iklim pelajar (Green IPM).\n3. Penguatan riset dan pengembangan potensi cabang & ranting.', 'Ketua Umum PC IPM Klojen, Koordinator Gerakan Pelajar Tanggap Bencana.'),
(4, 'Siti Nur Kholifah', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80', 'Mengokohkan Karakter Pelajar Qurani yang Adaptif Terhadap Perkembangan Zaman.', '1. Gerakan Subuh Mengaji dan Tahfidz Pelajar IPM.\n2. Pelatihan public speaking dan kepemimpinan perempuan.\n3. Kolaborasi pemberdayaan pelajar rentan putus sekolah.', 'Kabid PIP PC IPM Sukun, Penulis Buku Antologi Puisi Pelajar.'),
(5, 'Rizky Aditya Wardana', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80', 'Membangun Ekosistem Pelajar Inovatif Berlandaskan Nilai Islam Berkemajuan.', '1. Mengembangkan inkubasi inovasi teknologi pelajar.\n2. Meningkatkan kompetisi olahraga dan seni antar ranting.\n3. Mempererat jejaring alumni dan stakeholder pendidikan.', 'Ketua Bidang ASBO PC IPM Blimbing, Juara Olimpiade Sains Pelajar.'),
(6, 'Fathimah Zahra Al-Munawwarah', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80', 'Kader IPM Berintegritas, Mandiri, dan Membawa Perubahan Sosial.', '1. Menggalakkan kampanye anti-bullying dan anti-narkoba di sekolah.\n2. Pelatihan kepemimpinan dan manajemen organisasi modern.\n3. Optimalisasi media dakwah kreatif di TikTok dan Instagram.', 'Kabid KDI PC IPM Kedungkandang, Penggiat Media Kreatif Pelajar.'),
(7, 'Ilham Bintang Kusuma', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80', 'Meneguhkan Tri Kompetensi IPM: Religiusitas, Intelektualitas, dan Humanitas.', '1. Sekolah kader pimpinan tingkat daerah yang terstandarisasi.\n2. Forum diskusi pelajar lintas isu kebangsaan dan sains.\n3. Program beasiswa dan pendampingan pelajar berprestasi.', 'Kabid Kader PD IPM, Mahasiswa Berprestasi Universitas Muhammadiyah.'),
(8, 'Dinda Aulia Rahmah', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80', 'IPM Ramah Pelajar: Merangkul, Menginspirasi, dan Menggerakkan.', '1. Pendirian konseling sebaya di setiap cabang dan ranting.\n2. Pekan kreasi seni dan budaya islami pelajar tahunan.\n3. Penguatan basis data kader dan alumni secara terintegrasi.', 'Ketua PR IPM MAM 1, Penggerak Komunitas Literasi Pelajar.'),
(9, 'Bayu Saputra Maulana', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80', 'Pelajar Muhammadiyah Pelopor Kebaikan dan Tanggap Terhadap Tantangan Masa Depan.', '1. Pelatihan kecerdasan buatan (AI) etis untuk pelajar.\n2. Memperluas bakti sosial dan aksi kerelawanan pelajar peduli.\n3. Harmonisasi gerakan dengan Ortom Muhammadiyah lainnya.', 'Kabid Advokasi PC IPM Lowokwaru, Relawan Muhammadiyah Disaster Management.')
ON CONFLICT (number) DO NOTHING;
