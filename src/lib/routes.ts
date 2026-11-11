/**
 * Halaman dasbor analitik, urut sesuai navigasi. Dipakai sidebar dasbor (nav.tsx) dan
 * bagian "Hasil Analisis" di halaman depan ALP, agar daftarnya tidak ditulis dua kali.
 */
export const DASHBOARD_PAGES = [
  { href: "/ringkasan", label: "Ringkasan eksekutif" },
  { href: "/pasokan", label: "Pasokan & okupansi" },
  { href: "/segmen", label: "Segmen tenant" },
  { href: "/harga", label: "Harga sewa" },
  { href: "/lokasi", label: "Lokasi & fasilitas" },
  { href: "/data", label: "Data SPBU & lahan" },
  { href: "/perilaku", label: "Perilaku konsumen" },
  { href: "/rekomendasi", label: "Rekomendasi inovasi" },
  { href: "/kajian", label: "Kajian alternatif" },
  { href: "/ekonomi", label: "Dampak ekonomi" },
  { href: "/metodologi", label: "Metodologi & data" },
] as const;

/** Pintu masuk dasbor dari halaman depan. */
export const DASHBOARD_HOME = "/ringkasan";
