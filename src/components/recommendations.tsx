"use client";

import { useState, useSyncExternalStore } from "react";
import type { Alternative } from "@/lib/data";
import { n } from "@/lib/format";
import { ImpactEffortMatrix, QUADRANT_COLOR } from "@/components/charts";
import { DataTable, Pill } from "@/components/ui";

const QUADRANTS: Alternative["kuadran"][] = ["Quick Win", "Major Project", "Fill-in", "Thankless Task"];
const QUADRANT_HINT: Record<Alternative["kuadran"], string> = {
  "Quick Win": "Dampak tinggi, usaha rendah: jalankan sekarang (gelombang 1).",
  "Major Project": "Dampak tinggi, usaha besar: rencanakan sebagai program multi-tahun dengan pilot (gelombang 2).",
  "Fill-in": "Dampak moderat, usaha rendah: isi kapasitas tim bila ada (gelombang 3).",
  "Thankless Task": "Dampak rendah, usaha besar: tunda atau batalkan.",
};
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const EFFORT_LABEL: Record<string, string> = { capex: "Capex", regulasi: "Regulasi", mitra: "Ketergantungan mitra", proses: "Perubahan proses" };

export function Recommendations({ items }: { items: Alternative[] }) {
  // Pilihan awal dari hash URL (#A5); di server belum ada hash, jadi pakai item pertama.
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => "");
  const [picked, setSelected] = useState<string | null>(null);
  const selected = picked ?? (items.some((a) => a.id === hash) ? hash : items[0]?.id);
  const sel = items.find((a) => a.id === selected) ?? items[0];
  const select = (id: string) => { setSelected(id); history.replaceState(null, "", `#${id}`); };
  const [showTable, setShowTable] = useState(false);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-5">
        <section className="card p-4 xl:col-span-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Impact-Effort Matrix</h2>
              <p className="mt-0.5 text-xs text-ink-2">Ukuran titik = jumlah lahan/SPBU yang terjangkau. Klik titik untuk membuka rinciannya. Garis tengah: dampak 6,5 dan usaha 5,5.</p>
            </div>
            <button type="button" onClick={() => setShowTable((s) => !s)} className="shrink-0 rounded-md border border-grid px-2 py-1 text-xs text-ink-2 hover:bg-plane" aria-pressed={showTable}>{showTable ? "Grafik" : "Tabel"}</button>
          </div>
          {showTable ? (
            <DataTable rows={items} columns={[{ key: "id", label: "ID" }, { key: "nama", label: "Alternatif" }, { key: "kuadran", label: "Kuadran" }, { key: "impact", label: "Dampak", align: "right", render: (r) => n(r.impact, 1) }, { key: "effort", label: "Usaha", align: "right", render: (r) => n(r.effort, 1) }, { key: "addressable", label: "Terjangkau", align: "right", render: (r) => n(r.addressable) }]} />
          ) : (
            <ImpactEffortMatrix items={items} selected={selected} onSelect={select} />
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {QUADRANTS.map((q) => <Pill key={q} color={QUADRANT_COLOR[q]}>{q} · {items.filter((a) => a.kuadran === q).length}</Pill>)}
          </div>
        </section>

        <section className="card p-4 xl:col-span-2" id={sel.id} aria-live="polite">
          <div className="flex items-center gap-2 text-xs text-ink-3"><span className="h-2 w-2 rounded-full" style={{ background: QUADRANT_COLOR[sel.kuadran] }} aria-hidden />{sel.id} · {sel.kategori} · {sel.kuadran}</div>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{sel.nama}</h3>
          <p className="mt-2 text-sm leading-6">{sel.deskripsi}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-plane p-2"><div className="text-xs text-ink-3">Dampak</div><div className="text-xl font-semibold">{n(sel.impact, 1)}</div></div>
            <div className="rounded-md bg-plane p-2"><div className="text-xs text-ink-3">Usaha</div><div className="text-xl font-semibold">{n(sel.effort, 1)}</div></div>
            <div className="rounded-md bg-plane p-2"><div className="text-xs text-ink-3">Terjangkau</div><div className="text-xl font-semibold">{n(sel.addressable)}</div></div>
          </div>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Bukti dari data</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{sel.bukti.map((b) => <li key={b}>{b}</li>)}</ul>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Komponen usaha (1 ringan – 3 berat)</h4>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(sel.effort_rincian).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between"><span className="text-ink-2">{EFFORT_LABEL[k]}</span><span className="inline-flex gap-0.5">{[1, 2, 3].map((i) => <span key={i} className="h-2 w-4 rounded-sm" style={{ background: i <= v ? "var(--seq-500)" : "var(--seq-100)" }} />)}</span></div>
            ))}
          </div>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">KPI usulan</h4>
          <p className="mt-1 text-sm">{sel.kpi}</p>
        </section>
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Semua alternatif per kuadran</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {QUADRANTS.map((q) => (
          <section key={q} className="card p-4">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: QUADRANT_COLOR[q] }} aria-hidden /><h3 className="font-semibold">{q}</h3></div>
            <p className="mt-1 text-xs text-ink-2">{QUADRANT_HINT[q]}</p>
            <ul className="mt-3 divide-y divide-grid">
              {items.filter((a) => a.kuadran === q).map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => { select(a.id); window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} className={`flex w-full items-start justify-between gap-3 py-2 text-left text-sm hover:text-accent ${a.id === selected ? "font-semibold" : ""}`}>
                    <span><span className="mr-2 text-ink-3">{a.id}</span>{a.nama}</span>
                    <span className="shrink-0 tnum text-xs text-ink-3">D {n(a.impact, 1)} · U {n(a.effort, 1)}</span>
                  </button>
                </li>
              ))}
              {items.filter((a) => a.kuadran === q).length === 0 && <li className="py-2 text-sm text-ink-3">Tidak ada.</li>}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
