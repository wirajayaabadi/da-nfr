import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
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
              {/* Wordmark hijau gelap: di mode gelap diberi alas putih agar tetap terbaca. */}
              <Link href="/" className="inline-block rounded-md dark:bg-white dark:px-2.5 dark:py-2" aria-label="Pertamina NFR Analytics, ke ringkasan eksekutif">
                <Image src="/pertamina-logo.webp" alt="Pertamina" width={3840} height={894} priority className="h-auto w-44" />
              </Link>
              <div className="mt-2 text-xs text-ink-3">NFR · {data.generated_from}</div>
            </div>
            {/* Suspense: rute dinamis (/data/spbu/[id]) tidak tahu pathname saat prerender shell. */}
            <Suspense fallback={null}><Nav /></Suspense>
          </aside>
          <main id="konten" className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
