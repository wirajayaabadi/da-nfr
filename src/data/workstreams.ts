import type { Workstream } from '@/types/workstream';

/**
 * KONTEN HALAMAN KELOMPOK KERJA — satu entri = satu halaman di /kelompok-kerja/{slug}.
 *
 * - Teks dalam [kurung siku] adalah placeholder: ganti dengan data proyek yang sebenarnya.
 * - Peran dan kerangka kerja berisi usulan metode umum Business Analysis; sesuaikan dengan
 *   cara kerja tim.
 * - Status deliverable: 'planned' | 'in-progress' | 'review' | 'done'.
 * - Untuk menambah halaman kelompok kerja lain, salin entri ini dan ubah `slug` & `teamId`.
 */
export const workstreams: Workstream[] = [
  {
    slug: 'business-analysis',
    teamId: 'business',
    title: 'Business Analysis',
    summary:
      'Membedah proses bisnis dan data untuk menemukan akar masalah, memetakan kesenjangan, dan menerjemahkan temuan menjadi kebutuhan solusi yang dapat diuji.',
    keyQuestion: '[Pertanyaan utama yang ingin dijawab tim Business Analysis]',
    role: [
      'Memetakan proses bisnis saat ini (as-is) beserta titik-titik hambatannya.',
      'Menelusuri akar masalah berdasarkan data dan masukan dari lapangan.',
      'Menentukan kesenjangan antara kondisi saat ini dan kondisi yang diharapkan.',
      'Merumuskan kebutuhan bisnis dan prioritas peluang sebagai dasar desain solusi dan pilot.',
    ],
    framework: [
      {
        title: 'Pemetaan proses',
        description: 'Memahami alur kerja saat ini dari hulu ke hilir, termasuk pelaku, input, dan output.',
        tools: ['SIPOC', 'Value chain', 'Peta proses (BPMN)'],
        output: 'Peta proses as-is',
      },
      {
        title: 'Analisis akar masalah',
        description: 'Membedakan gejala dari penyebab, lalu memastikan penyebab utama dengan data.',
        tools: ['Fishbone', '5 Whys', 'Pareto'],
        output: 'Pohon masalah',
      },
      {
        title: 'Analisis kesenjangan',
        description: 'Membandingkan kondisi saat ini dengan kondisi yang diharapkan dan praktik pembanding.',
        tools: ['Gap analysis', 'As-is vs to-be'],
        output: 'Daftar kesenjangan',
      },
      {
        title: 'Prioritas peluang',
        description: 'Menimbang setiap peluang perbaikan berdasarkan dampak dan upaya yang dibutuhkan.',
        tools: ['Matriks dampak–upaya', 'MoSCoW'],
        output: 'Peluang prioritas',
      },
      {
        title: 'Kebutuhan bisnis',
        description: 'Menerjemahkan peluang terpilih menjadi kebutuhan solusi dan ukuran keberhasilan pilot.',
        tools: ['Business requirements', 'KPI & metrik'],
        output: 'Dokumen kebutuhan & KPI pilot',
      },
    ],
    findings: [
      { title: '[Temuan 1]', detail: '[Uraian singkat temuan dan data pendukungnya]', status: 'draft' },
      { title: '[Temuan 2]', detail: '[Uraian singkat temuan dan data pendukungnya]', status: 'draft' },
      { title: '[Temuan 3]', detail: '[Uraian singkat temuan dan data pendukungnya]', status: 'draft' },
    ],
    deliverables: [
      { title: 'Peta proses as-is', status: 'planned' },
      { title: 'Pohon masalah & akar masalah utama', status: 'planned' },
      { title: 'Daftar kesenjangan', status: 'planned' },
      { title: 'Matriks prioritas peluang', status: 'planned' },
      { title: 'Dokumen kebutuhan bisnis & KPI pilot', status: 'planned' },
    ],
    inputs: [
      { team: 'customer', note: 'Temuan kebutuhan dan keluhan pelanggan.' },
      { team: 'benchmarking', note: 'Praktik terbaik pembanding sebagai acuan kondisi to-be.' },
    ],
    outputs: [
      { team: 'financial', note: 'Kebutuhan solusi dan skenario sebagai dasar business case.' },
      { team: 'strategy', note: 'Prioritas peluang untuk menajamkan arah solusi.' },
    ],
    documents: [],
  },
];

export function getWorkstream(slug: string) {
  return workstreams.find((w) => w.slug === slug);
}
