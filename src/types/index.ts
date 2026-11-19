export interface PimpinanAsal {
  id: string;
  code: string;
  name: string;
  description?: string;
  voter_quota?: number; // Kuota / jumlah alokasi pemilih utusan
  created_at?: string;
}

export interface Voter {
  id: string;
  user_id: string; // e.g. "IPM-001" or NISN
  name: string;
  position: string; // e.g. "Ketua Ranting", "Sekretaris", "Peserta Musyda"
  pimpinan_id?: string;
  pimpinan_name?: string; // computed or joined
  password_hash: string;
  has_voted: boolean;
  voted_at?: string | null;
  created_at?: string;
}

export interface Formatur {
  id: string;
  number: number;
  name: string;
  photo_url?: string;
  photo_position?: string; // CSS object-position e.g. "50% 20%"
  photo_scale?: number; // scale multiplier e.g. 1.0 - 1.5
  vision: string;
  mission: string;
  bio?: string;
  votes_count: number;
  created_at?: string;
}

export interface AppSettings {
  id?: string;
  org_name: string;
  org_logo: string;
  org_logo_aspect?: 'rectangle' | 'square';
  org_logo_fit?: 'contain' | 'cover';
  org_period: string;
  admin_username: string;
  admin_password_hash: string;
  max_formatur_choices: number; // default 7
  updated_at?: string;
}

export interface VoteStats {
  totalVoters: number;
  totalPimpinan: number;
  totalFormaturs: number;
  votedCount: number;
  notVotedCount: number;
  participationPercentage: number;
  totalVotesCount: number;
}

export type UserRole = 'guest' | 'admin' | 'voter';
