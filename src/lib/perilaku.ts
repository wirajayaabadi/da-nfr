import raw from "@/data/perilaku.json";

export type Dist = { label: string; opsi?: string; n: number; pct: number };
export type KotaSurvei = {
  kabkota: string; provinsi: string; responden: number; ambigu: number; layanan_teratas: string; beli_nonbbm_pct: number;
  spbu: number; lahan: number; kosong: number; okupansi_pct: number | null;
};
export type Perilaku = {
  sumber: string; n: number; n_beli: number; n_tidak_beli: number;
  ringkasan: {
    langsung_pergi_pct: number; beli_nonbbm_pct: number; tidak_mau_tambah_waktu_pct: number; q21_rata: number;
    q21_top2_pct: number; q21_bottom2_pct: number; sengaja_datang_pct: number; medan_raya_pct: number;
    usia_55_pct: number; usia_18_pct: number; ibadah_toilet_isian_bebas: number; q20_lebih_dari_satu: number; kota_terpetakan: number;
  };
  profil: { kendaraan: Dist[]; bbm: Dist[]; frekuensi: Dist[]; usia: Dist[]; alasan_spbu: Dist[] };
  kunjungan: { antre: Dist[]; setelah_isi: Dist[]; waktu_tambahan: Dist[] };
  nonbbm: { diketahui: Dist[]; beli_30hari: Dist[]; produk_dibeli: Dist[]; pengeluaran: Dist[]; alasan_tidak: Dist[]; sengaja_datang: Dist[] };
  kebocoran: { kategori: string; luar: number; spbu: number }[];
  tempat_beli: Dist[];
  alasan_tempat: Dist[];
  permintaan: {
    bermanfaat: Dist[]; prioritas: Dist[]; kemungkinan: Dist[]; faktor: Dist[]; cara_akses: Dist[];
    motor_vs_mobil: { layanan: string; semua: number; motor: number; mobil: number }[]; n_motor: number; n_mobil: number;
  };
  kota: KotaSurvei[];
};

export const survei = raw as unknown as Perilaku;
