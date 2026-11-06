"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  asofDate, EPOCH, downloadCsv, loadLahanAll, loadLahanProv, loadMeta, loadSpbu, sisaHari, statusKontrak, tgl,
  STATUS_KONTRAK, type Lahan, type Meta, type Spbu,
} from "@/lib/eksplorasi";
import { n, rp, rpFull } from "@/lib/format";
import { Insight, Pill } from "@/components/ui";

/* ------------------------------------------------------------------ util */
type F = Record<string, string>;
type Tab = "spbu" | "lahan";
const PAGE_SIZES = [25, 50, 100, 250];

const SEG_SHORT: Record<string, string> = {
  "LPG & Bright Gas": "LPG", "Pelumas & Oli": "Pelumas", "Perbankan & ATM": "Bank/ATM", "Energi Baru (EV/PLTS)": "EV/PLTS",
  "Logistik & Ekspedisi": "Logistik", "Nitrogen & Perawatan": "Nitrogen", "Pameran & Promosi": "Promosi", "Minimarket & Ritel": "Ritel",
  "F&B / Kuliner": "F&B", "Kesehatan & Jasa": "Kesehatan", "Kosong (Tersedia)": "Kosong", "Tidak terklasifikasi": "Tak terklasifikasi", Lainnya: "Lainnya",
};
const STATUS_COLOR: Record<string, string> = { Tersedia: "var(--status-warning)", Tersewa: "var(--status-good)" };
const KONTRAK_COLOR: Record<string, string> = {
  kedaluwarsa: "var(--status-critical)", "≤ 6 bulan": "var(--status-serious)", "6–12 bulan": "var(--status-warning)", "> 12 bulan": "var(--status-good)",
  "tanpa tanggal": "var(--muted-mark)", "tanpa kontrak": "var(--muted-mark)",
};

const num = (s: string | undefined) => (s === undefined || s === "" || Number.isNaN(+s) ? null : +s);
const has = (v: string | undefined) => v !== undefined && v !== "";
const fromUrl = (): F => Object.fromEntries(new URLSearchParams(location.search));

function cmp(a: unknown, b: unknown, dir: 1 | -1) {
  if (a === null || a === undefined || a === "") return b === null || b === undefined || b === "" ? 0 : 1;   // null selalu di bawah
  if (b === null || b === undefined || b === "") return -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * dir;
  return String(a).localeCompare(String(b), "id") * dir;
}

/* ------------------------------------------------------------------ kontrol filter */
function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs ${className}`}>
      <span className="font-medium text-ink-3">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "h-8 w-full rounded-md border border-grid bg-surface px-2 text-sm text-ink focus:border-accent";

function Select({ value, onChange, options, all = "Semua" }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; all?: string }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{all}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Range({ lo, hi, onLo, onHi, unit }: { lo: string; hi: string; onLo: (v: string) => void; onHi: (v: string) => void; unit?: string }) {
  return (
    <div className="flex items-center gap-1">
      <input type="number" inputMode="decimal" className={inputCls} placeholder="min" value={lo} onChange={(e) => onLo(e.target.value)} aria-label="minimum" />
      <span className="text-ink-3">–</span>
      <input type="number" inputMode="decimal" className={inputCls} placeholder="maks" value={hi} onChange={(e) => onHi(e.target.value)} aria-label="maksimum" />
      {unit && <span className="shrink-0 text-ink-3">{unit}</span>}
    </div>
  );
}

function Chips({ options, selected, onToggle }: { options: { value: string; label: string }[]; selected: Set<string>; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.has(o.value);
        return (
          <button key={o.value} type="button" onClick={() => onToggle(o.value)} aria-pressed={on}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${on ? "border-accent bg-accent text-white" : "border-grid text-ink-2 hover:bg-plane"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ tabel generik */
type Col<T> = { key: string; label: string; sort?: (r: T) => unknown; render: (r: T) => ReactNode; align?: "right"; width?: string };

function SortTable<T>({ rows, cols, sort, onSort, rowKey }: { rows: T[]; cols: Col<T>[]; sort: { key: string; dir: 1 | -1 }; onSort: (k: string) => void; rowKey: (r: T) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3">
            {cols.map((c) => (
              <th key={c.key} className={`py-2 pr-3 font-medium ${c.align === "right" ? "text-right" : ""}`} style={c.width ? { minWidth: c.width } : undefined}
                aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
                {c.sort ? (
                  <button type="button" onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 whitespace-nowrap uppercase hover:text-ink">
                    {c.label}<span aria-hidden className="text-[10px]">{sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "⇅"}</span>
                  </button>
                ) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-grid/60 align-top last:border-0 hover:bg-plane">
              {cols.map((c) => <td key={c.key} className={`py-1.5 pr-3 ${c.align === "right" ? "tnum whitespace-nowrap text-right" : ""}`}>{c.render(r)}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={cols.length} className="py-8 text-center text-ink-3">Tidak ada baris yang cocok dengan filter.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Pager({ page, pages, size, total, onPage, onSize }: { page: number; pages: number; size: number; total: number; onPage: (p: number) => void; onSize: (s: number) => void }) {
  const btn = "rounded-md border border-grid px-2 py-1 text-xs disabled:opacity-40 hover:bg-plane";
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
      <div>Baris {n(Math.min(total, page * size + 1))}–{n(Math.min(total, (page + 1) * size))} dari {n(total)}</div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1">per halaman
          <select className="h-7 rounded-md border border-grid bg-surface px-1" value={size} onChange={(e) => onSize(+e.target.value)}>{PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </label>
        <button type="button" className={btn} disabled={page === 0} onClick={() => onPage(0)}>«</button>
        <button type="button" className={btn} disabled={page === 0} onClick={() => onPage(page - 1)}>‹</button>
        <span className="tnum">hal. {page + 1}/{Math.max(1, pages)}</span>
        <button type="button" className={btn} disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>›</button>
        <button type="button" className={btn} disabled={page >= pages - 1} onClick={() => onPage(pages - 1)}>»</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ komponen utama */
export function DataExplorer() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [spbu, setSpbu] = useState<Spbu[] | null>(null);
  const [lahan, setLahan] = useState<{ scope: string; rows: Lahan[] } | null>(null);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<F>({});
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const tab: Tab = f.tab === "lahan" ? "lahan" : "spbu";
  const sort = useMemo(() => ({ key: f.sort || (tab === "spbu" ? "no" : "k"), dir: (f.dir === "desc" ? -1 : 1) as 1 | -1 }), [f.sort, f.dir, tab]);
  const q = useDeferredValue((f.q ?? "").trim().toLowerCase());
  const asof = useMemo(() => (meta ? asofDate(meta) : EPOCH), [meta]);
  const lahanCols = useMemo(() => makeLahanCols(asof), [asof]);

  // Muat meta + SPBU, lalu ambil filter awal dari URL (agar tautan bisa dibagikan).
  useEffect(() => {
    let alive = true;
    Promise.all([loadMeta(), loadSpbu()]).then(([m, s]) => {
      if (!alive) return;
      setMeta(m); setSpbu(s); setF(fromUrl()); setReady(true);
    }).catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, []);

  // Tulis filter ke URL.
  useEffect(() => {
    if (!ready) return;
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== ""));
    history.replaceState(null, "", qs.size ? `?${qs}` : location.pathname);
  }, [f, ready]);

  // Lahan: muat per provinsi bila ada filter provinsi, selain itu semua provinsi (sekali, lalu dipakai untuk semua filter).
  const provSel = f.prov ?? "";
  const scope = useMemo(() => (meta?.provinsi.find((x) => x.nama === provSel)?.slug ?? "*"), [meta, provSel]);
  const lahanReady = !!lahan && (lahan.scope === scope || lahan.scope === "*");
  useEffect(() => {
    if (tab !== "lahan" || !meta || lahanReady) return;
    let alive = true;
    const job = scope === "*" ? loadLahanAll(meta, (d, t) => alive && setProgress([d, t])) : loadLahanProv(scope);
    job.then((rows) => { if (alive) { setLahan({ scope, rows }); setProgress(null); } }).catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, [tab, meta, scope, lahanReady]);

  const set = (k: string, v: string) => { setF((o) => ({ ...o, [k]: v })); setPage(0); };
  const setMany = (o: F) => { setF((p) => ({ ...p, ...o })); setPage(0); };
  const reset = () => { setF({ tab }); setPage(0); };
  const onSort = (k: string) => setMany({ sort: k, dir: sort.key === k && sort.dir === 1 ? "desc" : "asc" });
  const toggleIn = (k: string, v: string) => {
    const cur = new Set((f[k] ?? "").split("|").filter(Boolean));
    if (cur.has(v)) cur.delete(v); else cur.add(v);
    set(k, [...cur].join("|"));
  };

  const provOpts = useMemo(() => (meta?.provinsi ?? []).filter((p) => p.spbu > 0).map((p) => ({ value: p.nama, label: `${p.nama} (${n(p.spbu)})` })), [meta]);
  const kotaOpts = useMemo(() => {
    const ps = meta?.provinsi.filter((p) => !provSel || p.nama === provSel) ?? [];
    return ps.flatMap((p) => p.kota).sort((a, b) => a.localeCompare(b, "id")).map((k) => ({ value: k, label: k }));
  }, [meta, provSel]);
  const segOpts = useMemo(() => (meta?.segmen ?? []).map((s) => ({ value: s.nama, label: `${s.nama} (${n(s.lahan)})` })), [meta]);
  const fasSel = useMemo(() => new Set((f.fas ?? "").split("|").filter(Boolean)), [f.fas]);

  /* ---------------------------------------------------------- filter SPBU */
  const spbuRows = useMemo(() => {
    if (!spbu || tab !== "spbu") return [];
    const lmin = num(f.lmin), lmax = num(f.lmax), rmin = num(f.rmin), hmax = num(f.hmax);
    const qd = q.replace(/\D/g, "");   // nomor SPBU di sumber kadang ditulis "14,245,445"
    const out = spbu.filter((s) => {
      if (provSel && s.prov !== provSel) return false;
      if (has(f.kota) && s.kota !== f.kota) return false;
      if (f.kosong === "ada" && s.kosong === 0) return false;
      if (f.kosong === "tidak" && s.kosong > 0) return false;
      if (f.kosong === "penuh" && (s.lahan === 0 || s.kosong > 0)) return false;
      if (f.kosong === "nol" && s.lahan > 0) return false;
      if (lmin !== null && s.lahan < lmin) return false;
      if (lmax !== null && s.lahan > lmax) return false;
      if (rmin !== null && s.rent < rmin * 1e6) return false;
      if (hmax !== null && s.hmax < hmax * 1e6) return false;
      if (has(f.seg) && !s.seg.includes(f.seg)) return false;
      if (f.area === "ada" && s.area.length === 0) return false;
      if (f.area === "tidak" && s.area.length > 0) return false;
      if (has(f.areak) && !s.area.some((a) => a.k === f.areak)) return false;
      if (f.koord === "ada" && s.lat === null) return false;
      if (f.koord === "tidak" && s.lat !== null) return false;
      if (f.koord === "fix" && !s.fix) return false;
      if (f.fasdata === "ada" && s.fas.length === 0) return false;
      if (f.fasdata === "tidak" && s.fas.length > 0) return false;
      for (const x of fasSel) if (!s.fas.includes(x)) return false;
      if (f.l360 === "ada" && !s.l360) return false;
      if (f.kontrak === "ada" && s.kontrak === 0) return false;
      if (f.kontrak === "tidak" && s.kontrak > 0) return false;
      if (q && !(s.no.includes(q) || (qd !== "" && s.no.replace(/\D/g, "").includes(qd)) || s.nama.toLowerCase().includes(q) || s.alamat.toLowerCase().includes(q) || s.kota.toLowerCase().includes(q) || s.tenant.some((t) => t.toLowerCase().includes(q)))) return false;
      return true;
    });
    const col = spbuCols.find((c) => c.key === sort.key);
    if (col?.sort) out.sort((a, b) => cmp(col.sort!(a), col.sort!(b), sort.dir));
    return out;
  }, [spbu, tab, f, provSel, fasSel, q, sort]);

  /* ---------------------------------------------------------- filter lahan */
  const lahanRows = useMemo(() => {
    if (!lahan || !lahanReady || tab !== "lahan") return [];
    const lumin = num(f.lumin), lumax = num(f.lumax), hmin = num(f.hmin), hmax = num(f.hmax), dmin = num(f.dmin), dmax = num(f.dmax);
    const tenant = (f.tenant ?? "").trim().toLowerCase();
    const out = lahan.rows.filter((l) => {
      if (provSel && l.prov !== provSel) return false;
      if (has(f.kota) && l.kota !== f.kota) return false;
      if (has(f.st) && l.st !== f.st) return false;
      if (has(f.seg) && l.seg !== f.seg) return false;
      if (has(f.ps) && l.ps !== f.ps) return false;
      if (has(f.lt) && l.lt !== f.lt) return false;
      if (has(f.p) && l.p !== f.p) return false;
      if (lumin !== null && (l.lu === null || l.lu < lumin)) return false;
      if (lumax !== null && (l.lu === null || l.lu > lumax)) return false;
      if (f.harga === "ada" && l.ht === null) return false;
      if (f.harga === "tidak" && l.ht !== null) return false;
      if (f.harga === "outlier" && !(l.h && l.ht === null)) return false;
      if (hmin !== null && (l.ht === null || l.ht < hmin * 1e6)) return false;
      if (hmax !== null && (l.ht === null || l.ht > hmax * 1e6)) return false;
      if (dmin !== null && (l.d === null || l.d < dmin)) return false;
      if (dmax !== null && (l.d === null || l.d > dmax)) return false;
      if (f.daya === "ada" && !l.d) return false;
      if (f.daya === "tidak" && l.d) return false;
      if (has(f.kontrak) && statusKontrak(l, asof) !== f.kontrak) return false;
      if (f.pending === "ada" && !l.m?.pd) return false;
      if (tenant && !(l.m?.t ?? "").toLowerCase().includes(tenant)) return false;
      if (q && !(l.k.toLowerCase().includes(q) || l.o.toLowerCase().includes(q) || (l.ds ?? "").toLowerCase().includes(q) || (l.m?.t ?? "").toLowerCase().includes(q) || l.kota.toLowerCase().includes(q))) return false;
      return true;
    });
    const col = lahanCols.find((c) => c.key === sort.key);
    if (col?.sort) out.sort((a, b) => cmp(col.sort!(a), col.sort!(b), sort.dir));
    return out;
  }, [lahan, lahanReady, tab, f, provSel, q, sort, asof, lahanCols]);

  const rows = tab === "spbu" ? spbuRows : lahanRows;
  const pages = Math.ceil(rows.length / size);
  const pageRows = rows.slice(page * size, (page + 1) * size);

  /* ---------------------------------------------------------- ringkasan hasil */
  const summary = useMemo(() => {
    if (tab === "spbu") {
      const r = spbuRows;
      return [
        ["SPBU", n(r.length)], ["Lahan", n(r.reduce((a, s) => a + s.lahan, 0))], ["Lahan kosong", n(r.reduce((a, s) => a + s.kosong, 0))],
        ["Sewa diketahui/th", rp(r.reduce((a, s) => a + s.rent, 0))], ["Kota", n(new Set(r.map((s) => s.kota)).size)],
      ];
    }
    const r = lahanRows;
    const ht = r.filter((l) => l.ht !== null).map((l) => l.ht as number).sort((a, b) => a - b);
    return [
      ["Lahan", n(r.length)], ["Kosong", n(r.filter((l) => l.st === "Tersedia").length)], ["SPBU", n(new Set(r.map((l) => l.s)).size)],
      ["Tarif median/th", ht.length ? rp(ht[Math.floor(ht.length / 2)]) : "–"], ["Jumlah tarif diketahui/th", rp(ht.reduce((a, b) => a + b, 0))],
      ["Luas total", `${n(r.reduce((a, l) => a + (l.lu ?? 0), 0))} m²`],
    ];
  }, [tab, spbuRows, lahanRows]);

  const exportCsv = () => {
    if (tab === "spbu") {
      downloadCsv("spbu_tersaring.csv",
        ["nomor_spbu", "nama", "alamat", "kota", "provinsi", "latitude", "longitude", "koordinat_diperbaiki", "fasilitas", "jumlah_foto", "link_360", "jumlah_lahan", "lahan_kosong", "lahan_tersewa", "harga_min_listing", "harga_max_listing", "segmen_tenant", "sewa_diketahui_per_tahun", "area_sekitar", "kontrak_master", "tenant_master", "url"],
        spbuRows.map((s) => [s.no, s.nama, s.alamat, s.kota, s.prov, s.lat, s.lng, s.fix, s.fas.join("; "), s.foto, s.l360, s.lahan, s.kosong, s.tersewa, s.hmin, s.hmax, s.seg.join("; "), s.rent, s.area.map((a) => `${a.n} (${a.k}, ${a.km ?? "?"} km)`).join("; "), s.kontrak, s.tenant.join("; "), `https://brightspace.pertamina.com/detail/spbu?id=${s.id}`]));
    } else {
      downloadCsv("lahan_tersaring.csv",
        ["kode_lahan", "nomor_spbu", "kota", "provinsi", "status", "segmen", "outlet", "deskripsi", "luas_m2", "panjang_m", "lebar_m", "tinggi_m", "daya_listrik_w", "harga_sewa", "periode", "harga_tahunan_valid", "harga_per_m2", "posisi_lahan", "lantai", "tenant_master", "mulai_sewa", "akhir_sewa", "nilai_kontrak", "tahunan_kontrak", "status_master", "sisa_hari", "status_kontrak", "riwayat_baris", "pengajuan_menunggu", "url"],
        lahanRows.map((l) => [l.k, l.no, l.kota, l.prov, l.st, l.seg, l.o, l.ds, l.lu, l.pj, l.lb, l.t, l.d, l.h, l.p, l.ht, l.hm2, l.ps, l.lt, l.m?.t, l.m?.a, l.m?.z, l.m?.v, l.m?.th, l.m?.s, sisaHari(l.m, asof), statusKontrak(l, asof), l.m?.n, l.m?.pd, `https://brightspace.pertamina.com/detail/lahan?id=${l.s}&lahanId=${l.i}`]));
    }
  };

  const activeCount = Object.entries(f).filter(([k, v]) => v !== "" && !["tab", "sort", "dir"].includes(k)).length;

  if (error) return <Insight tone="warn">Data penjelajah gagal dimuat ({error}). Jalankan <code>python eksplorasi.py</code> agar <code>public/eksplorasi/</code> terisi, lalu muat ulang.</Insight>;

  return (
    <div className="space-y-4">
      {/* tab */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Jenis data" className="inline-flex rounded-md border border-grid p-0.5">
          {(["spbu", "lahan"] as Tab[]).map((t) => (
            <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setMany({ tab: t, sort: "", dir: "" })}
              className={`rounded px-3 py-1.5 text-sm ${tab === t ? "bg-accent font-semibold text-white" : "text-ink-2 hover:bg-plane"}`}>
              {t === "spbu" ? `SPBU (${meta ? n(meta.spbu) : "…"})` : `Lahan (${meta ? n(meta.lahan) : "…"})`}
            </button>
          ))}
        </div>
        <div className="text-xs text-ink-3">
          {meta ? <>Scrape Brightspace{meta.master ? <> · master lahan per {meta.master.asof}</> : null} · dibuat {meta.dibuat}</> : "Memuat…"}
        </div>
      </div>

      {/* filter */}
      <section className="card p-4" aria-label="Filter">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Filter {activeCount > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-white">{activeCount} aktif</span>}</h2>
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="rounded-md border border-grid px-2 py-1 text-xs text-ink-2 hover:bg-plane">Reset</button>
            <button type="button" onClick={exportCsv} disabled={rows.length === 0} className="rounded-md border border-grid px-2 py-1 text-xs text-ink-2 hover:bg-plane disabled:opacity-40">Unduh CSV ({n(rows.length)})</button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={tab === "spbu" ? "Cari (nomor, alamat, kota, tenant)" : "Cari (kode, outlet, deskripsi, tenant)"} className="sm:col-span-2">
            <input type="search" className={inputCls} value={f.q ?? ""} onChange={(e) => set("q", e.target.value)} placeholder={tab === "spbu" ? "mis. 3140 atau Bank BNI" : "mis. 34.401-OUT atau Poci"} />
          </Field>
          <Field label="Provinsi"><Select value={provSel} onChange={(v) => setMany({ prov: v, kota: "" })} options={provOpts} /></Field>
          <Field label="Kota / kabupaten"><Select value={f.kota ?? ""} onChange={(v) => set("kota", v)} options={kotaOpts} /></Field>

          {tab === "spbu" ? (
            <>
              <Field label="Lahan kosong">
                <Select value={f.kosong ?? ""} onChange={(v) => set("kosong", v)} options={[{ value: "ada", label: "Ada lahan kosong" }, { value: "penuh", label: "Semua lahan terisi" }, { value: "tidak", label: "Tidak ada kosong" }, { value: "nol", label: "Belum punya lahan" }]} />
              </Field>
              <Field label="Jumlah lahan"><Range lo={f.lmin ?? ""} hi={f.lmax ?? ""} onLo={(v) => set("lmin", v)} onHi={(v) => set("lmax", v)} /></Field>
              <Field label="Segmen tenant yang ada"><Select value={f.seg ?? ""} onChange={(v) => set("seg", v)} options={segOpts.filter((o) => o.value !== "Kosong (Tersedia)")} /></Field>
              <Field label="Sewa diketahui ≥ (Rp jt/th)"><input type="number" className={inputCls} value={f.rmin ?? ""} onChange={(e) => set("rmin", e.target.value)} placeholder="mis. 50" /></Field>
              <Field label="Tarif listing maks ≥ (Rp jt)"><input type="number" className={inputCls} value={f.hmax ?? ""} onChange={(e) => set("hmax", e.target.value)} placeholder="mis. 30" /></Field>
              <Field label="Data area sekitar">
                <Select value={f.area ?? ""} onChange={(v) => set("area", v)} options={[{ value: "ada", label: "Ada" }, { value: "tidak", label: "Tidak ada" }]} />
              </Field>
              <Field label="Kategori area sekitar">
                <Select value={f.areak ?? ""} onChange={(v) => set("areak", v)} options={(meta?.area_kategori ?? []).map((a) => ({ value: a.nama, label: `${a.nama} (${n(a.titik)})` }))} />
              </Field>
              <Field label="Koordinat">
                <Select value={f.koord ?? ""} onChange={(v) => set("koord", v)} options={[{ value: "ada", label: "Ada" }, { value: "tidak", label: "Tidak ada" }, { value: "fix", label: "Dikoreksi otomatis" }]} />
              </Field>
              <Field label="Data fasilitas">
                <Select value={f.fasdata ?? ""} onChange={(v) => set("fasdata", v)} options={[{ value: "ada", label: "Mencantumkan" }, { value: "tidak", label: "Kosong" }]} />
              </Field>
              <Field label="Foto 360°"><Select value={f.l360 ?? ""} onChange={(v) => set("l360", v)} options={[{ value: "ada", label: "Ada tautan 360°" }]} /></Field>
              {meta?.master && (
                <Field label="Kontrak di master">
                  <Select value={f.kontrak ?? ""} onChange={(v) => set("kontrak", v)} options={[{ value: "ada", label: "Ada kontrak" }, { value: "tidak", label: "Tidak ada" }]} />
                </Field>
              )}
              <Field label="Fasilitas (harus ada semua yang dipilih)" className="sm:col-span-2 lg:col-span-4">
                <Chips options={(meta?.fasilitas ?? []).map((x) => ({ value: x.nama, label: `${x.nama} · ${n(x.spbu)}` }))} selected={fasSel} onToggle={(v) => toggleIn("fas", v)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Status"><Select value={f.st ?? ""} onChange={(v) => set("st", v)} options={[{ value: "Tersedia", label: "Tersedia (kosong)" }, { value: "Tersewa", label: "Tersewa" }]} /></Field>
              <Field label="Segmen"><Select value={f.seg ?? ""} onChange={(v) => set("seg", v)} options={segOpts} /></Field>
              <Field label="Posisi"><Select value={f.ps ?? ""} onChange={(v) => set("ps", v)} options={[{ value: "Didalam Bangunan", label: "Di dalam bangunan" }, { value: "Diluar Bangunan", label: "Di luar bangunan" }]} /></Field>
              <Field label="Lantai"><Select value={f.lt ?? ""} onChange={(v) => set("lt", v)} options={[{ value: "Lantai 0", label: "Lantai 0 (luar)" }, { value: "Lantai 1", label: "Lantai 1" }, { value: "Lantai 2", label: "Lantai 2" }]} /></Field>
              <Field label="Luas (m²)"><Range lo={f.lumin ?? ""} hi={f.lumax ?? ""} onLo={(v) => set("lumin", v)} onHi={(v) => set("lumax", v)} /></Field>
              <Field label="Tarif tahunan (Rp jt)"><Range lo={f.hmin ?? ""} hi={f.hmax ?? ""} onLo={(v) => set("hmin", v)} onHi={(v) => set("hmax", v)} /></Field>
              <Field label="Data tarif">
                <Select value={f.harga ?? ""} onChange={(v) => set("harga", v)} options={[{ value: "ada", label: "Tarif valid" }, { value: "tidak", label: "Tanpa tarif valid" }, { value: "outlier", label: "Tercantum tapi di luar rentang wajar" }]} />
              </Field>
              <Field label="Periode listing"><Select value={f.p ?? ""} onChange={(v) => set("p", v)} options={[{ value: "Tahun", label: "Per tahun" }, { value: "Bulan", label: "Per bulan" }]} /></Field>
              <Field label="Daya listrik (W)"><Range lo={f.dmin ?? ""} hi={f.dmax ?? ""} onLo={(v) => set("dmin", v)} onHi={(v) => set("dmax", v)} /></Field>
              <Field label="Data daya"><Select value={f.daya ?? ""} onChange={(v) => set("daya", v)} options={[{ value: "ada", label: "Tercantum" }, { value: "tidak", label: "Kosong / 0" }]} /></Field>
              {meta?.master && (
                <>
                  <Field label="Status kontrak (master)">
                    <Select value={f.kontrak ?? ""} onChange={(v) => set("kontrak", v)} options={STATUS_KONTRAK.map((s) => ({ value: s, label: s }))} />
                  </Field>
                  <Field label="Tenant (master)"><input className={inputCls} list="tenant-list" value={f.tenant ?? ""} onChange={(e) => set("tenant", e.target.value)} placeholder="mis. Bank Mandiri" />
                    <datalist id="tenant-list">{meta.tenant_top.map((t) => <option key={t.nama} value={t.nama} />)}</datalist>
                  </Field>
                  <Field label="Pengajuan menunggu"><Select value={f.pending ?? ""} onChange={(v) => set("pending", v)} options={[{ value: "ada", label: "Ada pengajuan menunggu persetujuan" }]} /></Field>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ringkasan hasil */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summary.map(([k, v]) => (
          <div key={k} className="card p-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{k}</div>
            <div className="tnum mt-0.5 text-lg font-semibold">{v}</div>
          </div>
        ))}
      </div>

      {/* tabel */}
      <section className="card min-w-0 p-4">
        {!spbu || (tab === "lahan" && !lahanReady) ? (
          <div className="py-10 text-center text-sm text-ink-3" role="status">
            {tab === "lahan" && spbu ? <>Memuat lahan…{progress ? ` ${progress[0]}/${progress[1]} provinsi` : ""}</> : "Memuat data…"}
            {tab === "lahan" && !provSel && <div className="mt-1 text-xs">Pilih provinsi dulu bila ingin lebih cepat; tanpa provinsi, semua 31 rb lahan dimuat sekali lalu disimpan di memori.</div>}
          </div>
        ) : tab === "spbu" ? (
          <SortTable rows={pageRows as Spbu[]} cols={spbuCols} sort={sort} onSort={onSort} rowKey={(r) => r.id} />
        ) : (
          <SortTable rows={pageRows as Lahan[]} cols={lahanCols} sort={sort} onSort={onSort} rowKey={(r) => r.i} />
        )}
        {rows.length > 0 && <Pager page={page} pages={pages} size={size} total={rows.length} onPage={setPage} onSize={(s) => { setSize(s); setPage(0); }} />}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ kolom */
const spbuCols: Col<Spbu>[] = [
  { key: "no", label: "SPBU", sort: (r) => r.no, render: (r) => <Link href={`/data/spbu/${r.id}`} className="font-medium text-accent underline-offset-2 hover:underline">{r.no}</Link> },
  { key: "kota", label: "Kota", sort: (r) => r.kota, render: (r) => <span className="whitespace-nowrap">{r.kota}</span>, width: "9rem" },
  { key: "prov", label: "Provinsi", sort: (r) => r.prov, render: (r) => <span className="whitespace-nowrap">{r.prov}</span> },
  { key: "alamat", label: "Alamat", render: (r) => <span className="line-clamp-2 max-w-[22rem] text-xs text-ink-2" title={r.alamat}>{r.alamat}</span> },
  { key: "lahan", label: "Lahan", align: "right", sort: (r) => r.lahan, render: (r) => n(r.lahan) },
  { key: "kosong", label: "Kosong", align: "right", sort: (r) => r.kosong, render: (r) => <span className={r.kosong > 0 ? "font-semibold text-critical" : ""}>{n(r.kosong)}</span> },
  { key: "seg", label: "Segmen tenant", sort: (r) => r.seg.length, render: (r) => (
    <span className="flex max-w-[18rem] flex-wrap gap-1" title={r.seg.join(", ")}>
      {r.seg.slice(0, 4).map((s) => <span key={s} className="whitespace-nowrap rounded border border-grid px-1 text-[11px] text-ink-2">{SEG_SHORT[s] ?? s}</span>)}
      {r.seg.length > 4 && <span className="rounded border border-grid px-1 text-[11px] text-ink-3">+{r.seg.length - 4}</span>}
    </span>) },
  { key: "rent", label: "Sewa diketahui/th", align: "right", sort: (r) => r.rent, render: (r) => (r.rent ? rp(r.rent) : "–") },
  { key: "hmax", label: "Listing maks", align: "right", sort: (r) => r.hmax, render: (r) => (r.hmax ? rp(r.hmax) : "–") },
  { key: "fas", label: "Fasilitas", align: "right", sort: (r) => r.fas.length, render: (r) => <span title={r.fas.join(", ")}>{r.fas.length || "–"}</span> },
  { key: "area", label: "Area sekitar", align: "right", sort: (r) => r.area.length, render: (r) => r.area.length || "–" },
  { key: "kontrak", label: "Kontrak", align: "right", sort: (r) => r.kontrak, render: (r) => (r.kontrak ? n(r.kontrak) : "–") },
  { key: "koord", label: "Koordinat", render: (r) => (r.lat === null ? <span className="text-ink-3">–</span> : r.fix ? <span className="text-xs text-serious">dikoreksi</span> : <span className="text-xs text-ink-3">ada</span>) },
];

function makeLahanCols(asof: Date): Col<Lahan>[] {
  const KontrakPill = ({ l }: { l: Lahan }) => {
    const st = statusKontrak(l, asof);
    return st === "tanpa kontrak" ? <span className="text-ink-3">–</span> : <Pill color={KONTRAK_COLOR[st]}>{st}</Pill>;
  };
  return [
  { key: "k", label: "Kode lahan", sort: (r) => r.k, render: (r) => <Link href={`/data/spbu/${r.s}#lahan-${r.i}`} className="whitespace-nowrap font-medium text-accent underline-offset-2 hover:underline">{r.k}</Link> },
  { key: "st", label: "Status", sort: (r) => r.st, render: (r) => <Pill color={STATUS_COLOR[r.st] ?? "var(--muted-mark)"}>{r.st}</Pill> },
  { key: "seg", label: "Segmen", sort: (r) => r.seg, render: (r) => <span className="whitespace-nowrap text-xs">{SEG_SHORT[r.seg] ?? r.seg}</span> },
  { key: "o", label: "Outlet / brand", sort: (r) => r.o, render: (r) => <span className="line-clamp-2 max-w-[14rem]" title={r.o}>{r.o || "–"}</span> },
  { key: "lu", label: "Luas", align: "right", sort: (r) => r.lu, render: (r) => (r.lu ? `${n(r.lu, 1)} m²` : "–") },
  { key: "ps", label: "Posisi", sort: (r) => r.ps, render: (r) => <span className="whitespace-nowrap text-xs">{r.ps === "Didalam Bangunan" ? "Dalam" : "Luar"} · {r.lt.replace("Lantai ", "L")}</span> },
  { key: "ht", label: "Tarif/th", align: "right", sort: (r) => r.ht, render: (r) => (r.ht ? rp(r.ht) : r.h ? <span className="text-xs text-serious" title={`Tercantum ${rpFull(r.h)}/${r.p.toLowerCase()}, di luar rentang wajar`}>outlier</span> : "–") },
  { key: "hm2", label: "Rp/m²/th", align: "right", sort: (r) => r.hm2, render: (r) => (r.hm2 ? rp(r.hm2) : "–") },
  { key: "d", label: "Daya", align: "right", sort: (r) => r.d, render: (r) => (r.d ? `${n(r.d)} W` : "–") },
  { key: "tenant", label: "Tenant (master)", sort: (r) => r.m?.t, render: (r) => <span className="line-clamp-2 max-w-[14rem] text-xs" title={r.m?.t}>{r.m?.t && r.m.t !== "-" ? r.m.t : "–"}</span> },
  { key: "akhir", label: "Berakhir", sort: (r) => r.m?.z, render: (r) => <span className="whitespace-nowrap text-xs">{tgl(r.m?.z)}</span> },
  { key: "kontrak", label: "Sisa kontrak", sort: (r) => (r.m?.z ? r.m.z : null), render: (r) => <KontrakPill l={r} /> },
  { key: "kota", label: "Kota", sort: (r) => r.kota, render: (r) => <span className="whitespace-nowrap text-xs">{r.kota}</span> },
  ];
}
