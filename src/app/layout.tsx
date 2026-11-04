import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { data } from "@/lib/data";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full">
        <a href="#konten" className="sr-only rounded-md bg-surface px-3 py-2 text-sm font-semibold shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50">Lewati ke konten utama</a>
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
          <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-60 lg:shrink-0">
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">Pertamina · NFR</div>
              <div className="text-lg font-semibold leading-tight">Brightspace Analytics</div>
              <div className="mt-1 text-xs text-ink-3">{data.generated_from}</div>
            </div>
            <Nav />
          </aside>
          <main id="konten" className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
