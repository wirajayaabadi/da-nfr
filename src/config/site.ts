/**
 * Identitas proyek dan teks halaman. Ubah nilai di sini tanpa menyentuh komponen.
 */
export const site = {
  brand: {
    /** Logo resmi (sudah dipangkas). Ganti file di /public/brand/ bila ada versi baru. */
    logoSrc: '/brand/logo-pertamina.png',
    logoAlt: 'Pertamina',
    logoWidth: 467,
    logoHeight: 118,
    projectName: 'Action Learning Project',
  },

  /** Tautan ke bagian di halaman utama. */
  nav: [
    { id: 'beranda', label: 'Beranda' },
    { id: 'analisis', label: 'Hasil Analisis' },
    { id: 'tim', label: 'Tim Kami' },
  ],

  /** Halaman tambahan di navigasi. `shortLabel` dipakai pada layar sempit. */
  pages: [{ href: '/kelompok-kerja/business-analysis', label: 'Business Analysis', shortLabel: 'Analisis' }],

  hero: {
    label: 'Action Learning Project • Pertamina',
    title: 'Perjalanan Belajar, Kolaborasi, dan Dampak.',
    description:
      'Kami berkolaborasi untuk memahami tantangan bisnis, mengembangkan ide, dan merumuskan solusi melalui Action Learning Project.',
    cta: 'Kenali Tim Kami',
    /** Tombol utama: menuju dasbor hasil analisis NFR. */
    ctaAnalysis: 'Lihat Hasil Analisis',
    analysisHref: '/ringkasan',
    /** Baris kecil di kanan atas frame pembuka. */
    meta: ['Program Pengembangan Kepemimpinan', 'Danantara & BUMN'],
    scrollHint: 'Gulir',
    /** Label penanda frame di sisi kanan. */
    frameLabels: ['Pembuka', 'Belajar', 'Kolaborasi', 'Dampak'],
    /** Tiga bab yang mengikuti frame pembuka, diambil dari judul dan deskripsi hero. */
    chapters: [
      { word: 'Belajar', caption: 'Memahami tantangan bisnis.' },
      { word: 'Kolaborasi', caption: 'Mengembangkan ide bersama enam kelompok kerja.' },
      { word: 'Dampak', caption: 'Merumuskan solusi melalui Action Learning Project.' },
    ],
  },

  team: {
    title: 'Kenali Tim Kami',
    description:
      'Beragam pengalaman dan keahlian, dipertemukan oleh semangat belajar dan berkontribusi.',
    mentorLabel: 'Mentor Kami',
    mentorBadge: 'Mentor Tim ALP',
    membersTitle: 'Anggota Tim',
    membersDescription: 'Peserta dari beragam BUMN dan unit, terbagi dalam enam kelompok kerja.',
    assistantsTitle: 'Asisten Kelas',
    assistantsDescription: 'Mendukung kelancaran kegiatan tim sepanjang Action Learning Project.',
  },

  footer: {
    title: 'ALP Pertamina',
    projectName: 'Analisis Non Fuel Retail (NFR) SPBU Pertamina',
    program: 'Program Pengembangan Kepemimpinan Danantara & BUMN',
    /** Tahun atau periode kegiatan. */
    period: '2026',
  },
} as const;
