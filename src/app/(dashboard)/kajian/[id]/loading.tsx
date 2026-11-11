// Batas Suspense untuk rute dinamis: akses `params` di page.tsx harus berada di dalamnya (instant navigation Next.js 16).
export default function Loading() {
  return <div className="py-10 text-center text-sm text-ink-3" role="status">Memuat kajian…</div>;
}
