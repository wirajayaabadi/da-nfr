import raw from "@/data/ekonomi.json";

export type Skenario = "konservatif" | "dasar" | "optimis";
export type Hasil = {
  unit: number; pendapatan: number; pendapatan_per_unit: number; omzet_mitra: number;
  capex_pertamina: number; capex_mitra: number; opex_pertamina: number; net: number;
  payback_tahun: number | null; npv: number; npv_20: number; pendapatan_horizon: number;
};
export type AlternatifEkonomi = {
  id: string; nama: string; kuadran: "Quick Win" | "Major Project" | "Fill-in" | "Thankless Task"; impact: number; effort: number;
  unit: string; pool: number; model: string; asumsi: string[]; overlap: string | null;
  skenario: Record<Skenario, Hasil>;
};
export type Ekonomi = {
  parameter: { diskonto: number; horizon_tahun: number; ramp: number[]; skenario: Skenario[] };
  basis: { rent_roll_tersewa: number; lahan_tersewa_tarif_valid: number; pendapatan_idle: number; nfr_share_spbu_pct: number; tarif_median: number; sewa_kecil: number; sewa_luar: number; sewa_besar_m2_bulan: number };
  tolok_ukur: { item: string; nilai: string; sumber: string; url: string }[];
  belum_ada: string[];
  alternatif: AlternatifEkonomi[];
  total: Record<Skenario, { ids: string[]; pendapatan: number; omzet_mitra: number; capex_pertamina: number; capex_mitra: number; npv: number }>;
};

export const ekonomi = raw as unknown as Ekonomi;
export const SKENARIO_LABEL: Record<Skenario, string> = { konservatif: "Konservatif", dasar: "Dasar", optimis: "Optimis" };
