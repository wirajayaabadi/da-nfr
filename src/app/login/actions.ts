"use server";

import { redirect } from "next/navigation";
import { bolehBukaDasbor, HALAMAN_MASUK, tujuanSetelahMasuk } from "@/lib/akses";
import { supabaseSiap } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type StatusMasuk = { pesan: string } | null;

export async function masuk(_sebelumnya: StatusMasuk, formData: FormData): Promise<StatusMasuk> {
  if (!supabaseSiap) return { pesan: "Login belum terhubung ke Supabase. Isi .env.local terlebih dahulu." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { pesan: "Isi email dan kata sandi." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { pesan: "Email atau kata sandi belum cocok. Periksa lalu coba lagi." };

  // Akun mitra (tenant, dealer) dan akun tanpa organisasi NFR tidak membuka dasbor.
  // Sesi yang baru dibuat langsung diakhiri agar tidak tertinggal di browser.
  if (!bolehBukaDasbor(data.user?.app_metadata)) {
    await supabase.auth.signOut({ scope: "local" });
    return { pesan: "Akun ini belum terdaftar sebagai tim NFR, jadi belum bisa membuka dasbor. Minta admin Bright Match menambahkan Anda ke organisasi NFR." };
  }

  redirect(tujuanSetelahMasuk(String(formData.get("lanjut") ?? "")));
}

export async function keluar() {
  if (supabaseSiap) {
    const supabase = await createClient();
    // Hanya sesi di browser ini; sesi Bright Match di perangkat lain tidak ikut diakhiri.
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect(HALAMAN_MASUK);
}
