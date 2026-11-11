export type TeamId =
  | 'strategy'
  | 'benchmarking'
  | 'customer'
  | 'business'
  | 'financial'
  | 'stakeholder';

export type Accent = 'red' | 'blue' | 'green';

export interface Workgroup {
  id: TeamId;
  name: string;
  accent: Accent;
}

export interface Member {
  id: string;
  name: string;
  /** Asal BUMN atau unit kerja. */
  company: string;
  /** Peran dalam ALP. */
  role: string;
  teamId: TeamId;
  /** Ringkasan kontribusi utama, satu kalimat (tampil di kartu). */
  summary: string;
  /** Path foto di /public, mis. "/photos/anggota-01.jpg". Kosong atau gagal dimuat → inisial. */
  photo: string;
  bio: string;
  skills: string[];
  learningGoal: string;
  /** Opsional. Isi hanya bila tersedia dan disetujui pemiliknya. */
  linkedinUrl?: string;
  /** Opsional. Isi hanya bila tersedia dan disetujui pemiliknya. */
  cvUrl?: string;
}

export interface Mentor {
  id: string;
  name: string;
  /** Jabatan, mis. jabatan di Pertamina. */
  position: string;
  /** Direktorat, unit, atau institusi. */
  institution?: string;
  /** Bidang pendampingan kepada tim. */
  description: string;
  /** Opsional: area fokus pendampingan (tampil sebagai label). */
  focusAreas?: string[];
  /** Opsional: pesan atau kutipan mentor. Kosongkan bila belum ada yang disetujui. */
  message?: string;
  photo: string;
}

export interface Assistant {
  id: string;
  name: string;
  /** Institusi atau jabatan, jika tersedia. */
  institution?: string;
  /** Bentuk dukungan kepada tim. */
  description: string;
  photo: string;
}
