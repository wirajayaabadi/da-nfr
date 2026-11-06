import raw from "@/data/kajian.json";
import type { Alternative } from "@/lib/data";

export type Sumber = "brightspace" | "survei" | "master";
export type Verdict = "kuat" | "sedang" | "lemah" | "belum ada data";
export type Aspek = "permintaan" | "pasokan" | "ekonomi" | "kesiapan";
export type Bukti = { sumber: Sumber; label: string; nilai: string; catatan: string | null };
export type Grafik = { judul: string; catatan: string | null; format: "n" | "rp" | "pct"; rows: Array<Record<string, string | number>>; series: { key: string; name: string }[] | null };
export type Referensi = { item: string; nilai: string; sumber: string; url: string; relevansi: string };
export type SikapTingkat = "segera" | "pilot" | "bersyarat" | "tahan";
export type Rencana = {
  sikap: { tingkat: SikapTingkat; label: string };
  inti: string;
  cara_kerja: string[];
  tahapan: { fase: string; judul: string; kegiatan: string[] }[];
  peran: { pihak: string; tugas: string }[];
  ambang: { lanjut: string; berhenti: string };
};
export type StatusData = "ada" | "sebagian" | "belum" | "rancangan";
export type Matching = {
  konsep: string;
  pengguna: { pihak: string; kebutuhan: string }[];
  arah: { nama: string; isi: string }[];
  logika: { lapisan: string; isi: string; sumber: string; status: StatusData }[];
  aset: { item: string; nilai: string; status: StatusData; guna: string }[];
  contoh_lahan: {
    kode: string; spbu: string; spbu_id: string; kota: string; prov: string; luas: number; posisi: string; lantai: string; daya: number | null; tarif_listing: number;
    fasilitas: string[]; area: { nama: string; kategori: string; km: number | null }[];
    pembanding: { jumlah: number; definisi: string; segmen: { label: string; value: number }[] };
    segmen_ada: string[];
    rekomendasi: { segmen: string; share_pct: number; kandidat: { tenant: string; lahan: number }[]; tingkat_kandidat: string; alasan: string }[];
    tarif_wajar: { p25: number | null; median: number | null; p75: number | null; n: number };
    belum_terjawab: string[];
  } | null;
  contoh_tenant: {
    tenant: string; lahan: number; spbu: number; segmen: string; provinsi: { label: string; value: number }[];
    luas_p25: number | null; luas_p75: number | null; posisi: string; tarif_median: number | null; kriteria: string;
    cocok: number; cocok_spbu: number; kota_teratas: { label: string; value: number }[];
    contoh: { kode: string; kota: string; luas: number; tarif: number | null }[];
  } | null;
  tahapan: { fase: string; judul: string; kegiatan: string[] }[];
  ukuran: string[]; risiko: string[];
  /** Nilai tambah per pihak: Pertamina sebagai commercial matchmaker. */
  nilai_tambah?: {
    peran: string;
    poin: { pihak: string; judul: string; isi: string; angka: string; syarat: string | null }[];
    pergeseran: { aspek: string; dulu: string; nanti: string }[];
  };
};
export const STATUS_DATA_COLOR: Record<StatusData, string> = {
  ada: "var(--status-good)", sebagian: "var(--status-warning)", belum: "var(--status-critical)", rancangan: "var(--series-7)",
};
export type KajianAlternatif = {
  id: string; nama: string; kuadran: Alternative["kuadran"]; kategori: string; impact: number; effort: number; kpi: string;
  pertanyaan: string; ringkasan: string;
  verdict: Record<Aspek, { nilai: Verdict; alasan: string }>;
  internal: Bukti[]; grafik: Grafik[]; eksternal: Referensi[];
  risiko: string[]; prasyarat: string[]; pilot: string[]; data_dibutuhkan: string[];
  rencana: Rencana;
  matching?: Matching;
};
export type Kajian = {
  dibuat: string;
  sumber: { brightspace: string; survei: string | null; master: string | null; eksternal: string };
  skala_verdict: Record<Verdict, string>;
  alternatif: KajianAlternatif[];
};

export const kajian = raw as unknown as Kajian;

export const SHORT: Record<string, string> = {
  A1: "Commercial Intelligence", A2: "Standardisasi tarif", A3: "Kios F&B grab-and-go", A4: "Parcel locker", A5: "Hub EV charging",
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
export const SIKAP_COLOR: Record<SikapTingkat, string> = {
  segera: "var(--status-good)", pilot: "var(--accent)", bersyarat: "var(--status-warning)", tahan: "var(--status-critical)",
};
export const SIKAP_ORDER: SikapTingkat[] = ["segera", "pilot", "bersyarat", "tahan"];
export const KUADRAN_ORDER: Alternative["kuadran"][] = ["Quick Win", "Major Project", "Fill-in", "Thankless Task"];
