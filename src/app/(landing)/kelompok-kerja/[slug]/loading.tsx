// Batas Suspense untuk rute dinamis: akses `params` di page.tsx harus berada di dalamnya (Next.js 16, cacheComponents).
export default function Loading() {
  return <div className="min-h-svh" role="status" aria-label="Memuat halaman kelompok kerja" />;
}
