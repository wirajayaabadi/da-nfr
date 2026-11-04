import raw from "@/data/analytics.json";

export type Overview = {
  spbu: number; spbu_dengan_lahan: number; spbu_dengan_lahan_kosong: number;
  lahan: number; lahan_tersewa: number; lahan_tersedia: number; okupansi_pct: number;
  kota: number; provinsi: number; harga_tahunan_median: number; harga_per_m2_median: number;
  lahan_dengan_harga: number; lahan_tanpa_harga_valid: number;
  pendapatan_idle_diketahui: number; pendapatan_idle_estimasi: number; lahan_tersedia_tanpa_harga: number;
  area_sekitar_titik: number; spbu_dengan_area_sekitar: number; koordinat_diperbaiki: number; koordinat_tersedia: number;
};
export type ProvinceRow = {
  provinsi: string; spbu: number; lahan: number; tersewa: number; tersedia: number; okupansi_pct: number | null;
  pendapatan_idle: number; harga_median: number | null; harga_m2_median: number | null; tersedia_besar: number; tersedia_luar: number;
};
export type KotaRow = { kota: string; provinsi: string; spbu: number; lahan: number; tersedia: number; okupansi_pct: number | null; pendapatan_idle: number; harga_median: number | null };
export type SegmentRow = {
  segmen: string; lahan: number; share_pct: number; share_tersewa_pct: number | null; harga_median: number | null;
  harga_q: Record<string, number>; luas_median: number | null; harga_m2_median: number | null; luar_pct: number | null; daya_median: number | null;
  pendapatan_tahunan_diketahui: number;
};
export type LahanRef = { kode_lahan: string; nomor_spbu: string; kota: string; provinsi: string; luas_valid: number | null; harga_tahunan: number | null; posisi_lahan: string; daya_listrik_w: number | null; url: string };
export type Alternative = {
  id: string; nama: string; kategori: string; deskripsi: string; bukti: string[]; addressable: number;
  impact: number; effort: number; effort_rincian: { capex: number; regulasi: number; mitra: number; proses: number };
  kpi: string; kuadran: "Quick Win" | "Major Project" | "Fill-in" | "Thankless Task";
};
export type MapPoint = { id: string; no: string; lat: number; lng: number; kota: string; prov: string; lahan: number; kosong: number };

export type Analytics = {
  generated_from: string;
  rules: { price_min: number; price_max: number; luas_max: number; segments: string[] };
  overview: Overview;
  by_province: ProvinceRow[];
  by_kota: KotaRow[];
  by_segment: SegmentRow[];
  segment_province: Array<Record<string, number | string>>;
  segment_columns: string[];
  top_brands: { brand: string; lahan: number; segmen: string }[];
  vacancy: {
    by_luas: { bucket: string; lahan: number }[];
    by_posisi: { posisi: string; tersedia: number; total: number; okupansi_pct: number | null }[];
    by_daya: { bucket: string; lahan: number }[];
    spbu_by_jumlah_kosong: { jumlah: string; spbu: number }[];
    tersedia_besar_total: number; tersedia_luar_total: number; tersedia_lantai2_total: number; tersedia_kecil_total: number;
    top_by_harga: LahanRef[]; top_by_luas: LahanRef[];
  };
  price: {
    quantiles: Record<string, number>;
    histogram: { bucket: string; lahan: number }[];
    by_posisi: { posisi: string; harga_median: number | null; harga_m2_median: number | null }[];
    periode: { periode: string; lahan: number }[];
    outlier_dikeluarkan: number; tanpa_harga: number;
  };
  facilities: {
    coverage: { fasilitas: string; spbu: number; pct: number }[];
    spbu_tanpa_data_fasilitas: number; okupansi_dengan_fasilitas: number; okupansi_tanpa_fasilitas: number;
  };
  area: {
    by_kategori: { kategori: string; titik: number; spbu: number; okupansi_pct: number | null; harga_median: number | null; jarak_median_km: number | null }[];
    okupansi_dengan_data_area: number; okupansi_tanpa_data_area: number; harga_median_dengan_area: number | null; harga_median_tanpa_area: number | null;
  };
  alternatives: Alternative[];
};

export const data = raw as unknown as Analytics;
