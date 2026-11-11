import type { TeamId } from './team';

export type DeliverableStatus = 'planned' | 'in-progress' | 'review' | 'done';
export type FindingStatus = 'draft' | 'validated';

export interface FrameworkStep {
  title: string;
  description: string;
  /** Metode atau alat bantu yang dipakai pada tahap ini. */
  tools: string[];
  /** Keluaran tahap ini. */
  output: string;
}

export interface Finding {
  title: string;
  detail: string;
  status: FindingStatus;
}

export interface Deliverable {
  title: string;
  status: DeliverableStatus;
  /** Tanggal target, format bebas (mis. "24 Okt 2026"). Kosongkan bila belum ditetapkan. */
  due?: string;
}

export interface Collaboration {
  team: TeamId;
  /** Apa yang diterima dari / diberikan kepada kelompok tersebut. */
  note: string;
}

export interface WorkstreamDocument {
  title: string;
  /** Tautan https:// atau file lokal di /public (mis. "/docs/peta-proses.pdf"). */
  href: string;
}

export interface Workstream {
  /** Bagian URL: /kelompok-kerja/{slug}. */
  slug: string;
  teamId: TeamId;
  title: string;
  summary: string;
  /** Pertanyaan utama yang ingin dijawab kelompok kerja. */
  keyQuestion: string;
  role: string[];
  framework: FrameworkStep[];
  findings: Finding[];
  deliverables: Deliverable[];
  inputs: Collaboration[];
  outputs: Collaboration[];
  documents: WorkstreamDocument[];
}
