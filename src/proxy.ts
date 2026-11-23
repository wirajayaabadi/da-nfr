import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Semua alamat kecuali aset tampilan yang memang publik, disebut satu per satu: kode dan gambar Next,
  // folder huruf, merek, dan avatar, logo, favicon, serta ikon .svg di akar public/.
  // Pengecualian sengaja TIDAK memakai pola "semua alamat berakhiran .png/.svg": pola seperti itu ikut
  // meloloskan rute dinamis (mis. /data/spbu/1.png). Berkas .json juga tidak dikecualikan, karena
  // /eksplorasi/… dan /map_points.json memuat data SPBU, lahan, dan tenant.
  matcher: ["/((?!_next/static/|_next/image|favicon\\.ico$|pertamina-logo\\.webp$|fonts/|brand/|avatars/|[^/]+\\.svg$).*)"],
};
