"use client";

import Link from "next/link";
import { kajian, ASPEK_LABEL, ASPEK_ORDER, VERDICT_COLOR, SUMBER_LABEL, SUMBER_COLOR, KUADRAN_ORDER, type Grafik, type Sumber } from "@/lib/kajian";
import { ekonomi, SKENARIO_LABEL, type Skenario } from "@/lib/ekonomi";
import { n, pct, rp } from "@/lib/format";
import { ChartCard, DataTable, Pill, Insight } from "@/components/ui";
import { GroupedBars, QUADRANT_COLOR, RankedBars, SERIES } from "@/components/charts";

const fmt = (f: Grafik["format"]) => (f === "rp" ? (v: number) => rp(v, 1) : f === "pct" ? (v: number) => pct(v, 1) : (v: number) => n(v));
const yrs = (v: number | null) => (v === null ? "> 10 th" : v === 0 ? "langsung" : `${n(v, 1)} th`);

export function KajianDetail({ id }: { id: string }) {
  const a = kajian.alternatif.find((x) => x.id === id)!;
  const e = ekonomi.alternatif.find((x) => x.id === id);
  const ordered = [...kajian.alternatif].sort((x, y) => KUADRAN_ORDER.indexOf(x.kuadran) - KUADRAN_ORDER.indexOf(y.kuadran));
  const idx = ordered.findIndex((x) => x.id === id);
  const prev = ordered[idx - 1], next = ordered[idx + 1];
  const sumberAda = (["brightspace", "survei", "master"] as Sumber[]).filter((s) => a.internal.some((b) => b.sumber === s));

  return (
    <article>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <Pill color={QUADRANT_COLOR[a.kuadran]}>{a.kuadran}</Pill>
          <span>{a.id} · {a.kategori} · dampak {n(a.impact, 1)} / usaha {n(a.effort, 1)}</span>
        </div>
        <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">{a.nama}</h1>
        <p className="mt-3 max-w-3xl border-l-2 border-accent pl-3 text-sm italic leading-6 text-ink-2">{a.pertanyaan}</p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {ASPEK_ORDER.map((k) => {
          const v = a.verdict[k];
          return (
            <section key={k} className="card p-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-3">{ASPEK_LABEL[k]}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: VERDICT_COLOR[v.nilai] }} aria-hidden />{v.nilai}</span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-ink-2">{v.alasan}</p>
            </section>
          );
        })}
      </div>

      <div className="mt-4"><Insight><strong>Ringkasan kajian.</strong> {a.ringkasan}</Insight></div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Bukti dari data yang kita punya</h2>
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {sumberAda.map((s) => <Pill key={s} color={SUMBER_COLOR[s]}>{SUMBER_LABEL[s]} · {a.internal.filter((b) => b.sumber === s).length}</Pill>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3"><th className="py-2 pr-3 font-medium">Sumber</th><th className="py-2 pr-3 font-medium">Temuan</th><th className="py-2 pr-3 font-medium">Nilai</th><th className="py-2 pr-3 font-medium">Catatan</th></tr></thead>
            <tbody>
              {a.internal.map((b, i) => (
                <tr key={i} className="border-b border-grid/60 align-top last:border-0">
                  <td className="whitespace-nowrap py-2 pr-3"><span className="inline-flex items-center gap-1.5 text-xs"><span className="h-2 w-2 rounded-full" style={{ background: SUMBER_COLOR[b.sumber] }} aria-hidden />{SUMBER_LABEL[b.sumber]}</span></td>
                  <td className="min-w-[12rem] py-2 pr-3">{b.label}</td>
                  <td className="tnum min-w-[10rem] py-2 pr-3 font-medium">{b.nilai}</td>
                  <td className="min-w-[14rem] py-2 pr-3 text-xs leading-5 text-ink-2">{b.catatan ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {a.grafik.length > 0 && (
        <div className={`mt-4 grid gap-4 ${a.grafik.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {a.grafik.map((g) => <GrafikCard key={g.judul} g={g} />)}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-base font-semibold">Dukungan data eksternal</h2>
      <div className="card p-4">
        <DataTable rows={a.eksternal} columns={[
          { key: "item", label: "Item", render: (r) => <span className="font-medium">{r.item}</span> },
          { key: "nilai", label: "Nilai" },
          { key: "sumber", label: "Sumber", render: (r) => <a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.sumber}</a> },
          { key: "relevansi", label: "Relevansi untuk alternatif ini", render: (r) => <span className="text-xs leading-5 text-ink-2">{r.relevansi}</span> },
        ]} />
        <p className="mt-3 text-xs text-ink-3">{kajian.sumber.eksternal}.</p>
      </div>

      {e && (
        <>
          <h2 className="mb-3 mt-8 text-base font-semibold">Ekonomi dalam tiga skenario</h2>
          <div className="grid gap-4 lg:grid-cols-5">
            <section className="card min-w-0 p-4 lg:col-span-3">
              <p className="text-sm leading-6 text-ink-2">{e.model}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full whitespace-nowrap text-xs">
                  <thead><tr className="border-b border-grid text-left text-[10px] uppercase tracking-wide text-ink-3"><th className="whitespace-normal py-1.5 pr-2 font-medium">{e.unit}</th>{ekonomi.parameter.skenario.map((s) => <th key={s} className={`py-1.5 pr-2 text-right font-medium ${s === "dasar" ? "text-ink" : ""}`}>{SKENARIO_LABEL[s]}</th>)}</tr></thead>
                  <tbody className="tnum">
                    {([
                      ["Unit beroperasi", (s: Skenario) => `${n(e.skenario[s].unit)} / ${n(e.pool)}`],
                      ["Pendapatan Pertamina/th", (s: Skenario) => rp(e.skenario[s].pendapatan)],
                      ["  per unit/th", (s: Skenario) => rp(e.skenario[s].pendapatan_per_unit)],
                      ["Omzet mitra/th", (s: Skenario) => (e.skenario[s].omzet_mitra ? rp(e.skenario[s].omzet_mitra) : "–")],
                      ["Capex Pertamina", (s: Skenario) => rp(e.skenario[s].capex_pertamina)],
                      ["Capex mitra", (s: Skenario) => (e.skenario[s].capex_mitra ? rp(e.skenario[s].capex_mitra) : "–")],
                      ["Payback Pertamina", (s: Skenario) => yrs(e.skenario[s].payback_tahun)],
                      [`NPV ${ekonomi.parameter.horizon_tahun} th`, (s: Skenario) => rp(e.skenario[s].npv)],
                    ] as [string, (s: Skenario) => string][]).map(([k, f]) => (
                      <tr key={k} className="border-b border-grid/60 last:border-0"><td className={`py-1.5 pr-2 ${k.startsWith("  ") ? "pl-3 text-ink-3" : "text-ink-2"}`}>{k.trim()}</td>{ekonomi.parameter.skenario.map((s) => <td key={s} className={`py-1.5 pr-2 text-right ${s === "dasar" ? "font-semibold" : ""} ${k.startsWith("NPV") && e.skenario[s].npv < 0 ? "text-critical" : ""}`}>{f(s)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-ink-3">Rincian, grafik, dan tolok ukur: <Link className="underline" href={`/ekonomi#${a.id}`}>Dampak ekonomi {a.id}</Link>. Metodologi lengkap ada di dokumen PDF <code>out/dampak_ekonomi_metodologi.pdf</code>.</p>
            </section>
            <section className="card min-w-0 p-4 lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Asumsi di balik angka</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-5">{e.asumsi.map((b) => <li key={b}>{b}</li>)}</ul>
              {e.overlap && <p className="mt-3 rounded-md bg-plane p-2 text-xs leading-5 text-ink-2"><strong>Tumpang tindih:</strong> {e.overlap}</p>}
            </section>
          </div>
        </>
      )}

      <h2 className="mb-3 mt-8 text-base font-semibold">Risiko, prasyarat, dan langkah berikutnya</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="Risiko utama" items={a.risiko} tone="var(--status-critical)" />
        <ListCard title="Prasyarat sebelum skala" items={a.prasyarat} tone="var(--status-warning)" />
        <ListCard title="Rancangan pilot" items={a.pilot} tone="var(--status-good)" ordered />
        <ListCard title="Data yang masih dibutuhkan" items={a.data_dibutuhkan} tone="var(--series-7)" />
      </div>

      <div className="mt-4 rounded-md bg-plane p-3 text-xs text-ink-2">
        <strong>KPI yang diusulkan:</strong> {a.kpi}. Skor & bukti kualitatif awal: <Link className="underline" href={`/rekomendasi#${a.id}`}>Rekomendasi {a.id}</Link>.
      </div>

      <nav className="mt-8 flex justify-between gap-4 border-t border-grid pt-4 text-sm" aria-label="Alternatif sebelumnya dan berikutnya">
        {prev ? <Link className="underline-offset-2 hover:underline" href={`/kajian/${prev.id}`}>← {prev.id} · {prev.nama}</Link> : <span />}
        {next ? <Link className="text-right underline-offset-2 hover:underline" href={`/kajian/${next.id}`}>{next.id} · {next.nama} →</Link> : <span />}
      </nav>
    </article>
  );
}

function GrafikCard({ g }: { g: Grafik }) {
  const f = fmt(g.format);
  const rows = g.rows as Array<Record<string, string | number>>;
  const table = g.series
    ? <DataTable rows={rows} columns={[{ key: "label", label: "Kategori" }, ...g.series.map((s) => ({ key: s.key, label: s.name, align: "right" as const, render: (r: Record<string, string | number>) => f(Number(r[s.key])) }))]} />
    : <DataTable rows={rows} columns={[{ key: "label", label: "Kategori" }, { key: "value", label: "Nilai", align: "right", render: (r) => f(Number(r.value)) }]} />;
  return (
    <ChartCard title={g.judul} note={g.catatan ?? undefined} table={table}>
      {g.series
        ? <GroupedBars rows={rows} label="label" format={f} series={g.series.map((s, i) => ({ key: s.key, name: s.name, color: SERIES[i % SERIES.length] }))} />
        : <RankedBars rows={rows} label="label" value="value" format={f} maxRows={12} height={rows.length * 30 + 16} />}
    </ChartCard>
  );
}

function ListCard({ title, items, tone, ordered }: { title: string; items: string[]; tone: string; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <section className="card flex gap-3 p-4">
      <div className="w-1 shrink-0 rounded-full" style={{ background: tone }} aria-hidden />
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Tag className={`mt-2 space-y-1.5 pl-5 text-sm leading-5 ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((s) => <li key={s}>{s}</li>)}</Tag>
      </div>
    </section>
  );
}
