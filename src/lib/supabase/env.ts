/**
 * Alamat dan kunci publik Supabase. Dasbor memakai proyek Supabase yang sama dengan Bright Match,
 * jadi akun dan kata sandinya sama. Kunci publik ("publishable key" atau "anon key" lama) aman di
 * sisi browser; dasbor ini hanya memakainya untuk masuk, tidak untuk membaca tabel.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** false selama .env.local belum diisi. Dasbor lalu tetap tertutup dan halaman masuk menjelaskan sebabnya. */
export const supabaseSiap = supabaseUrl !== "" && supabaseKey !== "";
