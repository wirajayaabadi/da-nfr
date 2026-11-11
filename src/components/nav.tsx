"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_PAGES } from "@/lib/routes";

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Navigasi utama">
      {DASHBOARD_PAGES.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
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
