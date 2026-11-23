import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { supabaseSiap } from "@/lib/supabase/env";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Masuk · Pertamina NFR Analytics", robots: { index: false, follow: false } };

/** Halaman masuk dasbor (pola halaman: Form, autentikasi). Akun dan kata sandinya sama dengan Bright Match. */
export default function HalamanMasuk() {
  return (
    <div className="nfr-app">
      <main className="grid min-h-svh place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card overflow-hidden shadow-sm">
            {/* Garis tiga warna Pertamina, sama dengan halaman masuk Bright Match. */}
            <span aria-hidden="true" className="flex h-1">
              <span className="flex-1 bg-[#ed1b2f]" />
              <span className="flex-1 bg-[#006cb8]" />
              <span className="flex-1 bg-[#acc42a]" />
            </span>
            <div className="p-7 sm:p-9">
              {/* Wordmark hijau gelap: di mode gelap diberi alas putih agar tetap terbaca. */}
              <span className="inline-block rounded-md dark:bg-white dark:px-2.5 dark:py-2">
                <Image src="/pertamina-logo.webp" alt="Pertamina" width={3840} height={894} priority className="h-auto w-40" />
              </span>
              <h1 className="mt-7 text-xl font-bold tracking-[-0.01em] text-ink">Masuk ke dasbor NFR</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                Dasbor ini memuat data kontrak dan tarif tenant, jadi hanya bisa dibuka tim NFR. Pakai email dan kata sandi akun Bright Match Anda.
              </p>
              {supabaseSiap ? (
                <Suspense fallback={<div className="mt-7 h-60" />}>
                  <LoginForm />
                </Suspense>
              ) : (
                <p role="alert" className="mt-6 rounded-lg border border-grid bg-plane px-3.5 py-3 text-sm leading-relaxed text-ink-2">
                  Login belum terhubung ke Supabase, jadi dasbor ditutup dulu. Salin <code>.env.example</code> menjadi <code>.env.local</code>, isi dengan nilai yang sama seperti di Bright Match, lalu jalankan ulang.
                </p>
              )}
            </div>
          </div>
          <p className="mt-5 text-center text-xs leading-relaxed text-ink-2">
            Belum punya akun? Minta admin Bright Match mendaftarkan Anda ke organisasi NFR.
          </p>
          <p className="mt-2 text-center text-xs text-ink-2">
            <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-ink-2 underline-offset-2 hover:underline">
              Kembali ke halaman depan ALP
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
