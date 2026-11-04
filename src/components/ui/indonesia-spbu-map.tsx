"use client";

import * as React from "react";
import geo from "@/data/provinces-geo.json";
import { n, pct, rp } from "@/lib/format";
import type { MapPoint, ProvinceRow } from "@/lib/data";

/* ----------------------------------------------------------------------------
 * Indonesia SPBU Map
 * Pola interaksi mengikuti "address picker" berbasis peta: klik provinsi untuk
 * zoom, klik kota/SPBU untuk memilih, atau ketik nama kota / nomor SPBU dan
 * peta menyempit ke provinsi yang cocok.
 *
 * Geometri: 38 provinsi (ardian28/GeoJson-Indonesia-38-Provinsi, MIT),
 * disederhanakan dan pra-proyeksi ke path SVG oleh geo_provinces.py.
 * Titik SPBU diambil dari /map_points.json saat komponen dimuat.
 *
 * Warna: provinsi = satu rona berurutan (magnitudo, kelas kuantil);
 * titik = oranye bila SPBU masih punya lahan kosong, abu-abu bila penuh.
 * Pilihan disimpan di URL (?provinsi=&kota=&spbu=) agar bisa dibagikan.
 * -------------------------------------------------------------------------- */

type BBox = [number, number, number, number];
type ProvinceGeo = { name: string; code: string | null; label: [number, number]; bbox: BBox; d: string };
type Metric = "tersedia" | "pendapatan_idle";
type Selection = { prov?: string; kota?: string; spbu?: string };
type Hover = { x: number; y: number; w: number; title: string; rows: [string, string][] } | null;

export interface IndonesiaSpbuMapProps {
  provinces: ProvinceRow[];
  pointsUrl?: string;
  className?: string;
  onChange?: (sel: Selection) => void;
}

const GEO = geo as unknown as { view: [number, number]; bounds: { lng0: number; lng1: number; lat0: number; lat1: number }; provinces: ProvinceGeo[] };
const [W, H] = GEO.view;
const B = GEO.bounds;
const px = (lng: number) => ((lng - B.lng0) / (B.lng1 - B.lng0)) * W;
const py = (lat: number) => ((B.lat0 - lat) / (B.lat0 - B.lat1)) * H;
const FULL: BBox = [0, 0, W, H];
const SEQ = ["var(--seq-200)", "var(--seq-300)", "var(--seq-400)", "var(--seq-500)", "var(--seq-600)", "var(--seq-700)"];
const METRICS: Record<Metric, { label: string; fmt: (v: number) => string }> = {
  tersedia: { label: "Lahan kosong", fmt: (v) => n(v) },
  pendapatan_idle: { label: "Potensi sewa idle", fmt: (v) => rp(v, 0) },
};
const SPBU_URL = (id: string) => `https://brightspace.pertamina.com/detail/spbu?id=${id}`;

/** Kotak viewBox dengan padding, disesuaikan ke rasio peta agar tidak terdistorsi. */
function fit([x0, y0, x1, y1]: BBox, minW = 24): BBox {
  let w = Math.max(x1 - x0, minW) * 1.18, h = Math.max(y1 - y0, minW * (H / W)) * 1.18;
  if (w / h > W / H) h = w * (H / W); else w = h * (W / H);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [cx - w / 2, cy - h / 2, w, h];
}

/** Kotak titik; untuk ≥ 10 titik pakai persentil 5–95 agar koordinat salah input tidak membuat zoom terlalu lebar. */
function pointsBBox(pts: MapPoint[]): BBox {
  const xs = pts.map((p) => px(p.lng)).sort((a, b) => a - b), ys = pts.map((p) => py(p.lat)).sort((a, b) => a - b);
  const q = (arr: number[], f: number) => arr[Math.round(f * (arr.length - 1))];
  const [lo, hi] = pts.length >= 10 ? [0.05, 0.95] : [0, 1];
  return [q(xs, lo), q(ys, lo), q(xs, hi), q(ys, hi)];
}

/** Batas kelas kuantil (6 kelas) dari provinsi yang punya nilai > 0. */
function quantileBreaks(values: number[]) {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b);
  return [1, 2, 3, 4, 5].map((i) => v[Math.floor((i / 6) * (v.length - 1))]);
}

export function IndonesiaSpbuMap({ provinces, pointsUrl = "/map_points.json", className = "", onChange }: IndonesiaSpbuMapProps) {
  const [metric, setMetric] = React.useState<Metric>("tersedia");
  const [sel, setSel] = React.useState<Selection>({});
  const [vb, setVb] = React.useState<[number, number, number, number]>([0, 0, W, H]);
  const [points, setPoints] = React.useState<MapPoint[] | null>(null);
  const [loadError, setLoadError] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [hover, setHover] = React.useState<Hover>(null);
  const deferredQuery = React.useDeferredValue(query.trim().toLowerCase());
  const svgRef = React.useRef<SVGSVGElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const vbRef = React.useRef(vb);
  const animRef = React.useRef(0);
  const timerRef = React.useRef(0);

  const stats = React.useMemo(() => new Map(provinces.map((p) => [p.provinsi, p])), [provinces]);
  const breaks = React.useMemo(() => quantileBreaks(provinces.map((p) => Number(p[metric]) || 0)), [provinces, metric]);
  const colorOf = (v: number) => (v > 0 ? SEQ[breaks.filter((b) => v > b).length] : "var(--seq-100)");

  /* -- data titik ---------------------------------------------------------- */
  React.useEffect(() => {
    let alive = true;
    fetch(pointsUrl).then((r) => (r.ok ? r.json() : Promise.reject())).then((p: MapPoint[]) => {
      if (!alive) return;
      setPoints(p.filter((q) => q.lng >= B.lng0 && q.lng <= B.lng1 && q.lat <= B.lat0 && q.lat >= B.lat1));
      // Pilihan awal dari URL, setelah titik tersedia agar kota/SPBU langsung terlihat.
      const q = new URLSearchParams(location.search);
      const prov = q.get("provinsi") ?? undefined;
      if (prov && GEO.provinces.some((g) => g.name === prov)) setSel({ prov, kota: q.get("kota") ?? undefined, spbu: q.get("spbu") ?? undefined });
    }).catch(() => alive && setLoadError(true));
    return () => { alive = false; };
  }, [pointsUrl]);

  const byProv = React.useMemo(() => {
    const m = new Map<string, MapPoint[]>();
    for (const p of points ?? []) (m.get(p.prov) ?? m.set(p.prov, []).get(p.prov)!).push(p);
    return m;
  }, [points]);

  /* -- zoom (viewBox dianimasikan langsung di DOM, state di-commit di akhir) -- */
  const zoomTo = React.useCallback((target: BBox) => {
    cancelAnimationFrame(animRef.current);
    const from = vbRef.current;
    const done = (v: [number, number, number, number]) => { vbRef.current = v; setVb(v); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done(target);
    const t0 = performance.now(), dur = 450;
    clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { cancelAnimationFrame(animRef.current); svgRef.current?.setAttribute("viewBox", target.join(" ")); done(target); }, dur + 150);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      const v = from.map((f, i) => f + (target[i] - f) * e) as [number, number, number, number];
      vbRef.current = v;
      svgRef.current?.setAttribute("viewBox", v.join(" "));
      if (k < 1) animRef.current = requestAnimationFrame(step); else { clearTimeout(timerRef.current); done(target); }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  const select = React.useCallback((next: Selection) => {
    setSel(next);
    setHover(null);
    onChange?.(next);
    const q = new URLSearchParams();
    if (next.prov) q.set("provinsi", next.prov);
    if (next.kota) q.set("kota", next.kota);
    if (next.spbu) q.set("spbu", next.spbu);
    history.replaceState(null, "", q.size ? `?${q}` : location.pathname);
  }, [onChange]);

  // Zoom mengikuti pilihan: SPBU/kota -> kotak titik kota, provinsi -> kotak provinsi.
  React.useEffect(() => {
    const g = sel.prov ? GEO.provinces.find((p) => p.name === sel.prov) : undefined;
    const kotaPts = sel.kota ? (byProv.get(sel.prov ?? "") ?? []).filter((p) => p.kota === sel.kota) : [];
    if (kotaPts.length) zoomTo(fit(pointsBBox(kotaPts)));
    else if (g) zoomTo(fit(g.bbox));
    else zoomTo(FULL);
  }, [sel.prov, sel.kota, byProv, zoomTo]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      select(sel.spbu ? { prov: sel.prov, kota: sel.kota } : sel.kota ? { prov: sel.prov } : {});
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, select]);

  /* -- pencarian: menyempitkan peta ke provinsi yang cocok ------------------- */
  const results = React.useMemo(() => {
    if (deferredQuery.length < 2) return null;
    const prov = GEO.provinces.filter((p) => p.name.toLowerCase().includes(deferredQuery)).map((p) => p.name);
    const kota = new Map<string, string>();
    const spbu: MapPoint[] = [];
    for (const p of points ?? []) {
      if (p.kota.toLowerCase().includes(deferredQuery)) kota.set(p.kota, p.prov);
      if (/^\d{3,}/.test(deferredQuery) && p.no.startsWith(deferredQuery) && spbu.length < 6) spbu.push(p);
    }
    const provSet = new Set([...prov, ...kota.values(), ...spbu.map((p) => p.prov)]);
    return { prov, kota: [...kota].slice(0, 8), spbu, provSet };
  }, [deferredQuery, points]);

  const pickFirst = () => {
    if (!results) return;
    if (results.spbu[0]) select({ prov: results.spbu[0].prov, kota: results.spbu[0].kota, spbu: results.spbu[0].id });
    else if (results.kota[0]) select({ prov: results.kota[0][1], kota: results.kota[0][0] });
    else if (results.prov[0]) select({ prov: results.prov[0] });
    setQuery("");
  };

  /* -- turunan untuk panel ---------------------------------------------------- */
  const provPts = React.useMemo(() => (sel.prov ? byProv.get(sel.prov) ?? [] : []), [byProv, sel.prov]);
  const kotaRows = React.useMemo(() => {
    const m = new Map<string, { kota: string; spbu: number; lahan: number; kosong: number }>();
    for (const p of provPts) {
      const r = m.get(p.kota) ?? m.set(p.kota, { kota: p.kota, spbu: 0, lahan: 0, kosong: 0 }).get(p.kota)!;
      r.spbu += 1; r.lahan += p.lahan; r.kosong += p.kosong;
    }
    return [...m.values()].sort((a, b) => b.kosong - a.kosong || b.lahan - a.lahan);
  }, [provPts]);
  const kotaPts = sel.kota ? provPts.filter((p) => p.kota === sel.kota) : [];
  const spbuSel = sel.spbu ? kotaPts.find((p) => p.id === sel.spbu) ?? provPts.find((p) => p.id === sel.spbu) : undefined;
  const ranked = [...provinces].filter((p) => p.provinsi !== "Tidak diketahui").sort((a, b) => Number(b[metric]) - Number(a[metric]));

  /* -- render ---------------------------------------------------------------- */
  const unit = vb[2] / W; // 1 px layar ≈ unit viewBox (asumsi peta selebar ~1000 px)
  const showHover = (e: React.PointerEvent, title: string, rows: [string, string][]) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setHover({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, title, rows });
  };

  const circles = React.useMemo(() => {
    if (!sel.prov) return null;
    const sorted = [...provPts].sort((a, b) => (a.kosong > 0 ? 1 : 0) - (b.kosong > 0 ? 1 : 0));
    return sorted.map((p) => {
      const dim = (sel.kota && p.kota !== sel.kota) || (results && !p.kota.toLowerCase().includes(deferredQuery) && !p.no.startsWith(deferredQuery));
      const active = p.id === sel.spbu;
      const r = Math.max(2.4, Math.min(6.5, 1.6 + Math.sqrt(p.lahan) * 1.1)) * unit;
      return (
        <circle key={p.id} cx={px(p.lng)} cy={py(p.lat)} r={active ? r * 1.6 : r}
          fill={p.kosong > 0 ? "var(--series-2)" : "var(--muted-mark)"} stroke={active ? "var(--ink-1)" : "var(--surface-1)"}
          strokeWidth={active ? 2 : 1} vectorEffect="non-scaling-stroke" opacity={dim ? 0.2 : 0.9} className="cursor-pointer"
          onPointerMove={(e) => showHover(e, `SPBU ${p.no}`, [["Kota", p.kota], ["Lahan", n(p.lahan)], ["Kosong", n(p.kosong)]])}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => { e.stopPropagation(); select({ prov: p.prov, kota: p.kota, spbu: p.id }); }} />
      );
    });
  }, [provPts, sel.prov, sel.kota, sel.spbu, unit, results, deferredQuery, select]);

  return (
    <div className={`grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] ${className}`}>
      {/* ---------------- peta ---------------- */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex gap-1" role="group" aria-label="Warna provinsi berdasarkan">
            {(Object.keys(METRICS) as Metric[]).map((k) => (
              <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)}
                className={`rounded-md border px-2.5 py-1 ${metric === k ? "border-accent bg-plane font-semibold" : "border-grid text-ink-2 hover:bg-plane"}`}>
                {METRICS[k].label}
              </button>
            ))}
          </div>
          {sel.prov && (
            <button type="button" onClick={() => select({})} className="ml-auto rounded-md border border-grid px-2.5 py-1 text-ink-2 hover:bg-plane">
              ← Seluruh Indonesia <span className="text-ink-3">(Esc)</span>
            </button>
          )}
        </div>

        <div ref={wrapRef} className="relative overflow-hidden rounded-md bg-plane">
          <svg ref={svgRef} viewBox={vb.join(" ")} className="block h-auto w-full touch-manipulation" role="group"
            aria-label="Peta provinsi Indonesia; pilih provinsi untuk melihat SPBU" onClick={() => sel.prov && select({ prov: sel.prov })}>
            {GEO.provinces.map((g) => {
              const s = stats.get(g.name);
              const v = s ? Number(s[metric]) || 0 : 0;
              const isSel = g.name === sel.prov;
              const faded = (sel.prov && !isSel) || (results && !results.provSet.has(g.name));
              const fill = !s ? "var(--grid)" : sel.prov ? (isSel ? "var(--surface-1)" : colorOf(v)) : colorOf(v);
              const label = s ? `${g.name}: ${METRICS[metric].fmt(v)} ${metric === "tersedia" ? "lahan kosong" : "per tahun"}, okupansi ${pct(s.okupansi_pct)}` : `${g.name}: belum ada SPBU di marketplace`;
              return (
                <path key={g.name} d={g.d} fill={fill} fillRule="evenodd" opacity={faded ? 0.28 : 1}
                  stroke={isSel ? "var(--ink-2)" : "var(--surface-1)"} strokeWidth={isSel ? 1.5 : 0.6} vectorEffect="non-scaling-stroke"
                  className="idm-prov" tabIndex={0} role="button" aria-label={label} aria-pressed={isSel}
                  onPointerMove={(e) => !isSel && showHover(e, g.name, s ? [[METRICS.tersedia.label, n(s.tersedia)], [METRICS.pendapatan_idle.label, rp(s.pendapatan_idle)], ["Okupansi", pct(s.okupansi_pct)], ["SPBU", n(s.spbu)]] : [["Data", "belum ada SPBU"]])}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => { e.stopPropagation(); if (!isSel) select({ prov: g.name }); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select({ prov: g.name }); } }} />
              );
            })}
            {circles}
          </svg>

          {hover && (
            <div className="pointer-events-none absolute z-10 card px-3 py-2 text-xs shadow-sm"
              style={{ left: Math.min(hover.x + 12, hover.w - 200), top: hover.y + 12, width: 188 }}>
              <div className="mb-1 font-semibold">{hover.title}</div>
              {hover.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><span className="text-ink-2">{k}</span><span className="tnum text-right">{v}</span></div>
              ))}
            </div>
          )}
          {sel.prov && !points && (
            <div className="absolute inset-x-0 bottom-3 text-center text-xs text-ink-3" aria-live="polite">
              {loadError ? "Titik SPBU gagal dimuat; jalankan ulang analytics.py bila public/map_points.json belum ada." : "Memuat titik SPBU…"}
            </div>
          )}
        </div>

        {/* legenda */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
          {sel.prov ? (
            <>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--series-2)" }} aria-hidden />SPBU dengan lahan kosong</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--muted-mark)" }} aria-hidden />SPBU terisi penuh</span>
              <span>Ukuran titik = jumlah lahan</span>
            </>
          ) : (
            <>
              <span>{METRICS[metric].label}:</span>
              <span className="inline-flex items-center gap-0.5" aria-hidden>{SEQ.map((c) => <span key={c} className="h-3 w-6 first:rounded-l-sm last:rounded-r-sm" style={{ background: c }} />)}</span>
              <span className="tnum">≤ {METRICS[metric].fmt(breaks[0])} … &gt; {METRICS[metric].fmt(breaks[4])}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: "var(--grid)" }} aria-hidden />belum ada data</span>
              <span className="text-ink-3">Klik provinsi untuk zoom</span>
            </>
          )}
        </div>
      </div>

      {/* ---------------- panel ---------------- */}
      <aside className="flex min-w-0 flex-col gap-3" aria-live="polite">
        <div className="relative">
          <label htmlFor="idm-search" className="sr-only">Cari provinsi, kota, atau nomor SPBU</label>
          <input id="idm-search" type="search" name="cari-lokasi" autoComplete="off" spellCheck={false} value={query}
            onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pickFirst()}
            placeholder="Cari kota atau no. SPBU, mis. Surabaya…"
            className="w-full rounded-md border border-grid bg-surface px-3 py-2 text-sm placeholder:text-ink-3" />
          {results && (
            <div className="card absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-auto p-1 text-sm shadow-md">
              {results.prov.map((p) => <ResultBtn key={p} onClick={() => { select({ prov: p }); setQuery(""); }} main={p} sub="Provinsi" />)}
              {results.kota.map(([k, p]) => <ResultBtn key={k} onClick={() => { select({ prov: p, kota: k }); setQuery(""); }} main={k} sub={p} />)}
              {results.spbu.map((s) => <ResultBtn key={s.id} onClick={() => { select({ prov: s.prov, kota: s.kota, spbu: s.id }); setQuery(""); }} main={`SPBU ${s.no}`} sub={s.kota} />)}
              {!results.prov.length && !results.kota.length && !results.spbu.length && <div className="px-2 py-1.5 text-ink-3">Tidak ada yang cocok. Coba nama kota tanpa “Kab.”/“Kodya”.</div>}
            </div>
          )}
        </div>

        <nav aria-label="Lokasi terpilih" className="flex flex-wrap items-center gap-1 text-xs text-ink-3">
          <Crumb onClick={() => select({})} active={!sel.prov}>Indonesia</Crumb>
          {sel.prov && <>›<Crumb onClick={() => select({ prov: sel.prov })} active={!sel.kota}>{sel.prov}</Crumb></>}
          {sel.kota && <>›<Crumb onClick={() => select({ prov: sel.prov, kota: sel.kota })} active={!sel.spbu}>{sel.kota}</Crumb></>}
        </nav>

        {spbuSel ? (
          <div className="card p-4">
            <div className="text-xs text-ink-3">{spbuSel.kota}</div>
            <h3 className="text-lg font-semibold">SPBU {spbuSel.no}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <Stat k="Lahan NFR" v={n(spbuSel.lahan)} />
              <Stat k="Lahan kosong" v={n(spbuSel.kosong)} tone={spbuSel.kosong > 0 ? "warn" : undefined} />
            </dl>
            <a href={SPBU_URL(spbuSel.id)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-accent underline">Buka di Brightspace ↗</a>
          </div>
        ) : sel.kota ? (
          <Panel title={sel.kota} sub={sel.prov}>
            <dl className="grid grid-cols-2 gap-1.5 text-sm">
              <Stat k="SPBU" v={n(kotaPts.length)} />
              <Stat k="Lahan" v={n(kotaPts.reduce((a, p) => a + p.lahan, 0))} />
              <Stat k="Lahan kosong" v={n(kotaPts.reduce((a, p) => a + p.kosong, 0))} tone="warn" />
              <Stat k="SPBU ada kosong" v={n(kotaPts.filter((p) => p.kosong > 0).length)} />
            </dl>
            <List title="SPBU dengan lahan kosong terbanyak">
              {[...kotaPts].sort((a, b) => b.kosong - a.kosong || b.lahan - a.lahan).slice(0, 40).map((p) => (
                <Row key={p.id} onClick={() => select({ prov: sel.prov, kota: sel.kota, spbu: p.id })} label={`SPBU ${p.no}`} value={`${n(p.kosong)} / ${n(p.lahan)}`} />
              ))}
            </List>
          </Panel>
        ) : sel.prov ? (
          <Panel title={sel.prov}>
            {stats.get(sel.prov) ? (() => {
              const s = stats.get(sel.prov)!;
              return (
                <>
                  <dl className="grid grid-cols-3 gap-1.5 text-sm">
                    <Stat k="SPBU" v={n(s.spbu)} />
                    <Stat k="Lahan" v={n(s.lahan)} />
                    <Stat k="Kosong" v={n(s.tersedia)} tone="warn" />
                    <Stat k="Okupansi" v={pct(s.okupansi_pct)} />
                    <Stat k="Idle/th" v={rp(s.pendapatan_idle)} />
                    <Stat k="Tarif med." v={rp(s.harga_median)} />
                  </dl>
                  <List title="Kota menurut lahan kosong" note="kosong / total lahan">
                    {points ? kotaRows.map((k) => (
                      <Row key={k.kota} onClick={() => select({ prov: sel.prov, kota: k.kota })} label={k.kota} value={`${n(k.kosong)} / ${n(k.lahan)}`} share={k.lahan ? k.kosong / k.lahan : 0} />
                    )) : <li className="py-1.5 text-ink-3">Memuat…</li>}
                  </List>
                </>
              );
            })() : <p className="text-sm text-ink-2">Belum ada SPBU dari provinsi ini di marketplace Brightspace.</p>}
          </Panel>
        ) : (
          <Panel title="Seluruh Indonesia" sub={`Provinsi menurut ${METRICS[metric].label.toLowerCase()}`}>
            <List title="">
              {ranked.map((p) => (
                <Row key={p.provinsi} onClick={() => select({ prov: p.provinsi })} label={p.provinsi} value={METRICS[metric].fmt(Number(p[metric]))}
                  share={Number(p[metric]) / Number(ranked[0][metric])} />
              ))}
            </List>
          </Panel>
        )}
      </aside>
    </div>
  );
}

/* -- bagian kecil ------------------------------------------------------------ */
function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      {sub && <div className="text-xs text-ink-3">{sub}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "warn" }) {
  return (
    <div className="min-w-0 rounded-md bg-plane px-2 py-1.5">
      <dt className="truncate text-xs text-ink-3">{k}</dt>
      <dd className={`tnum truncate font-semibold ${tone === "warn" ? "text-critical" : ""}`}>{v}</dd>
    </div>
  );
}

function List({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <div className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-3"><span>{title}</span>{note && <span className="font-normal normal-case tracking-normal">{note}</span>}</div>}
      <ul className="max-h-60 divide-y divide-grid overflow-y-auto overscroll-contain pr-1 text-sm">{children}</ul>
    </div>
  );
}

function Row({ label, value, share, onClick }: { label: string; value: string; share?: number; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="group flex w-full items-center gap-2 py-1.5 text-left hover:text-accent">
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {share !== undefined && (
          <span className="h-1.5 w-12 shrink-0 rounded-full bg-[var(--seq-100)]" aria-hidden>
            <span className="block h-1.5 rounded-full bg-[var(--seq-500)]" style={{ width: `${Math.max(4, Math.min(100, share * 100))}%` }} />
          </span>
        )}
        <span className="tnum shrink-0 text-xs text-ink-2">{value}</span>
      </button>
    </li>
  );
}

function Crumb({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? "location" : undefined}
      className={`rounded px-1 py-0.5 hover:bg-plane ${active ? "font-semibold text-ink" : "hover:text-ink"}`}>{children}</button>
  );
}

function ResultBtn({ main, sub, onClick }: { main: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-baseline justify-between gap-3 rounded px-2 py-1.5 text-left hover:bg-plane">
      <span className="truncate">{main}</span><span className="shrink-0 text-xs text-ink-3">{sub}</span>
    </button>
  );
}
