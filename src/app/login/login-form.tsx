"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { masuk, type StatusMasuk } from "./actions";

const kolom =
  "mt-1.5 block min-h-11 w-full rounded-lg border border-ink-3 bg-surface px-3.5 py-2.5 text-[15px] text-ink focus:border-accent";

export default function LoginForm() {
  const [status, aksi, menunggu] = useActionState<StatusMasuk, FormData>(masuk, null);
  const params = useSearchParams();
  // Halaman yang dituju setelah masuk; diperiksa lagi di server terhadap daftar halaman dasbor.
  const lanjut = params.get("lanjut") ?? "";
  // Sudah masuk dengan akun Bright Match yang bukan tim NFR (mis. akun mitra di browser yang sama).
  const ditolak = params.get("alasan") === "akses" && !status;

  return (
    <form action={aksi} className="mt-7 space-y-5">
      <input type="hidden" name="lanjut" value={lanjut} />

      {ditolak && (
        <p role="status" className="rounded-lg border border-grid bg-plane px-3.5 py-2.5 text-sm leading-relaxed text-ink-2">
          Akun yang sedang masuk belum terdaftar sebagai tim NFR. Masuk dengan akun tim NFR untuk membuka dasbor.
        </p>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-semibold text-ink">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={kolom} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-ink">
          Kata sandi
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={kolom} />
      </div>

      {status && (
        <p role="alert" className="rounded-lg border border-critical/40 bg-critical/10 px-3.5 py-2.5 text-sm leading-relaxed font-medium text-ink">
          {status.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={menunggu}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ink px-4 text-[15px] font-semibold text-plane transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {menunggu ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
