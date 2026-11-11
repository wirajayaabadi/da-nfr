import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pertamina NFR Analytics — Brightspace",
  description: "Analitik Non Fuel Retail dari data lahan SPBU Brightspace dan rekomendasi inovasi (Impact-Effort Matrix).",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/**
 * Kerangka terluar: hanya html/body. Halaman depan ALP (route group `(landing)`) dan
 * dasbor analitik (`(dashboard)`) masing-masing punya layout sendiri.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
