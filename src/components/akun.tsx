import { keluar } from "@/app/login/actions";
import { supabaseSiap } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Email akun yang sedang masuk dan tombol keluar. Membaca sesi, jadi dipasang di dalam Suspense. */
export default async function Akun() {
  if (!supabaseSiap) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!email) return null;

  return (
    <div className="flex items-center justify-between gap-3 lg:block">
      <p className="min-w-0 truncate text-xs text-ink-2" title={email}>
        {email}
      </p>
      <form action={keluar} className="shrink-0 lg:mt-2">
        <button type="submit" className="min-h-11 rounded-md border border-grid px-3 text-xs font-semibold text-ink-2 hover:bg-surface hover:text-ink">
          Keluar
        </button>
      </form>
    </div>
  );
}
