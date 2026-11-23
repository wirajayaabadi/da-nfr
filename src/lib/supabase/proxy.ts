import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { bolehBukaDasbor, HALAMAN_MASUK, rutePublik } from "@/lib/akses";
import { DASHBOARD_HOME } from "@/lib/routes";
import { supabaseKey, supabaseSiap, supabaseUrl } from "./env";

/**
 * Menyegarkan sesi Supabase di setiap permintaan dan menjaga dasbor (pola yang sama dengan Bright Match).
 *
 * Yang dijaga: semua halaman dasbor dan berkas datanya di public/ (/eksplorasi/…, /map_points.json).
 * Yang terbuka: halaman depan ALP, halaman kelompok kerja, dan halaman masuk.
 *
 * Halaman dasbor dibangun dari berkas JSON saat build, jadi tidak ada Row Level Security di belakangnya:
 * proxy inilah penjaganya. Karena itu aturannya tertutup secara bawaan. Rute baru otomatis butuh akun,
 * dan bila .env.local belum diisi dasbor tetap tertutup, bukan terbuka.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  if (!supabaseSiap) return rutePublik(path) ? response : tolak(request, response, {});

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Respons yang membawa cookie sesi tidak boleh disimpan CDN.
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Jangan menaruh kode lain di antara pembuatan klien dan pemanggilan ini:
  // getClaims() memverifikasi token dan menyegarkannya bila perlu.
  const { data } = await supabase.auth.getClaims();
  const sudahMasuk = Boolean(data?.claims);
  const boleh = sudahMasuk && bolehBukaDasbor(data?.claims?.app_metadata);

  // Tim NFR yang sudah masuk tidak perlu melihat halaman masuk lagi.
  if (path === HALAMAN_MASUK && boleh) return alihkan(request, response, DASHBOARD_HOME, {});
  if (rutePublik(path) || boleh) return response;

  // Belum masuk: kembali ke halaman yang dituju setelah masuk. Sudah masuk tetapi bukan tim NFR: jelaskan.
  return tolak(request, response, sudahMasuk ? { alasan: "akses" } : { lanjut: path + request.nextUrl.search });
}

/** Berkas data dijawab 401 (pemanggilnya fetch, bukan orang); halaman dialihkan ke halaman masuk. */
function tolak(request: NextRequest, asal: NextResponse, query: Record<string, string>) {
  if (request.nextUrl.pathname.endsWith(".json")) {
    const res = NextResponse.json({ pesan: "Masuk terlebih dahulu untuk membuka data ini." }, { status: 401 });
    asal.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
  return alihkan(request, asal, HALAMAN_MASUK, query);
}

/** Redirect yang tetap membawa cookie sesi yang baru disegarkan. */
function alihkan(request: NextRequest, asal: NextResponse, tujuan: string, query: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = tujuan;
  url.search = "";
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  const redirect = NextResponse.redirect(url);
  asal.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
