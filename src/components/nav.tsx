"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Ringkasan eksekutif" },
  { href: "/pasokan", label: "Pasokan & okupansi" },
  { href: "/segmen", label: "Segmen tenant" },
  { href: "/harga", label: "Harga sewa" },
  { href: "/lokasi", label: "Lokasi & fasilitas" },
  { href: "/perilaku", label: "Perilaku konsumen" },
  { href: "/rekomendasi", label: "Rekomendasi inovasi" },
  { href: "/ekonomi", label: "Dampak ekonomi" },
  { href: "/metodologi", label: "Metodologi & data" },
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Navigasi utama">
      {items.map((it) => {
        const active = path === it.href;
        return (
          <Link key={it.href} href={it.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${active ? "bg-surface font-semibold shadow-sm ring-1 ring-grid" : "text-ink-2 hover:bg-surface"}`}
            aria-current={active ? "page" : undefined}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
