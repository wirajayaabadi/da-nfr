/**
 * Pemuat data untuk halaman /data (penjelajah SPBU & lahan).
 * File dibuat oleh eksplorasi.py di public/eksplorasi/ dan di-fetch saat halaman dibuka,
 * dengan cache di memori modul agar perpindahan daftar ↔ detail tidak memuat ulang.
 */

export type AreaSekitar = { n: string; k: string; ket: string; km: number | null };

export type Spbu = {
  id: string; no: string; nama: string; alamat: string; kota: string; prov: string;
  lat: number | null; lng: number | null; fix: boolean;
  fas: string[]; foto: number; l360: boolean;
  lahan: number; kosong: number; tersewa: number;
  hmin: number; hmax: number; stl: string;
  seg: string[]; rent: number; area: AreaSekitar[];
  kontrak: number; tenant: string[];
};

/** Kontrak master "Disetujui" terakhir untuk kode lahan ini. */
export type Kontrak = {
  t: string; a: string | null; z: string | null; v: number | null; s: string; lu: number | null; n: number;
  th?: number | null; pd?: string;
};

export type Lahan = {
  i: string; s: string; no: string; k: string; st: string; seg: string;
  lu: number | null; d: number | null; h: number | null; p: string;
  ht: number | null; hm2: number | null;
  o: string; ds: string; t: number | null; pj: number | null; lb: number | null;
  lt: string; ps: string; prov: string; kota: string;
  m?: Kontrak;
};

export type Meta = {
  dibuat: string; sumber: string;
  master: { file: string; asof: string | null; baris: number; kode_disetujui: number } | null;
  spbu: number; lahan: number; lahan_kosong: number; area_titik: number;
  provinsi: { nama: string; slug: string; spbu: number; lahan: number; kota: string[] }[];
  fasilitas: { nama: string; spbu: number }[];
  segmen: { nama: string; lahan: number }[];
  area_kategori: { nama: string; titik: number }[];
  tenant_top: { nama: string; lahan: number }[];
  aturan: { harga_min: number; harga_max: number; luas_max: number };
};

const BASE = "/eksplorasi";
const cache = new Map<string, Promise<unknown>>();

function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`${BASE}/${path}`).then((r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p;
}

export const loadMeta = () => getJson<Meta>("meta.json");
export const loadSpbu = () => getJson<Spbu[]>("spbu.json");
export const loadLahanProv = (slug: string) => getJson<Lahan[]>(`lahan/${slug}.json`);

/** Memuat lahan semua provinsi (paralel), melapor kemajuan per file selesai. */
export async function loadLahanAll(meta: Meta, onProgress?: (done: number, total: number) => void): Promise<Lahan[]> {
  const provs = meta.provinsi.filter((p) => p.lahan > 0);
  let done = 0;
  const parts = await Promise.all(provs.map((p) => loadLahanProv(p.slug).then((rows) => { onProgress?.(++done, provs.length); return rows; })));
  return parts.flat();
}

export const SPBU_URL = (id: string) => `https://brightspace.pertamina.com/detail/spbu?id=${id}`;
export const LAHAN_URL = (spbuId: string, lahanId: string) => `https://brightspace.pertamina.com/detail/lahan?id=${spbuId}&lahanId=${lahanId}`;

export const AREA_LABEL: Record<string, string> = {
  other: "Lainnya", restaurant: "Restoran / kuliner", mall: "Mal / pasar", business: "Perkantoran / bisnis", hotel: "Hotel",
  entertainment: "Hiburan", "train-station": "Stasiun", home: "Perumahan",
};

/** Sisa hari kontrak terhadap tanggal acuan master; null bila tidak bertanggal. */
export function sisaHari(k: Kontrak | undefined, asof: Date): number | null {
  if (!k?.z) return null;
  return Math.round((new Date(k.z).getTime() - asof.getTime()) / 86_400_000);
}

export type StatusKontrak = "tanpa kontrak" | "kedaluwarsa" | "≤ 6 bulan" | "6–12 bulan" | "> 12 bulan" | "tanpa tanggal";
export function statusKontrak(l: Lahan, asof: Date): StatusKontrak {
  if (!l.m || l.m.s !== "Tersewa") return "tanpa kontrak";
  const s = sisaHari(l.m, asof);
  if (s === null) return "tanpa tanggal";
  if (s < 0) return "kedaluwarsa";
  if (s < 183) return "≤ 6 bulan";
  if (s < 365) return "6–12 bulan";
  return "> 12 bulan";
}
export const STATUS_KONTRAK: StatusKontrak[] = ["kedaluwarsa", "≤ 6 bulan", "6–12 bulan", "> 12 bulan", "tanpa tanggal", "tanpa kontrak"];

/** Tanggal acuan master ("02 November 2026") → Date; fallback tanggal file dibuat (deterministik untuk prerender). */
export function asofDate(meta: Meta): Date {
  const s = meta.master?.asof;
  const m = s && /^(\d{1,2}) (\w+) (\d{4})$/.exec(s);
  const bulan = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  if (m) {
    const idx = bulan.indexOf(m[2].toLowerCase());
    if (idx >= 0) return new Date(Date.UTC(+m[3], idx, +m[1]));
  }
  return new Date(meta.dibuat);
}
/** Placeholder sebelum meta dimuat; tidak ada baris yang dirender dengan nilai ini. */
export const EPOCH = new Date(Date.UTC(2000, 0, 1));

export const tgl = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "–";

/** Unduh baris sebagai CSV (UTF-8 BOM agar Excel membaca aksen & pemisah dengan benar). */
export function downloadCsv(name: string, header: string[], rows: (string | number | null | undefined | boolean)[][]) {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "boolean" ? (v ? "ya" : "tidak") : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
