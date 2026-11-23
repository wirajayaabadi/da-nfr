import { DASHBOARD_HOME, DASHBOARD_PAGES } from "./routes";

/**
 * Aturan akses dasbor, dipakai proxy (penjaga halaman) dan aksi masuk.
 *
 * Akun berasal dari Bright Match. Di sana setiap akun membawa "ruang" di token masuknya: nfr untuk
 * anggota organisasi NFR, tenant atau dealer untuk mitra (migrasi 20261121_ruang_kerja). Dasbor ini
 * memuat data kontrak dan tarif semua tenant, jadi hanya ruang nfr yang boleh membukanya. Akun tanpa
 * ruang ikut ditolak: yang masuk harus terbukti tim NFR, bukan sekadar bukan mitra.
 */
export const HALAMAN_MASUK = "/login";

export function ruangDari(appMetadata: unknown): string | null {
  const ruang = (appMetadata as { ruang?: unknown } | null | undefined)?.ruang;
  return typeof ruang === "string" ? ruang : null;
}

export function bolehBukaDasbor(appMetadata: unknown): boolean {
  return ruangDari(appMetadata) === "nfr";
}

/** Halaman depan ALP dan halaman kelompok kerja terbuka; semua yang lain butuh akun tim NFR. */
export function rutePublik(path: string): boolean {
  return path === "/" || path === HALAMAN_MASUK || path.startsWith("/kelompok-kerja/");
}

/**
 * Tujuan setelah masuk. Hanya alamat halaman dasbor yang dikenal, agar parameter `lanjut` tidak bisa
 * dipakai mengalihkan ke situs lain. Selain itu: halaman pertama dasbor.
 */
export function tujuanSetelahMasuk(lanjut: string | null | undefined): string {
  if (!lanjut || !lanjut.startsWith("/") || lanjut.startsWith("//") || lanjut.includes("\\")) return DASHBOARD_HOME;
  const path = lanjut.split(/[?#]/)[0];
  const dikenal = DASHBOARD_PAGES.some((p) => path === p.href || path.startsWith(`${p.href}/`));
  return dikenal ? lanjut : DASHBOARD_HOME;
}
