"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kajian, KUADRAN_ORDER, SHORT, VERDICT_COLOR, ASPEK_ORDER } from "@/lib/kajian";
import { QUADRANT_COLOR } from "@/components/charts";

/** Side menu kajian: 12 alternatif dikelompokkan per kuadran, dengan empat titik penilaian. */
export function KajianNav() {
  const path = usePathname();
  const items = kajian.alternatif;
  return (
    <nav aria-label="Daftar alternatif" className="lg:sticky lg:top-6 lg:w-60 lg:shrink-0 lg:self-start">
      <Link href="/kajian" aria-current={path === "/kajian" ? "page" : undefined}
        className={`mb-2 block rounded-md px-3 py-2 text-sm ${path === "/kajian" ? "bg-surface font-semibold shadow-sm ring-1 ring-grid" : "text-ink-2 hover:bg-surface"}`}>
        Ikhtisar 12 alternatif
      </Link>
      <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:gap-3 lg:overflow-visible">
        {KUADRAN_ORDER.map((q) => {
          const group = items.filter((a) => a.kuadran === q);
          if (!group.length) return null;
          return (
            <section key={q} className="min-w-[14rem] shrink-0 lg:min-w-0">
              <h2 className="mb-1 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                <span className="h-2 w-2 rounded-full" style={{ background: QUADRANT_COLOR[q] }} aria-hidden />{q}
              </h2>
              <ul className="space-y-0.5">
                {group.map((a) => {
                  const href = `/kajian/${a.id}`;
                  const active = path === href;
                  return (
                    <li key={a.id}>
                      <Link href={href} aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${active ? "bg-surface font-semibold shadow-sm ring-1 ring-grid" : "text-ink-2 hover:bg-surface"}`}>
                        <span className="w-7 shrink-0 text-xs text-ink-3">{a.id}</span>
                        <span className="min-w-0 flex-1 truncate">{SHORT[a.id] ?? a.nama}</span>
                        <span className="flex shrink-0 gap-0.5" aria-label={ASPEK_ORDER.map((k) => `${k} ${a.verdict[k].nilai}`).join(", ")}>
                          {ASPEK_ORDER.map((k) => <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ background: VERDICT_COLOR[a.verdict[k].nilai] }} aria-hidden />)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-3 hidden px-3 text-[11px] leading-4 text-ink-3 lg:block">Titik: permintaan · pasokan · ekonomi · kesiapan (hijau kuat, kuning sedang, merah lemah).</p>
    </nav>
  );
}
