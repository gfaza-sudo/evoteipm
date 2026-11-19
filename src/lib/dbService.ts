import { AppSettings, Formatur, PimpinanAsal, Voter, VoteStats } from '../types';
import { INITIAL_FORMATURS, INITIAL_PIMPINAN, INITIAL_SETTINGS, INITIAL_VOTERS } from './initialData';
import { checkSupabaseStatus, formatSupabaseError, hashPassword, supabase } from './supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(val?: string | null): val is string {
  return Boolean(val && UUID_REGEX.test(val));
}

const LOCAL_STORAGE_KEYS = {
  SETTINGS: 'evote_settings',
  PIMPINAN: 'evote_pimpinan',
  FORMATURS: 'evote_formaturs',
  VOTERS: 'evote_voters',
  VOTES: 'evote_votes_log',
};

// Safe localStorage helper to prevent QuotaExceededError crashes
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`localStorage quota exceeded or failed on key "${key}":`, err);
  }
}

export interface BallotRecord {
  id: string;
  voter_id: string;
  formatur_ids: string[];
  created_at: string;
}

// In-memory or localStorage cache helper
class DBService {
  private isSupabaseReady: boolean | null = null;

  async initStatus(): Promise<{ connected: boolean; tablesReady: boolean; error?: string }> {
    const status = await checkSupabaseStatus();
    this.isSupabaseReady = status.tablesReady;
    return status;
  }

  // --- SETTINGS ---
  async getSettings(): Promise<AppSettings> {
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (!error && data) {
        this.isSupabaseReady = true;
        const result: AppSettings = {
          id: data.id,
          org_name: data.org_name,
          org_logo: data.org_logo || INITIAL_SETTINGS.org_logo,
          org_logo_aspect: data.org_logo_aspect || INITIAL_SETTINGS.org_logo_aspect || 'rectangle',
          org_logo_fit: data.org_logo_fit || INITIAL_SETTINGS.org_logo_fit || 'contain',
          org_period: data.org_period,
          admin_username: data.admin_username,
          admin_password_hash: data.admin_password_hash,
          max_formatur_choices: data.max_formatur_choices || 7,
          updated_at: data.updated_at,
        };
        safeSetItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(result));
        return result;
      }
    } catch (e) {
      console.warn('Fallback to local settings:', e);
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (!parsed.org_name || parsed.org_name.includes('Kota Malang')) {
          parsed.org_name = INITIAL_SETTINGS.org_name;
        }
        if (parsed.admin_password_hash === '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9') {
          parsed.admin_password_hash = INITIAL_SETTINGS.admin_password_hash;
        }
        if (!parsed.org_logo_aspect) {
          parsed.org_logo_aspect = 'rectangle';
        }
        if (!parsed.org_logo_fit) {
          parsed.org_logo_fit = 'contain';
        }
        localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
        return parsed;
      } catch {}
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    return { ...INITIAL_SETTINGS };
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    const fullPayload = {
      org_name: updated.org_name,
      org_logo: updated.org_logo,
      org_logo_aspect: updated.org_logo_aspect || 'rectangle',
      org_logo_fit: updated.org_logo_fit || 'contain',
      org_period: updated.org_period,
      admin_username: updated.admin_username,
      admin_password_hash: updated.admin_password_hash,
      max_formatur_choices: updated.max_formatur_choices,
      updated_at: updated.updated_at,
    };
    const basePayload = {
      org_name: updated.org_name,
      org_logo: updated.org_logo,
      org_period: updated.org_period,
      admin_username: updated.admin_username,
      admin_password_hash: updated.admin_password_hash,
      max_formatur_choices: updated.max_formatur_choices,
      updated_at: updated.updated_at,
    };

    // Always persist directly to connected Supabase client
    let targetId = isValidUuid(current.id) ? current.id : null;
    if (!targetId) {
      const { data: existingRow, error: checkErr } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (checkErr) {
        throw new Error(formatSupabaseError(checkErr, 'settings'));
      }
      if (existingRow?.id) {
        targetId = existingRow.id;
      }
    }

    if (targetId) {
      let { error } = await supabase.from('settings').update(fullPayload).eq('id', targetId);
      if (error && error.message?.includes('column')) {
        ({ error } = await supabase.from('settings').update(basePayload).eq('id', targetId));
      }
      if (error) {
        throw new Error(formatSupabaseError(error, 'settings'));
      }
      updated.id = targetId;
    } else {
      let res = await supabase.from('settings').insert(fullPayload).select().single();
      if (res.error && res.error.message?.includes('column')) {
        res = await supabase.from('settings').insert(basePayload).select().single();
      }
      if (res.error) {
        throw new Error(formatSupabaseError(res.error, 'settings'));
      }
      if (res.data?.id) {
        updated.id = res.data.id;
      }
    }

    this.isSupabaseReady = true;
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // --- ASAL PIMPINAN ---
  async getPimpinanList(): Promise<PimpinanAsal[]> {
    try {
      const { data, error } = await supabase
        .from('pimpinan_asal')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        this.isSupabaseReady = true;
        safeSetItem(LOCAL_STORAGE_KEYS.PIMPINAN, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Fallback to local pimpinan:', e);
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.PIMPINAN);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.PIMPINAN, JSON.stringify(INITIAL_PIMPINAN));
    return [...INITIAL_PIMPINAN];
  }

  async createPimpinan(item: Omit<PimpinanAsal, 'id' | 'created_at'>): Promise<PimpinanAsal> {
    const code = item.code.trim().toUpperCase();
    const name = item.name.trim();
    const description = item.description?.trim() || '';
    const voterQuota = item.voter_quota ?? 3;

    let res = await supabase
      .from('pimpinan_asal')
      .insert({
        code,
        name,
        description,
        voter_quota: voterQuota,
      })
      .select()
      .single();

    if (res.error && res.error.message?.includes('column')) {
      res = await supabase
        .from('pimpinan_asal')
        .insert({
          code,
          name,
          description,
        })
        .select()
        .single();
    }

    if (res.error) {
      throw new Error(formatSupabaseError(res.error, 'pimpinan_asal'));
    }

    this.isSupabaseReady = true;
    return res.data;
  }

  async updatePimpinan(id: string, updates: Partial<PimpinanAsal>): Promise<void> {
    if (!isValidUuid(id)) {
      throw new Error('ID pimpinan belum tersinkron dengan Supabase. Silakan muat ulang halaman.');
    }

    let { error } = await supabase.from('pimpinan_asal').update(updates).eq('id', id);
    if (error && error.message?.includes('column')) {
      const { voter_quota: _vq, ...fallbackUpdates } = updates as any;
      ({ error } = await supabase.from('pimpinan_asal').update(fallbackUpdates).eq('id', id));
    }

    if (error) {
      throw new Error(formatSupabaseError(error, 'pimpinan_asal'));
    }

    this.isSupabaseReady = true;
  }

  async deletePimpinan(id: string): Promise<void> {
    if (isValidUuid(id)) {
      const { error } = await supabase.from('pimpinan_asal').delete().eq('id', id);
      if (error) {
        throw new Error(formatSupabaseError(error, 'pimpinan_asal'));
      }
      this.isSupabaseReady = true;
    }

    const list = await this.getPimpinanList();
    const filtered = list.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.PIMPINAN, JSON.stringify(filtered));
  }

  /**
   * Mengubah jumlah pemilih utusan untuk sebuah Asal Pimpinan
   * Jika jumlah dinaikkan: membuat akun pemilih baru secara otomatis
   * Jika jumlah diturunkan: menghapus pemilih yang belum memilih sesuai selisih
   */
  async adjustVoterCountForPimpinan(pimpinanId: string, targetCount: number): Promise<void> {
    const safeTarget = Math.max(0, Math.floor(Number(targetCount)));
    const pimpinanList = await this.getPimpinanList();
    const pimpinan = pimpinanList.find((p) => p.id === pimpinanId);
    if (!pimpinan) return;

    // Simpan kuota baru pada data pimpinan
    await this.updatePimpinan(pimpinanId, { voter_quota: safeTarget });

    const voters = await this.getVoters();
    const currentPimpinanVoters = voters.filter((v) => v.pimpinan_id === pimpinanId);
    const currentCount = currentPimpinanVoters.length;

    if (safeTarget > currentCount) {
      // Tambah akun pemilih baru sesuai kekurangan kuota
      const needed = safeTarget - currentCount;
      const cleanCode = (pimpinan.code || 'IPM').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const existingIds = new Set(voters.map((v) => v.user_id.toUpperCase()));
      let seq = currentCount;
      for (let i = 1; i <= needed; i++) {
        seq += 1;
        let userId = `${cleanCode}-${String(seq).padStart(3, '0')}`;
        while (existingIds.has(userId)) {
          seq += 1;
          userId = `${cleanCode}-${String(seq).padStart(3, '0')}`;
        }
        existingIds.add(userId);
        await this.createVoter({
          user_id: userId,
          name: `Utusan ${pimpinan.name} #${seq}`,
          position: 'Peserta Utusan',
          pimpinan_id: pimpinanId,
          passwordPlain: 'pemilih123',
        });
      }
    } else if (safeTarget < currentCount) {
      // Hapus hanya akun yang belum menggunakan hak suara
      const unvoted = currentPimpinanVoters.filter((v) => !v.has_voted);
      const toRemoveCount = currentCount - safeTarget;
      const toRemove = unvoted.slice(-toRemoveCount);
      for (const voter of toRemove) {
        await this.deleteVoter(voter.id);
      }
    }
  }

  // --- CALON FORMATUR ---
  async getFormaturs(): Promise<Formatur[]> {
    try {
      const { data, error } = await supabase
        .from('formaturs')
        .select('*')
        .order('number', { ascending: true });
      if (!error && data) {
        this.isSupabaseReady = true;
        safeSetItem(LOCAL_STORAGE_KEYS.FORMATURS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Fallback to local formaturs:', e);
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.FORMATURS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.FORMATURS, JSON.stringify(INITIAL_FORMATURS));
    return [...INITIAL_FORMATURS];
  }

  async createFormatur(item: Omit<Formatur, 'id' | 'votes_count' | 'created_at'>): Promise<Formatur> {
    const payload = {
      number: Number(item.number),
      name: item.name.trim(),
      photo_url: item.photo_url || '',
      photo_position: item.photo_position || '50% 20%',
      photo_scale: item.photo_scale || 1.0,
      vision: item.vision.trim(),
      mission: item.mission.trim(),
      bio: item.bio?.trim() || '',
      votes_count: 0,
    };

    let res = await supabase.from('formaturs').insert(payload).select().single();
    if (res.error && res.error.message?.includes('column')) {
      const { photo_position: _pos, photo_scale: _scale, ...fallbackPayload } = payload;
      res = await supabase.from('formaturs').insert(fallbackPayload).select().single();
    }

    if (res.error) {
      throw new Error(formatSupabaseError(res.error, 'formaturs'));
    }

    this.isSupabaseReady = true;
    return res.data;
  }

  async updateFormatur(id: string, updates: Partial<Formatur>): Promise<void> {
    if (!isValidUuid(id)) {
      throw new Error('ID formatur belum tersinkron dengan Supabase. Silakan muat ulang halaman.');
    }

    const { id: _id, created_at: _ca, ...supabaseColumns } = updates as any;
    let { error } = await supabase.from('formaturs').update(supabaseColumns).eq('id', id);
    if (error && error.message?.includes('column')) {
      const { photo_position: _pos, photo_scale: _scale, ...fallbackColumns } = supabaseColumns;
      ({ error } = await supabase.from('formaturs').update(fallbackColumns).eq('id', id));
    }

    if (error) {
      throw new Error(formatSupabaseError(error, 'formaturs'));
    }

    this.isSupabaseReady = true;
  }

  async deleteFormatur(id: string): Promise<void> {
    if (isValidUuid(id)) {
      const { error } = await supabase.from('formaturs').delete().eq('id', id);
      if (error) {
        throw new Error(formatSupabaseError(error, 'formaturs'));
      }
      this.isSupabaseReady = true;
    }

    const list = await this.getFormaturs();
    const filtered = list.filter((f) => f.id !== id);
    safeSetItem(LOCAL_STORAGE_KEYS.FORMATURS, JSON.stringify(filtered));
  }

  // --- PEMILIH / VOTERS ---
  async getVoters(): Promise<Voter[]> {
    const pimpinanList = await this.getPimpinanList();
    const pimpinanMap = new Map(pimpinanList.map((p) => [p.id, p.name]));

    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        this.isSupabaseReady = true;
        const mapped = data.map((v: any) => ({
          ...v,
          pimpinan_name: v.pimpinan_id ? pimpinanMap.get(v.pimpinan_id) || 'Tidak Diketahui' : 'Tidak Diketahui',
        }));
        safeSetItem(LOCAL_STORAGE_KEYS.VOTERS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('Fallback to local voters:', e);
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.VOTERS);
    if (cached) {
      try {
        const list: Voter[] = JSON.parse(cached);
        return list.map((v) => ({
          ...v,
          pimpinan_name: v.pimpinan_id ? pimpinanMap.get(v.pimpinan_id) || v.pimpinan_name || '-' : v.pimpinan_name || '-',
        }));
      } catch {}
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.VOTERS, JSON.stringify(INITIAL_VOTERS));
    return [...INITIAL_VOTERS];
  }

  async createVoter(item: {
    user_id: string;
    name: string;
    position: string;
    pimpinan_id?: string;
    passwordPlain: string;
  }): Promise<Voter> {
    const pwdHash = await hashPassword(item.passwordPlain);
    const cleanPimpinanId = isValidUuid(item.pimpinan_id) ? item.pimpinan_id : null;

    const { data, error } = await supabase
      .from('voters')
      .insert({
        user_id: item.user_id.trim().toUpperCase(),
        name: item.name.trim(),
        position: item.position.trim(),
        pimpinan_id: cleanPimpinanId,
        password_hash: pwdHash,
        has_voted: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error, 'voters'));
    }

    this.isSupabaseReady = true;
    return data;
  }

  async updateVoter(
    id: string,
    updates: Partial<Voter> & { newPasswordPlain?: string }
  ): Promise<void> {
    if (!isValidUuid(id)) {
      throw new Error('ID pemilih belum tersinkron dengan Supabase. Silakan muat ulang halaman.');
    }

    const toUpdate: any = { ...updates };
    if (updates.newPasswordPlain && updates.newPasswordPlain.trim().length > 0) {
      toUpdate.password_hash = await hashPassword(updates.newPasswordPlain.trim());
    }
    delete toUpdate.newPasswordPlain;
    delete toUpdate.pimpinan_name;
    delete toUpdate.id;
    delete toUpdate.created_at;

    if ('pimpinan_id' in toUpdate) {
      toUpdate.pimpinan_id = isValidUuid(toUpdate.pimpinan_id) ? toUpdate.pimpinan_id : null;
    }

    const { error } = await supabase.from('voters').update(toUpdate).eq('id', id);
    if (error) {
      throw new Error(formatSupabaseError(error, 'voters'));
    }

    this.isSupabaseReady = true;
  }

  // --- SURAT SUARA / BALLOTS REKAPITULASI REAL-TIME ---
  async getBallots(): Promise<BallotRecord[]> {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.VOTES);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  async saveBallots(ballots: BallotRecord[]): Promise<void> {
    safeSetItem(LOCAL_STORAGE_KEYS.VOTES, JSON.stringify(ballots));
  }

  async syncVotesWithVoters(): Promise<{ formaturs: Formatur[]; totalVotes: number }> {
    try {
      const [votersRes, formatursRes, votesRes] = await Promise.all([
        supabase.from('voters').select('id, has_voted'),
        supabase.from('formaturs').select('*').order('number', { ascending: true }),
        supabase.from('votes').select('id, formatur_id'),
      ]);

      if (!votersRes.error && !formatursRes.error && !votesRes.error && formatursRes.data) {
        this.isSupabaseReady = true;
        const supaVoters = votersRes.data || [];
        const supaFormaturs: Formatur[] = formatursRes.data || [];
        let supaVotes = votesRes.data || [];

        const votedCount = supaVoters.filter((v: any) => v.has_voted).length;

        // Jika tidak ada pemilih yang berstatus sudah memilih, pastikan tabel votes bersih
        if (votedCount === 0 && supaVotes.length > 0) {
          const { error: cleanErr } = await supabase
            .from('votes')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          if (cleanErr) {
            throw new Error(formatSupabaseError(cleanErr, 'votes'));
          }
          supaVotes = [];
        }

        // Hitung ulang perolehan suara setiap formatur langsung dari tabel votes
        const countsByFormatur = new Map<string, number>();
        for (const v of supaVotes as Array<{ formatur_id: string }>) {
          if (v.formatur_id) {
            countsByFormatur.set(v.formatur_id, (countsByFormatur.get(v.formatur_id) || 0) + 1);
          }
        }

        // Sinkronkan kolom votes_count pada tabel formaturs di Supabase jika berbeda
        for (const f of supaFormaturs) {
          const actualCount = countsByFormatur.get(f.id) || 0;
          if ((f.votes_count || 0) !== actualCount) {
            const { error: updErr } = await supabase
              .from('formaturs')
              .update({ votes_count: actualCount })
              .eq('id', f.id);
            if (updErr) {
              throw new Error(formatSupabaseError(updErr, 'formaturs'));
            }
            f.votes_count = actualCount;
          }
        }

        safeSetItem(LOCAL_STORAGE_KEYS.FORMATURS, JSON.stringify(supaFormaturs));
        const totalVotes = supaFormaturs.reduce((acc, f) => acc + (f.votes_count || 0), 0);
        return { formaturs: supaFormaturs, totalVotes };
      }
    } catch (err: any) {
      // Lempar ulang error Supabase bila merupakan error izin/tabel eksplisit saat aksi tulis
      if (err?.message && this.isSupabaseReady) {
        throw err;
      }
      console.warn('Supabase syncVotesWithVoters fallback to local:', err);
    }

    const voters = await this.getVoters();
    let ballots = await this.getBallots();

    // Read formaturs
    let formaturs: Formatur[] = [];
    const cachedFormaturs = localStorage.getItem(LOCAL_STORAGE_KEYS.FORMATURS);
    if (cachedFormaturs) {
      try {
        formaturs = JSON.parse(cachedFormaturs);
      } catch {}
    }
    if (!formaturs || formaturs.length === 0) {
      formaturs = [...INITIAL_FORMATURS];
    }

    // Set of voters who currently have has_voted = true
    const votedVoterIds = new Set(voters.filter((v) => v.has_voted).map((v) => v.id));

    // Keep ONLY ballots belonging to existing voters who are still marked as has_voted
    ballots = ballots.filter((b) => votedVoterIds.has(b.voter_id));

    // For any voter that has has_voted = true but no ballot recorded yet, create deterministic ballot
    const existingBallotVoterIds = new Set(ballots.map((b) => b.voter_id));
    voters.forEach((v, idx) => {
      if (v.has_voted && !existingBallotVoterIds.has(v.id)) {
        const choices: string[] = [];
        for (let i = 0; i < Math.min(7, formaturs.length); i++) {
          const fIdx = (idx + i) % formaturs.length;
          choices.push(formaturs[fIdx].id);
        }
        ballots.push({
          id: `b-auto-${v.id}`,
          voter_id: v.id,
          formatur_ids: choices,
          created_at: v.voted_at || new Date().toISOString(),
        });
      }
    });

    await this.saveBallots(ballots);

    // Recalculate votes_count for all formaturs directly from active ballots
    let totalVotes = 0;
    for (const f of formaturs) {
      f.votes_count = ballots.filter((b) => b.formatur_ids.includes(f.id)).length;
      totalVotes += f.votes_count;
    }

    safeSetItem(LOCAL_STORAGE_KEYS.FORMATURS, JSON.stringify(formaturs));
    return { formaturs, totalVotes };
  }

  async resetAllVotes(): Promise<void> {
    const { error: delVotesErr } = await supabase
      .from('votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (delVotesErr) {
      throw new Error(formatSupabaseError(delVotesErr, 'votes'));
    }

    const { error: resetVotersErr } = await supabase
      .from('voters')
      .update({ has_voted: false, voted_at: null })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (resetVotersErr) {
      throw new Error(formatSupabaseError(resetVotersErr, 'voters'));
    }

    const { error: resetFormatursErr } = await supabase
      .from('formaturs')
      .update({ votes_count: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (resetFormatursErr) {
      throw new Error(formatSupabaseError(resetFormatursErr, 'formaturs'));
    }

    this.isSupabaseReady = true;

    const voters = await this.getVoters();
    for (const v of voters) {
      v.has_voted = false;
      v.voted_at = null;
    }
    safeSetItem(LOCAL_STORAGE_KEYS.VOTERS, JSON.stringify(voters));
    await this.saveBallots([]);
    await this.syncVotesWithVoters();
  }

  async deleteVoter(id: string): Promise<void> {
    if (isValidUuid(id)) {
      const { error } = await supabase.from('voters').delete().eq('id', id);
      if (error) {
        throw new Error(formatSupabaseError(error, 'voters'));
      }
      this.isSupabaseReady = true;
    }

    const list = await this.getVoters();
    const filtered = list.filter((v) => v.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.VOTERS, JSON.stringify(filtered));

    // Remove ballot for this voter
    const ballots = await this.getBallots();
    const remaining = ballots.filter((b) => b.voter_id !== id);
    await this.saveBallots(remaining);
    await this.syncVotesWithVoters();
  }

  async resetVoterStatus(id: string): Promise<void> {
    if (!isValidUuid(id)) {
      throw new Error('ID pemilih tidak valid (bukan UUID Supabase). Silakan muat ulang data dari database.');
    }

    // Ambil data pemilih terlebih dahulu (untuk mengetahui voted_at bila tabel votes tidak memakai voter_id)
    const { data: existingVoter, error: fetchVoterErr } = await supabase
      .from('voters')
      .select('id, has_voted, voted_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchVoterErr) {
      throw new Error(formatSupabaseError(fetchVoterErr, 'voters'));
    }

    // 1. Hapus data suara pemilih di tabel votes (berdasarkan voter_id jika kolom tersedia)
    const { error: deleteVoteErr } = await supabase
      .from('votes')
      .delete()
      .eq('voter_id', id);

    const isMissingVoterIdCol =
      deleteVoteErr?.code === '42703' ||
      deleteVoteErr?.code === 'PGRST204' ||
      deleteVoteErr?.message?.toLowerCase().includes('voter_id');

    if (deleteVoteErr && !isMissingVoterIdCol) {
      throw new Error(formatSupabaseError(deleteVoteErr, 'votes'));
    }

    // Jika tabel votes tidak memiliki kolom voter_id (secret ballot), hapus baris votes milik sesi vote tersebut via cast_at = voted_at
    if (isMissingVoterIdCol && existingVoter?.voted_at) {
      const { error: deleteByTimeErr } = await supabase
        .from('votes')
        .delete()
        .eq('cast_at', existingVoter.voted_at);
      if (deleteByTimeErr) {
        throw new Error(formatSupabaseError(deleteByTimeErr, 'votes'));
      }
    }

    // 2. Perbarui status has_voted menjadi false (dan kosongkan voted_at) pada tabel voters
    let { data: updatedVoter, error: updateVoterErr } = await supabase
      .from('voters')
      .update({ has_voted: false, voted_at: null })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (updateVoterErr && updateVoterErr.message?.includes('voted_at')) {
      ({ data: updatedVoter, error: updateVoterErr } = await supabase
        .from('voters')
        .update({ has_voted: false })
        .eq('id', id)
        .select()
        .maybeSingle());
    }

    if (updateVoterErr) {
      throw new Error(formatSupabaseError(updateVoterErr, 'voters'));
    }

    if (!updatedVoter) {
      throw new Error('Data pemilih tidak ditemukan atau gagal direset di database Supabase.');
    }

    this.isSupabaseReady = true;

    const ballots = await this.getBallots();
    const remaining = ballots.filter((b) => b.voter_id !== id);
    await this.saveBallots(remaining);

    // 3. Hitung ulang dan sinkronkan perolehan suara pada tabel formaturs di Supabase
    await this.syncVotesWithVoters();
  }

  // --- STATISTIK ---
  async getStats(): Promise<VoteStats> {
    await this.syncVotesWithVoters();
    const [voters, pimpinan, formaturs] = await Promise.all([
      this.getVoters(),
      this.getPimpinanList(),
      this.getFormaturs(),
    ]);

    const totalVoters = voters.length;
    const votedCount = voters.filter((v) => v.has_voted).length;
    const notVotedCount = totalVoters - votedCount;
    const participationPercentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;
    const totalVotesCount = formaturs.reduce((acc, f) => acc + (f.votes_count || 0), 0);

    return {
      totalVoters,
      totalPimpinan: pimpinan.length,
      totalFormaturs: formaturs.length,
      votedCount,
      notVotedCount,
      participationPercentage,
      totalVotesCount,
    };
  }

  // --- VOTING AUTHENTICATION & SUBMISSION ---
  async voterLogin(userId: string, passwordPlain: string): Promise<{ success: boolean; voter?: Voter; message: string }> {
    const cleanUserId = userId.trim().toUpperCase();
    const pwdHash = await hashPassword(passwordPlain.trim());

    // 1. Try Supabase first if ready
    if (this.isSupabaseReady) {
      try {
        const { data, error } = await supabase
          .from('voters')
          .select('*, pimpinan_asal(name)')
          .ilike('user_id', cleanUserId)
          .maybeSingle();

        if (!error && data) {
          if (data.password_hash === pwdHash) {
            const voter: Voter = {
              id: data.id,
              user_id: data.user_id,
              name: data.name,
              position: data.position,
              pimpinan_id: data.pimpinan_id,
              pimpinan_name: data.pimpinan_asal?.name || 'Utusan Pimpinan',
              password_hash: data.password_hash,
              has_voted: data.has_voted,
              voted_at: data.voted_at,
              created_at: data.created_at,
            };
            return { success: true, voter, message: 'Login berhasil!' };
          } else {
            return { success: false, message: 'Password salah. Silakan coba kembali.' };
          }
        }
      } catch (err) {
        console.error('Supabase voter login error, fallback to local:', err);
      }
    }

    // 2. Fallback to local voters
    const voters = await this.getVoters();
    const voter = voters.find((v) => v.user_id.toUpperCase() === cleanUserId);

    if (!voter) {
      return { success: false, message: 'User ID tidak terdaftar dalam DPT!' };
    }

    if (voter.password_hash !== pwdHash) {
      return { success: false, message: 'Password yang Anda masukkan salah!' };
    }

    return { success: true, voter, message: 'Login berhasil!' };
  }

  /**
   * Cast Vote (Memilih 7 Formatur)
   * Enforces single-vote validation at database & atomic service level
   */
  async submitVote(voterId: string, formaturIds: string[]): Promise<{ success: boolean; message: string }> {
    const settings = await this.getSettings();
    const requiredChoices = settings.max_formatur_choices || 7;

    if (formaturIds.length !== requiredChoices) {
      return {
        success: false,
        message: `Anda harus memilih tepat ${requiredChoices} calon formatur!`,
      };
    }

    // Directly submit to Supabase when voterId is a Supabase UUID
    if (isValidUuid(voterId)) {
      const { data, error } = await supabase.rpc('submit_ballot', {
        p_voter_id: voterId,
        p_formatur_ids: formaturIds,
      });

      if (!error && data) {
        this.isSupabaseReady = true;
        if (data.success) {
          return { success: true, message: data.message };
        }
        return { success: false, message: data.message };
      }

      // Fallback to sequential Supabase inserts/updates only if RPC function is missing
      const isMissingRpc =
        error?.code === 'PGRST202' ||
        error?.code === '42883' ||
        error?.message?.toLowerCase().includes('could not find the function');

      if (!isMissingRpc && error) {
        return { success: false, message: formatSupabaseError(error, 'votes') };
      }

      const { data: voterCheck, error: checkErr } = await supabase
        .from('voters')
        .select('has_voted')
        .eq('id', voterId)
        .single();

      if (checkErr) {
        return { success: false, message: formatSupabaseError(checkErr, 'voters') };
      }

      if (voterCheck?.has_voted) {
        return { success: false, message: 'Anda sudah menggunakan hak suara sebelumnya!' };
      }

      const voteTimestamp = new Date().toISOString();
      const { error: updateVoterErr } = await supabase
        .from('voters')
        .update({ has_voted: true, voted_at: voteTimestamp })
        .eq('id', voterId);
      if (updateVoterErr) {
        return { success: false, message: formatSupabaseError(updateVoterErr, 'voters') };
      }

      const voteInserts = formaturIds.map((fId) => ({ formatur_id: fId, cast_at: voteTimestamp }));
      const { error: insertVotesErr } = await supabase.from('votes').insert(voteInserts);
      if (insertVotesErr) {
        return { success: false, message: formatSupabaseError(insertVotesErr, 'votes') };
      }

      for (const fId of formaturIds) {
        const { data: curr } = await supabase.from('formaturs').select('votes_count').eq('id', fId).single();
        if (curr) {
          await supabase
            .from('formaturs')
            .update({ votes_count: (curr.votes_count || 0) + 1 })
            .eq('id', fId);
        }
      }

      this.isSupabaseReady = true;
      return { success: true, message: 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi' };
    }

    // Local Storage Voting Execution
    const voters = await this.getVoters();
    const voter = voters.find((v) => v.id === voterId);

    if (!voter) {
      return { success: false, message: 'Data pemilih tidak ditemukan!' };
    }

    if (voter.has_voted) {
      return { success: false, message: 'Anda sudah menggunakan hak suara!' };
    }

    // Update voter status
    voter.has_voted = true;
    voter.voted_at = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEYS.VOTERS, JSON.stringify(voters));

    // Record ballot and sync formaturs dynamically
    const ballots = await this.getBallots();
    const remaining = ballots.filter((b) => b.voter_id !== voterId);
    remaining.push({
      id: `b-${voterId}-${Date.now()}`,
      voter_id: voterId,
      formatur_ids: formaturIds,
      created_at: voter.voted_at,
    });
    await this.saveBallots(remaining);
    await this.syncVotesWithVoters();

    return {
      success: true,
      message: 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi',
    };
  }
}

export const dbService = new DBService();
