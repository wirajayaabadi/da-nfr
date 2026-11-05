import raw from "@/data/kajian.json";
import type { Alternative } from "@/lib/data";

export type Sumber = "brightspace" | "survei" | "master";
export type Verdict = "kuat" | "sedang" | "lemah" | "belum ada data";
export type Aspek = "permintaan" | "pasokan" | "ekonomi" | "kesiapan";
export type Bukti = { sumber: Sumber; label: string; nilai: string; catatan: string | null };
export type Grafik = { judul: string; catatan: string | null; format: "n" | "rp" | "pct"; rows: Array<Record<string, string | number>>; series: { key: string; name: string }[] | null };
export type Referensi = { item: string; nilai: string; sumber: string; url: string; relevansi: string };
export type KajianAlternatif = {
  id: string; nama: string; kuadran: Alternative["kuadran"]; kategori: string; impact: number; effort: number; kpi: string;
  pertanyaan: string; ringkasan: string;
  verdict: Record<Aspek, { nilai: Verdict; alasan: string }>;
  internal: Bukti[]; grafik: Grafik[]; eksternal: Referensi[];
  risiko: string[]; prasyarat: string[]; pilot: string[]; data_dibutuhkan: string[];
};
export type Kajian = {
  dibuat: string;
  sumber: { brightspace: string; survei: string | null; master: string | null; eksternal: string };
  skala_verdict: Record<Verdict, string>;
  alternatif: KajianAlternatif[];
};

export const kajian = raw as unknown as Kajian;

export const SHORT: Record<string, string> = {
  A1: "Isi lahan kosong", A2: "Standardisasi tarif", A3: "Kios F&B grab-and-go", A4: "Parcel locker", A5: "Hub EV charging",
  A6: "Gudang mikro", A7: "DOOH advertising", A8: "Perawatan self-service", A9: "Profil & fasilitas", A10: "ATM → kiosk digital",
  A11: "Lounge lantai 2", A12: "PLTS kanopi",
};
export const ASPEK_LABEL: Record<Aspek, string> = { permintaan: "Permintaan", pasokan: "Pasokan lahan", ekonomi: "Ekonomi", kesiapan: "Kesiapan" };
export const ASPEK_ORDER: Aspek[] = ["permintaan", "pasokan", "ekonomi", "kesiapan"];
export const VERDICT_COLOR: Record<Verdict, string> = {
  kuat: "var(--status-good)", sedang: "var(--status-warning)", lemah: "var(--status-critical)", "belum ada data": "var(--muted-mark)",
};
export const SUMBER_LABEL: Record<Sumber, string> = { brightspace: "Brightspace", survei: "Survei", master: "Master lahan" };
export const SUMBER_COLOR: Record<Sumber, string> = { brightspace: "var(--series-1)", survei: "var(--series-3)", master: "var(--series-7)" };
export const KUADRAN_ORDER: Alternative["kuadran"][] = ["Quick Win", "Major Project", "Fill-in", "Thankless Task"];
