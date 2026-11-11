import type { Viewport } from "next";

export const viewport: Viewport = { themeColor: "#ffffff" };

/**
 * Kerangka halaman depan ALP. Wadah `.alp-site` (lihat globals.css, bagian "Halaman depan ALP")
 * memuat token warna dan huruf landing serta mengunci mode terang, terpisah dari dasbor.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="alp-site">{children}</div>;
}
