"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ekonomi as e, SKENARIO_LABEL, type AlternatifEkonomi, type Skenario } from "@/lib/ekonomi";
import { n, pct, rp } from "@/lib/format";
import { QUADRANT_COLOR, RankedBars, GroupedBars } from "@/components/charts";
import { ChartCard, DataTable, Pill } from "@/components/ui";

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const SHORT: Record<string, string> = {
  A1: "Commercial Intelligence", A2: "Standardisasi tarif", A3: "Kios F&B grab-and-go", A4: "Parcel locker", A5: "Hub EV charging",
  A6: "Gudang mikro", A7: "DOOH advertising", A8: "Perawatan self-service", A9: "Profil & fasilitas", A10: "ATM → kiosk digital",
  A11: "Lounge lantai 2", A12: "PLTS kanopi",
};
const yrs = (v: number | null) => (v === null ? "> 10 th" : v === 0 ? "langsung" : `${n(v, 1)} th`);

export function EkonomiExplorer() {
  const items = e.alternatif;
  const [sc, setSc] = useState<Skenario>("dasar");
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => "");
  const [picked, setPicked] = useState<string | null>(null);
  const selectedId = picked ?? (items.some((a) => a.id === hash) ? hash : items[0].id);
  const sel = items.find((a) => a.id === selectedId) ?? items[0];
  const select = (id: string) => { setPicked(id); history.replaceState(null, "", `#${id}`); };

  const rows = [...items].sort((a, b) => b.skenario[sc].pendapatan - a.skenario[sc].pendapatan)
    .map((a) => ({ ...a, label: `${a.id} · ${SHORT[a.id] ?? a.nama}`, pendapatan: a.skenario[sc].pendapatan, omzet: a.skenario[sc].omzet_mitra, capex_p: a.skenario[sc].capex_pertamina, capex_m: a.skenario[sc].capex_mitra }));
  const t = e.total[sc];
  const h = sel.skenario[sc];

  const tabel = (
    <DataTable rows={items} columns={[
      { key: "id", label: "ID" }, { key: "nama", label: "Alternatif" },
      { key: "k", label: "Konservatif", align: "right", render: (a) => rp(a.skenario.konservatif.pendapatan) },
      { key: "d", label: "Dasar", align: "right", render: (a) => rp(a.skenario.dasar.pendapatan) },
      { key: "o", label: "Optimis", align: "right", render: (a) => rp(a.skenario.optimis.pendapatan) },
      { key: "u", label: "Unit (dasar)", align: "right", render: (a) => n(a.skenario.dasar.unit) },
    ]} />
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ink-2">Skenario:</span>
        <div className="flex gap-1" role="group" aria-label="Skenario">
          {e.parameter.skenario.map((s) => (
            <button key={s} type="button" aria-pressed={sc === s} onClick={() => setSc(s)}
              className={`rounded-md border px-2.5 py-1 ${sc === s ? "border-accent bg-plane font-semibold" : "border-grid text-ink-2 hover:bg-plane"}`}>{SKENARIO_LABEL[s]}</button>
          ))}
        </div>
        <span className="ml-auto text-ink-3">Diskonto {pct(e.parameter.diskonto * 100, 0)} · horizon {e.parameter.horizon_tahun} th · ramp {e.parameter.ramp.map((r) => pct(r * 100, 0)).join(" / ")}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCard title={`Pendapatan tambahan Pertamina per tahun · skenario ${SKENARIO_LABEL[sc].toLowerCase()}`} note="Kondisi mapan (tahun ke-3+). Warna = kuadran Impact-Effort. Klik batang untuk rincian." className="xl:col-span-3" table={tabel}>
        <div onClickCapture={(ev) => {
          const el = (ev.target as HTMLElement).closest("[data-id]") as HTMLElement | null;
          if (el?.dataset.id) select(el.dataset.id);
        }}>
          <RankedBars rows={rows} label="label" value="pendapatan" format={(v) => rp(v, 1)} maxRows={12} height={12 * 30 + 16}
            colorOf={(r) => QUADRANT_COLOR[r.kuadran]}
            tip={(r) => [{ label: "Pendapatan/th", value: rp(r.pendapatan) }, { label: "Omzet mitra/th", value: rp(r.omzet) }, { label: "Unit", value: n(r.skenario[sc].unit) }, { label: "Kuadran", value: r.kuadran }]} />
        </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(QUADRANT_COLOR) as AlternatifEkonomi["kuadran"][]).map((q) => <Pill key={q} color={QUADRANT_COLOR[q]}>{q}</Pill>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Tile k="Total pendapatan/th" v={rp(t.pendapatan)} sub="tanpa A1 & tumpang tindih" />
            <Tile k="Omzet mitra/th" v={rp(t.omzet_mitra)} sub="dampak ekonomi lebih luas" />
            <Tile k="Capex mitra" v={rp(t.capex_mitra)} sub="ditanggung tenant/mitra" />
            <Tile k="Capex Pertamina" v={rp(t.capex_pertamina)} sub={`NPV ${e.parameter.horizon_tahun} th ${rp(t.npv)}`} />
          </div>
        </ChartCard>

        <section className="card min-w-0 p-4 xl:col-span-2" id={sel.id} aria-live="polite">
          <div className="flex items-center gap-2 text-xs text-ink-3"><span className="h-2 w-2 rounded-full" style={{ background: QUADRANT_COLOR[sel.kuadran] }} aria-hidden />{sel.id} · {sel.kuadran} · dampak {n(sel.impact, 1)} / usaha {n(sel.effort, 1)}</div>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{sel.nama}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-2">{sel.model}</p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full whitespace-nowrap text-xs">
              <thead><tr className="border-b border-grid text-left text-[10px] uppercase tracking-wide text-ink-3"><th className="whitespace-normal py-1.5 pr-2 font-medium">{sel.unit}</th>{e.parameter.skenario.map((s) => <th key={s} className={`py-1.5 pr-2 text-right font-medium ${s === sc ? "text-ink" : ""}`}>{SKENARIO_LABEL[s]}</th>)}</tr></thead>
              <tbody className="tnum">
                {([
                  ["Unit beroperasi", (s: Skenario) => `${n(sel.skenario[s].unit)} / ${n(sel.pool)}`],
                  ["Pendapatan Pertamina/th", (s: Skenario) => rp(sel.skenario[s].pendapatan)],
                  ["  per unit/th", (s: Skenario) => rp(sel.skenario[s].pendapatan_per_unit)],
                  ["Omzet mitra/th", (s: Skenario) => (sel.skenario[s].omzet_mitra ? rp(sel.skenario[s].omzet_mitra) : "–")],
                  ["Capex Pertamina", (s: Skenario) => rp(sel.skenario[s].capex_pertamina)],
                  ["Capex mitra", (s: Skenario) => (sel.skenario[s].capex_mitra ? rp(sel.skenario[s].capex_mitra) : "–")],
                  ["Opex Pertamina/th", (s: Skenario) => rp(sel.skenario[s].opex_pertamina)],
                  ["Payback Pertamina", (s: Skenario) => yrs(sel.skenario[s].payback_tahun)],
                  [`NPV ${e.parameter.horizon_tahun} th`, (s: Skenario) => rp(sel.skenario[s].npv)],
                  ["NPV 20 th", (s: Skenario) => rp(sel.skenario[s].npv_20)],
                ] as [string, (s: Skenario) => string][]).map(([k, f]) => (
                  <tr key={k} className="border-b border-grid/60 last:border-0"><td className={`py-1.5 pr-2 ${k.startsWith("  ") ? "pl-3 text-ink-3" : "text-ink-2"}`}>{k.trim()}</td>{e.parameter.skenario.map((s) => <td key={s} className={`py-1.5 pr-2 text-right ${s === sc ? "font-semibold" : ""} ${(k.startsWith("NPV") && sel.skenario[s][k === "NPV 20 th" ? "npv_20" : "npv"] < 0) ? "text-critical" : ""}`}>{f(s)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Asumsi</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{sel.asumsi.map((b) => <li key={b}>{b}</li>)}</ul>
          {sel.overlap && <p className="mt-3 rounded-md bg-plane p-2 text-xs text-ink-2"><strong>Tumpang tindih:</strong> {sel.overlap}</p>}
          <p className="mt-3 text-xs text-ink-3">Skor & bukti kualitatif: <Link className="underline" href={`/rekomendasi#${sel.id}`}>Rekomendasi {sel.id}</Link>.{h.capex_mitra && h.unit ? ` Capex mitra per unit ${rp(h.capex_mitra / h.unit)}.` : ""}</p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title={`Siapa yang membayar: capex Pertamina vs mitra · ${SKENARIO_LABEL[sc].toLowerCase()}`} note="Sebagian besar alternatif memakai model kemitraan: tenant/mitra membiayai aset, Pertamina menyewakan lahan. PLTS (A12) adalah pengecualian."
          table={<DataTable rows={rows} columns={[{ key: "id", label: "ID" }, { key: "capex_p", label: "Capex Pertamina", align: "right", render: (r) => rp(r.capex_p) }, { key: "capex_m", label: "Capex mitra", align: "right", render: (r) => rp(r.capex_m) }]} />}>
          <GroupedBars rows={[...rows].sort((a, b) => (b.capex_p + b.capex_m) - (a.capex_p + a.capex_m))} label="id" format={(v) => rp(v, 0)}
            series={[{ key: "capex_p", name: "Capex Pertamina", color: "var(--series-1)" }, { key: "capex_m", name: "Capex mitra", color: "var(--series-2)" }]} />
        </ChartCard>
        <ChartCard title={`Omzet mitra/tenant per tahun · ${SKENARIO_LABEL[sc].toLowerCase()}`} note="Dampak ekonomi di luar pendapatan Pertamina (UMKM, operator). Hanya alternatif dengan omzet mitra yang bisa ditaksir."
          table={<DataTable rows={rows.filter((r) => r.omzet > 0)} columns={[{ key: "id", label: "ID" }, { key: "nama", label: "Alternatif" }, { key: "omzet", label: "Omzet mitra/th", align: "right", render: (r) => rp(r.omzet) }]} />}>
          <RankedBars rows={rows.filter((r) => r.omzet > 0).sort((a, b) => b.omzet - a.omzet)} label="label" value="omzet" format={(v) => rp(v, 0)} color="var(--series-4)" height={rows.filter((r) => r.omzet > 0).length * 40 + 16}
            tip={(r) => [{ label: "Omzet mitra/th", value: rp(r.omzet) }, { label: "Unit", value: n(r.skenario[sc].unit) }]} />
        </ChartCard>
      </div>
    </>
  );
}

function Tile({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="rounded-md bg-plane px-2.5 py-2">
      <div className="text-ink-3">{k}</div>
      <div className="tnum text-base font-semibold text-ink">{v}</div>
      {sub && <div className="text-ink-3">{sub}</div>}
    </div>
  );
}
