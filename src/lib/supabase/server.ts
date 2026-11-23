import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Klien Supabase untuk Server Component, Server Action, dan Route Handler.
 * Sesi pengguna dibaca dari cookie, jadi setiap kueri tunduk pada Row Level Security
 * pengguna yang sedang masuk. Buat klien baru di setiap permintaan.
 */
export async function createClient() {
  const cookieStore = await cookies();
  // Dengan partialPrefetching, isi cookie ikut tersedia saat Next.js memprerender App Shell.
  // Supabase lalu memeriksa masa berlaku token dengan Date.now(), yang dilarang selama prerender.
  // connection() menahan semua kerja Supabase sampai ada permintaan sungguhan: sesi diverifikasi
  // terhadap waktu saat ini dan data selalu dibaca segar, tidak pernah dari hasil prerender.
  await connection();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component: cookie tidak bisa ditulis di sini.
          // Aman diabaikan karena proxy sudah menyegarkan sesi di setiap permintaan.
        }
      },
    },
  });
}
