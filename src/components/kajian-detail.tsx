"use client";

import Link from "next/link";
import { kajian, ASPEK_LABEL, ASPEK_ORDER, VERDICT_COLOR, SUMBER_LABEL, SUMBER_COLOR, KUADRAN_ORDER, SIKAP_COLOR, STATUS_DATA_COLOR, type Grafik, type Matching, type Rencana, type Sumber } from "@/lib/kajian";
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

      <RencanaSection r={a.rencana} />
      {a.matching?.nilai_tambah && <NilaiTambahSection v={a.matching.nilai_tambah} />}
      {a.matching && <MatchingSection m={a.matching} />}

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

      <h2 className="mb-3 mt-8 text-base font-semibold">Risiko, prasyarat, dan rincian pilot</h2>
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

function RencanaSection({ r }: { r: Rencana }) {
  return (
    <section className="mt-8" aria-labelledby="rencana">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 id="rencana" className="text-base font-semibold">Apa yang akan kita lakukan</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-grid px-2.5 py-0.5 text-xs font-semibold">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: SIKAP_COLOR[r.sikap.tingkat] }} aria-hidden />{r.sikap.label}
        </span>
      </div>

      <div className="card p-4">
        <p className="max-w-4xl text-sm leading-6">{r.inti}</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Cara kerja</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-5">{r.cara_kerja.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Siapa mengerjakan apa</h3>
            <dl className="mt-2 divide-y divide-grid/60 text-sm">
              {r.peran.map((x) => (
                <div key={x.pihak} className="grid gap-1 py-1.5 sm:grid-cols-[11rem_1fr] sm:gap-3">
                  <dt className="font-medium">{x.pihak}</dt>
                  <dd className="text-ink-2">{x.tugas}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Tahapan</h3>
      <ol className="grid gap-3 md:grid-cols-3">
        {r.tahapan.map((t, i) => (
          <li key={t.fase} className="card min-w-0 p-4">
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">{i + 1}</span>{t.fase}
            </div>
            <div className="mt-1 text-sm font-semibold">{t.judul}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-ink-2">{t.kegiatan.map((k) => <li key={k}>{k}</li>)}</ul>
          </li>
        ))}
      </ol>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="card flex gap-3 p-4">
          <div className="w-1 shrink-0 rounded-full bg-good" aria-hidden />
          <p className="text-sm leading-5"><strong>Lanjut ke skala berikutnya bila:</strong> {r.ambang.lanjut}</p>
        </div>
        <div className="card flex gap-3 p-4">
          <div className="w-1 shrink-0 rounded-full bg-critical" aria-hidden />
          <p className="text-sm leading-5"><strong>Hentikan atau ubah bila:</strong> {r.ambang.berhenti}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-3">Ambang di atas adalah usulan awal untuk dibahas; sesuaikan dengan target korporat dan data pilot.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ business matching & rekomendasi pasar (A1) */
function StatusDot({ s }: { s: Matching["logika"][number]["status"] }) {
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs"><span className="h-2 w-2 rounded-full" style={{ background: STATUS_DATA_COLOR[s] }} aria-hidden />{s}</span>;
}

function MockFrame({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="card min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-grid bg-plane px-4 py-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-ink-3">{sub}</div>
        </div>
        <span className="shrink-0 rounded-full border border-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">Gambaran fitur</span>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function NilaiTambahSection({ v }: { v: NonNullable<Matching["nilai_tambah"]> }) {
  return (
    <section className="mt-8" aria-labelledby="nilai-tambah">
      <h2 id="nilai-tambah" className="text-base font-semibold">Nilai tambah: Pertamina sebagai commercial matchmaker</h2>
      <div className="card mt-3 flex gap-3 p-4">
        <div className="w-1 shrink-0 rounded-full bg-accent" aria-hidden />
        <p className="max-w-4xl text-sm font-medium leading-6">{v.peran}</p>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {v.poin.map((x) => (
          <section key={x.judul} className="card flex flex-col p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">{x.pihak}</div>
            <h3 className="mt-1 text-sm font-semibold">{x.judul}</h3>
            <p className="mt-1 text-sm leading-5 text-ink-2">{x.isi}</p>
            <p className="mt-3 rounded-md bg-plane px-3 py-2 text-xs leading-5">{x.angka}</p>
            {x.syarat && (
              <p className="mt-2 flex gap-2 text-xs leading-5 text-ink-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning" aria-hidden />
                <span><span className="font-semibold text-ink">Syarat: </span>{x.syarat}</span>
              </p>
            )}
          </section>
        ))}
      </div>

      <div className="card mt-3 p-4">
        <h3 className="text-sm font-semibold">Pergeseran peran</h3>
        <div className="mt-2 hidden grid-cols-[11rem_1fr_1fr] gap-x-4 border-b border-grid pb-2 text-xs font-semibold uppercase tracking-wide text-ink-3 md:grid" aria-hidden>
          <span>Aspek</span><span>Hari ini</span><span>Dengan platform</span>
        </div>
        <dl>
          {v.pergeseran.map((r) => (
            <div key={r.aspek} className="grid gap-x-4 gap-y-1 border-b border-grid py-2 text-sm last:border-0 md:grid-cols-[11rem_1fr_1fr]">
              <dt className="font-semibold">{r.aspek}</dt>
              <dd className="text-ink-2"><span className="text-xs text-ink-3 md:hidden">Hari ini: </span>{r.dulu}</dd>
              <dd><span className="text-xs text-ink-3 md:hidden">Dengan platform: </span>{r.nanti}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function MatchingSection({ m }: { m: Matching }) {
  const cl = m.contoh_lahan, ct = m.contoh_tenant;
  const maxSeg = cl ? Math.max(...cl.pembanding.segmen.map((s) => s.value)) : 1;
  const maxKota = ct ? Math.max(...ct.kota_teratas.map((s) => s.value)) : 1;
  return (
    <section className="mt-8" aria-labelledby="matching">
      <h2 id="matching" className="text-base font-semibold">Business matching & rekomendasi pasar</h2>
      <p className="mt-1 max-w-4xl text-sm leading-6 text-ink-2">{m.konsep}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {m.pengguna.map((x) => (
          <section key={x.pihak} className="card p-4">
            <h3 className="text-sm font-semibold">{x.pihak}</h3>
            <p className="mt-1 text-sm leading-5 text-ink-2">{x.kebutuhan}</p>
          </section>
        ))}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {m.arah.map((x) => (
          <section key={x.nama} className="card flex gap-3 p-4">
            <div className="w-1 shrink-0 rounded-full bg-accent" aria-hidden />
            <div><h3 className="text-sm font-semibold">{x.nama}</h3><p className="mt-1 text-sm leading-5 text-ink-2">{x.isi}</p></div>
          </section>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold">Gambaran fitur, dihitung dari data yang sudah ada</h3>
      <p className="mb-3 text-xs text-ink-3">Dua contoh nyata di bawah ini dibuat oleh <code>kajian.py</code> hanya dari Brightspace dan master lahan (lapisan 1–3). Lapisan lokasi dan bukti keberhasilan belum ikut, sehingga ini batas bawah dari apa yang bisa dijawab.</p>
      <div className="grid gap-4">
        {cl && (
          <MockFrame title={`Lahan ${cl.kode} · SPBU ${cl.spbu}`} sub={`${cl.kota}, ${cl.prov} · ${n(cl.luas, 1)} m² · ${cl.posisi.toLowerCase()} · ${cl.lantai}${cl.daya ? ` · ${n(cl.daya)} W` : ""} · listing ${rp(cl.tarif_listing)}/th`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Lahan sejenis yang sudah tersewa</div>
                <div className="mt-0.5 text-xs text-ink-2">{n(cl.pembanding.jumlah)} {cl.pembanding.definisi}</div>
                <ul className="mt-2 space-y-1">
                  {cl.pembanding.segmen.map((s) => (
                    <li key={s.label} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-xs">
                      <span className="truncate" title={s.label}>{s.label}</span>
                      <span className="h-2 rounded-sm bg-grid"><span className="block h-2 rounded-sm" style={{ width: `${(100 * s.value) / maxSeg}%`, background: cl.segmen_ada.includes(s.label) ? "var(--muted-mark)" : "var(--series-1)" }} /></span>
                      <span className="tnum text-right text-ink-2">{n(s.value)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-ink-3">Abu-abu: segmen yang sudah ada di SPBU ini ({cl.segmen_ada.length ? cl.segmen_ada.join(", ") : "belum ada tenant"}).</div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Tarif wajar</div>
                <div className="mt-0.5 text-sm"><span className="tnum font-semibold">{rp(cl.tarif_wajar.p25)}–{rp(cl.tarif_wajar.p75)}</span><span className="text-xs text-ink-2">/th · median {rp(cl.tarif_wajar.median)} dari {n(cl.tarif_wajar.n)} pembanding bertarif · listing saat ini {rp(cl.tarif_listing)}</span></div>
                {cl.area.length > 0 && <>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Area sekitar (isian pengelola)</div>
                  <ul className="mt-0.5 text-xs text-ink-2">{cl.area.map((a, i) => <li key={i}>{a.nama} · {a.kategori}{a.km !== null ? ` · ${n(a.km, 1)} km` : ""}</li>)}</ul>
                </>}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Cocok untuk</div>
                <ol className="mt-2 space-y-2">
                  {cl.rekomendasi.map((r, i) => (
                    <li key={r.segmen} className="rounded-md border border-grid p-2.5">
                      <div className="flex items-center justify-between gap-2 text-sm font-semibold"><span>{i + 1}. {r.segmen}</span><span className="tnum text-xs font-normal text-ink-2">{pct(r.share_pct)} pembanding</span></div>
                      <div className="mt-1 text-xs text-ink-2">{r.alasan}</div>
                      <div className="mt-1.5 text-xs"><span className="text-ink-3">Kandidat tenant ({r.tingkat_kandidat} ini): </span>{r.kandidat.map((k) => `${k.tenant} (${n(k.lahan)})`).join(" · ")}</div>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Belum terjawab oleh data kita</div>
                <ul className="mt-0.5 list-disc pl-4 text-xs text-ink-2">{cl.belum_terjawab.map((x) => <li key={x}>{x}</li>)}</ul>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Link href={`/data/spbu/${cl.spbu_id}`} className="rounded-md border border-grid px-2 py-1 hover:bg-plane">Detail SPBU</Link>
                  <span className="rounded-md bg-accent px-2 py-1 font-semibold text-white opacity-60" aria-disabled>Ajukan minat (fitur Brightspace)</span>
                </div>
              </div>
            </div>
          </MockFrame>
        )}
        {ct && (
          <MockFrame title={ct.tenant} sub={`${ct.segmen} · ${n(ct.lahan)} lahan di ${n(ct.spbu)} SPBU · biasanya ${n(ct.luas_p25, 1)}–${n(ct.luas_p75, 1)} m², ${ct.posisi.toLowerCase()} · tarif median ${rp(ct.tarif_median)}/th`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Jejak saat ini per provinsi</div>
                <ul className="mt-2 space-y-1">
                  {ct.provinsi.map((s) => (
                    <li key={s.label} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-xs">
                      <span className="truncate">{s.label}</span>
                      <span className="h-2 rounded-sm bg-grid"><span className="block h-2 rounded-sm bg-s3" style={{ width: `${(100 * s.value) / ct.provinsi[0].value}%` }} /></span>
                      <span className="tnum text-right text-ink-2">{n(s.value)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Kriteria pencocokan</div>
                <p className="mt-0.5 text-xs text-ink-2">{ct.kriteria}.</p>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Lahan kosong yang cocok</div>
                <div className="mt-0.5 text-2xl font-semibold tracking-tight">{n(ct.cocok)} <span className="text-sm font-normal text-ink-2">lahan di {n(ct.cocok_spbu)} SPBU</span></div>
                <ul className="mt-2 space-y-1">
                  {ct.kota_teratas.map((s) => (
                    <li key={s.label} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-xs">
                      <span className="truncate" title={s.label}>{s.label}</span>
                      <span className="h-2 rounded-sm bg-grid"><span className="block h-2 rounded-sm bg-s1" style={{ width: `${(100 * s.value) / maxKota}%` }} /></span>
                      <span className="tnum text-right text-ink-2">{n(s.value)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-3">Contoh lahan dengan tarif terdekat</div>
                <ul className="mt-1 divide-y divide-grid/60 text-xs">
                  {ct.contoh.map((x) => <li key={x.kode} className="flex justify-between gap-2 py-1"><span className="truncate"><span className="font-medium">{x.kode}</span> · {x.kota}</span><span className="tnum shrink-0 text-ink-2">{n(x.luas, 1)} m² · {rp(x.tarif)}</span></li>)}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Link href={`/data?tab=lahan&st=Tersedia&ps=${encodeURIComponent(ct.posisi)}&lumin=${ct.luas_p25 ?? ""}&lumax=${ct.luas_p75 ?? ""}`} className="rounded-md border border-grid px-2 py-1 hover:bg-plane">Buka di halaman Data</Link>
                  <span className="rounded-md bg-accent px-2 py-1 font-semibold text-white opacity-60" aria-disabled>Kirim penawaran (fitur Brightspace)</span>
                </div>
              </div>
            </div>
          </MockFrame>
        )}
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold">Logika rekomendasi, berlapis</h3>
      <div className="card overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3"><th className="py-2 pr-3 font-medium">Lapisan</th><th className="py-2 pr-3 font-medium">Pertanyaan yang dijawab</th><th className="py-2 pr-3 font-medium">Sumber</th><th className="py-2 pr-3 font-medium">Status data</th></tr></thead>
          <tbody>
            {m.logika.map((x) => (
              <tr key={x.lapisan} className="border-b border-grid/60 align-top last:border-0">
                <td className="whitespace-nowrap py-2 pr-3 font-medium">{x.lapisan}</td>
                <td className="py-2 pr-3 text-ink-2">{x.isi}</td>
                <td className="py-2 pr-3 text-xs text-ink-2">{x.sumber}</td>
                <td className="py-2 pr-3"><StatusDot s={x.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold">Data yang kita punya dan yang masih harus dicari</h3>
      <div className="card overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3"><th className="py-2 pr-3 font-medium">Aset data</th><th className="py-2 pr-3 text-right font-medium">Nilai</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 pr-3 font-medium">Kegunaan</th></tr></thead>
          <tbody>
            {m.aset.map((x) => (
              <tr key={x.item} className="border-b border-grid/60 align-top last:border-0">
                <td className="py-2 pr-3">{x.item}</td>
                <td className="tnum whitespace-nowrap py-2 pr-3 text-right">{x.nilai}</td>
                <td className="py-2 pr-3"><StatusDot s={x.status} /></td>
                <td className="py-2 pr-3 text-xs text-ink-2">{x.guna}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold">Tahapan pengembangan</h3>
      <ol className="grid gap-3 md:grid-cols-3">
        {m.tahapan.map((t, i) => (
          <li key={t.fase} className="card min-w-0 p-4">
            <div className="flex items-center gap-2 text-xs text-ink-3"><span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">{i + 1}</span>{t.fase}</div>
            <div className="mt-1 text-sm font-semibold">{t.judul}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-ink-2">{t.kegiatan.map((k) => <li key={k}>{k}</li>)}</ul>
          </li>
        ))}
      </ol>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <ListCard title="Ukuran keberhasilan" items={m.ukuran} tone="var(--status-good)" />
        <ListCard title="Risiko khusus fitur ini" items={m.risiko} tone="var(--status-critical)" />
      </div>
    </section>
  );
}
