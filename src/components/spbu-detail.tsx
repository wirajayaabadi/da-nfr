"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  asofDate, EPOCH, loadLahanProv, loadMeta, loadSpbu, sisaHari, statusKontrak, tgl, AREA_LABEL, LAHAN_URL, SPBU_URL,
  type Lahan, type Meta, type Spbu,
} from "@/lib/eksplorasi";
import { n, pct, rp, rpFull } from "@/lib/format";
import { Insight, Pill, StatTile } from "@/components/ui";

const STATUS_COLOR: Record<string, string> = { Tersedia: "var(--status-warning)", Tersewa: "var(--status-good)" };
const KONTRAK_COLOR: Record<string, string> = {
  kedaluwarsa: "var(--status-critical)", "≤ 6 bulan": "var(--status-serious)", "6–12 bulan": "var(--status-warning)", "> 12 bulan": "var(--status-good)",
  "tanpa tanggal": "var(--muted-mark)", "tanpa kontrak": "var(--muted-mark)",
};
const slugOf = (meta: Meta, prov: string) => meta.provinsi.find((p) => p.nama === prov)?.slug;

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-grid/60 py-1.5 last:border-0">
      <dt className="shrink-0 text-ink-3">{k}</dt>
      <dd className={`text-right ${mono ? "tnum" : ""}`}>{v}</dd>
    </div>
  );
}

export function SpbuDetail({ id }: { id: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [spbu, setSpbu] = useState<Spbu | null | undefined>(undefined);   // undefined = memuat, null = tidak ditemukan
  const [lahan, setLahan] = useState<Lahan[] | null>(null);
  const [all, setAll] = useState<Spbu[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const asof = useMemo(() => (meta ? asofDate(meta) : EPOCH), [meta]);

  useEffect(() => {
    let alive = true;
    Promise.all([loadMeta(), loadSpbu()]).then(async ([m, list]) => {
      if (!alive) return;
      const s = list.find((x) => x.id === id) ?? null;
      setMeta(m); setAll(list); setSpbu(s);
      if (!s) return;
      const slug = slugOf(m, s.prov);
      const rows = slug ? await loadLahanProv(slug) : [];
      if (!alive) return;
      const mine = rows.filter((l) => l.s === id).sort((a, b) => a.k.localeCompare(b.k));
      setLahan(mine);
      const h = location.hash.replace("#lahan-", "");
      if (h && mine.some((l) => l.i === h)) { setOpen(h); setTimeout(() => document.getElementById(`lahan-${h}`)?.scrollIntoView({ block: "center" }), 50); }
    }).catch((e) => alive && setError(String(e)));
    return () => { alive = false; };
  }, [id]);

  const tetangga = useMemo(() => {
    if (!all || !spbu) return [];
    return all.filter((s) => s.kota === spbu.kota && s.id !== spbu.id).sort((a, b) => b.lahan - a.lahan).slice(0, 8);
  }, [all, spbu]);

  if (error) return <Insight tone="warn">Data gagal dimuat ({error}). Jalankan <code>python eksplorasi.py</code> lalu muat ulang.</Insight>;
  if (spbu === undefined) return <div className="py-10 text-center text-sm text-ink-3" role="status">Memuat data SPBU…</div>;
  if (spbu === null) return <Insight tone="warn">SPBU dengan id <code>{id}</code> tidak ada di data scrape. <Link href="/data" className="underline">Kembali ke daftar</Link>.</Insight>;

  const kontrakAktif = (lahan ?? []).filter((l) => l.m?.s === "Tersewa");
  const jatuhTempo = kontrakAktif.filter((l) => { const s = sisaHari(l.m, asof); return s !== null && s < 365; });
  const kedaluwarsa = kontrakAktif.filter((l) => { const s = sisaHari(l.m, asof); return s !== null && s < 0; });
  const rentMaster = kontrakAktif.reduce((a, l) => a + (l.m?.th ?? 0), 0);
  const listUrl = `/data?tab=spbu&prov=${encodeURIComponent(spbu.prov)}&kota=${encodeURIComponent(spbu.kota)}`;
  const lahanUrl = `/data?tab=lahan&prov=${encodeURIComponent(spbu.prov)}&q=${encodeURIComponent(spbu.no)}`;

  return (
    <div className="space-y-4">
      <nav className="text-xs text-ink-3" aria-label="Jejak">
        <Link href="/data" className="hover:underline">Data SPBU & lahan</Link> › <Link href={`/data?tab=spbu&prov=${encodeURIComponent(spbu.prov)}`} className="hover:underline">{spbu.prov}</Link> › <Link href={listUrl} className="hover:underline">{spbu.kota}</Link>
      </nav>

      <header className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-ink-3">{spbu.kota} · {spbu.prov}</div>
            <h1 className="text-2xl font-semibold tracking-tight">{spbu.nama}</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-2">{spbu.alamat}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <a href={SPBU_URL(spbu.id)} target="_blank" rel="noreferrer" className="rounded-md border border-grid px-2 py-1 hover:bg-plane">Brightspace ↗</a>
            {spbu.lat !== null && <>
              <a href={`https://www.google.com/maps?q=${spbu.lat},${spbu.lng}`} target="_blank" rel="noreferrer" className="rounded-md border border-grid px-2 py-1 hover:bg-plane">Google Maps ↗</a>
              <Link href={`/lokasi?provinsi=${encodeURIComponent(spbu.prov)}&kota=${encodeURIComponent(spbu.kota)}&spbu=${spbu.id}`} className="rounded-md border border-grid px-2 py-1 hover:bg-plane">Peta lokasi</Link>
            </>}
            <Link href={lahanUrl} className="rounded-md border border-grid px-2 py-1 hover:bg-plane">Lahan di tabel</Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Lahan NFR" value={n(spbu.lahan)} sub={`${n(spbu.tersewa)} tersewa`} />
        <StatTile label="Lahan kosong" value={n(spbu.kosong)} sub={spbu.lahan ? `${pct((spbu.kosong / spbu.lahan) * 100, 0)} dari lahan` : "belum punya lahan"} tone={spbu.kosong > 0 ? "warn" : undefined} />
        <StatTile label="Sewa diketahui/th" value={rp(spbu.rent)} sub="tarif listing valid, lahan tersewa" />
        <StatTile label="Listing" value={spbu.hmax ? `${rp(spbu.hmin || 0, 0)}–${rp(spbu.hmax, 0)}` : "–"} sub="rentang tarif tercantum" />
        {meta?.master ? (
          <>
            <StatTile label="Kontrak aktif (master)" value={n(kontrakAktif.length)} sub={rentMaster ? `≈ ${rp(rentMaster)}/th teranualisasi` : "tanpa nilai bertanggal"} />
            <StatTile label="Jatuh tempo ≤ 12 bln" value={n(jatuhTempo.length)} sub={kedaluwarsa.length ? `${n(kedaluwarsa.length)} sudah lewat per ${meta.master.asof}` : `per ${meta.master.asof}`} tone={jatuhTempo.length ? "warn" : undefined} />
          </>
        ) : (
          <>
            <StatTile label="Fasilitas" value={n(spbu.fas.length)} sub="tercantum di Brightspace" />
            <StatTile label="Area sekitar" value={n(spbu.area.length)} sub="titik dicatat pengelola" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card min-w-0 p-4 text-sm">
          <h2 className="text-sm font-semibold">Profil SPBU</h2>
          <dl className="mt-2">
            <Row k="Nomor" v={spbu.no} mono />
            <Row k="Status listing" v={spbu.stl} />
            <Row k="Koordinat" v={spbu.lat === null ? "tidak ada" : <span className="tnum">{spbu.lat}, {spbu.lng}{spbu.fix && <span className="ml-1 text-xs text-serious">(dikoreksi)</span>}</span>} />
            <Row k="Foto" v={n(spbu.foto)} mono />
            <Row k="Foto 360°" v={spbu.l360 ? "ada" : "tidak"} />
            <Row k="Kontrak di master" v={meta?.master ? n(spbu.kontrak) : "file master tidak dimuat"} mono />
          </dl>
        </section>

        <section className="card min-w-0 p-4 text-sm">
          <h2 className="text-sm font-semibold">Fasilitas <span className="font-normal text-ink-3">({n(spbu.fas.length)} dari {n(meta?.fasilitas.length ?? 0)} jenis)</span></h2>
          {spbu.fas.length === 0 ? (
            <p className="mt-2 text-xs text-ink-3">Pengelola belum mengisi data fasilitas; bukan berarti fasilitasnya tidak ada.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {(meta?.fasilitas ?? []).map((x) => {
                const on = spbu.fas.includes(x.nama);
                return <li key={x.nama} className={`rounded-full border px-2 py-0.5 text-xs ${on ? "border-good/60 bg-good/10 text-ink" : "border-grid text-ink-3 line-through"}`}>{x.nama}</li>;
              })}
            </ul>
          )}
          <h2 className="mt-4 text-sm font-semibold">Segmen tenant yang ada</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {spbu.seg.length ? spbu.seg.map((s) => <li key={s} className="rounded-full border border-grid px-2 py-0.5 text-xs">{s}</li>) : <li className="text-xs text-ink-3">belum ada tenant</li>}
          </ul>
          {spbu.tenant.length > 0 && <>
            <h2 className="mt-4 text-sm font-semibold">Tenant menurut master</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">{spbu.tenant.map((t) => <li key={t} className="rounded-full border border-grid px-2 py-0.5 text-xs">{t}</li>)}</ul>
          </>}
        </section>

        <section className="card min-w-0 p-4 text-sm">
          <h2 className="text-sm font-semibold">Area sekitar <span className="font-normal text-ink-3">({n(spbu.area.length)} titik)</span></h2>
          {spbu.area.length === 0 ? (
            <p className="mt-2 text-xs text-ink-3">Tidak ada titik area sekitar yang dicatat pengelola.</p>
          ) : (
            <ul className="mt-2 divide-y divide-grid/60">
              {spbu.area.map((a, i) => (
                <li key={i} className="py-1.5">
                  <div className="flex justify-between gap-2"><span className="font-medium">{a.n}</span><span className="tnum shrink-0 text-xs text-ink-3">{a.km !== null ? `${n(a.km, 1)} km` : "–"}</span></div>
                  <div className="text-xs text-ink-2">{AREA_LABEL[a.k] ?? a.k}{a.ket ? ` · ${a.ket}` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card min-w-0 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Lahan NFR <span className="font-normal text-ink-3">({lahan ? n(lahan.length) : "…"})</span></h2>
          <p className="text-xs text-ink-3">Klik baris untuk melihat semua kolom. {meta?.master ? `Kontrak master "Disetujui" terakhir per kode; sisa kontrak dihitung terhadap ${meta.master.asof}.` : ""}</p>
        </div>
        {!lahan ? <div className="py-6 text-center text-sm text-ink-3" role="status">Memuat lahan…</div> : lahan.length === 0 ? <p className="text-sm text-ink-3">SPBU ini belum mendaftarkan lahan NFR di Brightspace.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3">
                  <th className="py-2 pr-3 font-medium">Kode</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 pr-3 font-medium">Outlet / brand</th><th className="py-2 pr-3 font-medium">Segmen</th>
                  <th className="py-2 pr-3 text-right font-medium">Luas</th><th className="py-2 pr-3 font-medium">Posisi</th><th className="py-2 pr-3 text-right font-medium">Tarif/th</th><th className="py-2 pr-3 text-right font-medium">Daya</th>
                  {meta?.master && <><th className="py-2 pr-3 font-medium">Tenant (master)</th><th className="py-2 pr-3 font-medium">Berakhir</th><th className="py-2 pr-3 font-medium">Sisa</th></>}
                </tr>
              </thead>
              <tbody>
                {lahan.map((l) => {
                  const isOpen = open === l.i;
                  const sk = statusKontrak(l, asof);
                  const cols = meta?.master ? 11 : 8;
                  return (
                    <LahanRows key={l.i} l={l} isOpen={isOpen} onToggle={() => setOpen(isOpen ? null : l.i)} sk={sk} cols={cols} master={!!meta?.master} asof={asof} />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {tetangga.length > 0 && (
        <section className="card min-w-0 p-4 text-sm">
          <h2 className="text-sm font-semibold">SPBU lain di {spbu.kota} <span className="font-normal text-ink-3">({n(tetangga.length)} dengan lahan terbanyak)</span></h2>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {tetangga.map((s) => (
              <li key={s.id} className="flex justify-between gap-2 rounded-md border border-grid px-2 py-1.5">
                <Link href={`/data/spbu/${s.id}`} className="text-accent underline-offset-2 hover:underline">{s.no}</Link>
                <span className="tnum text-xs text-ink-2">{n(s.lahan)} lahan{s.kosong ? <span className="text-critical"> · {n(s.kosong)} kosong</span> : null}</span>
              </li>
            ))}
          </ul>
          <Link href={listUrl} className="mt-2 inline-block text-xs text-accent underline">Semua SPBU di {spbu.kota} →</Link>
        </section>
      )}
    </div>
  );
}

function LahanRows({ l, isOpen, onToggle, sk, cols, master, asof }: { l: Lahan; isOpen: boolean; onToggle: () => void; sk: string; cols: number; master: boolean; asof: Date }) {
  const sisa = sisaHari(l.m, asof);
  return (
    <>
      <tr id={`lahan-${l.i}`} className={`cursor-pointer border-b border-grid/60 align-top hover:bg-plane ${isOpen ? "bg-plane" : ""}`} onClick={onToggle}
        tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }} aria-expanded={isOpen}>
        <td className="whitespace-nowrap py-1.5 pr-3 font-medium">{l.k}</td>
        <td className="py-1.5 pr-3"><Pill color={STATUS_COLOR[l.st] ?? "var(--muted-mark)"}>{l.st}</Pill></td>
        <td className="py-1.5 pr-3"><span className="line-clamp-2 max-w-[14rem]">{l.o || "–"}</span></td>
        <td className="whitespace-nowrap py-1.5 pr-3 text-xs">{l.seg}</td>
        <td className="tnum whitespace-nowrap py-1.5 pr-3 text-right">{l.lu ? `${n(l.lu, 1)} m²` : "–"}</td>
        <td className="whitespace-nowrap py-1.5 pr-3 text-xs">{l.ps === "Didalam Bangunan" ? "Dalam" : "Luar"} · {l.lt}</td>
        <td className="tnum whitespace-nowrap py-1.5 pr-3 text-right">{l.ht ? rp(l.ht) : l.h ? <span className="text-xs text-serious">outlier</span> : "–"}</td>
        <td className="tnum whitespace-nowrap py-1.5 pr-3 text-right">{l.d ? `${n(l.d)} W` : "–"}</td>
        {master && <>
          <td className="py-1.5 pr-3 text-xs"><span className="line-clamp-2 max-w-[14rem]">{l.m?.t && l.m.t !== "-" ? l.m.t : "–"}</span></td>
          <td className="whitespace-nowrap py-1.5 pr-3 text-xs">{tgl(l.m?.z)}</td>
          <td className="py-1.5 pr-3">{sk === "tanpa kontrak" ? <span className="text-ink-3">–</span> : <Pill color={KONTRAK_COLOR[sk]}>{sk}</Pill>}</td>
        </>}
      </tr>
      {isOpen && (
        <tr className="border-b border-grid/60 bg-plane/60">
          <td colSpan={cols} className="px-3 py-3">
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Listing Brightspace</h3>
                <dl className="mt-1">
                  <Row k="Kode lahan" v={l.k} mono />
                  <Row k="Status" v={l.st} />
                  <Row k="Outlet / brand" v={l.o || "–"} />
                  <Row k="Segmen" v={l.seg} />
                  <Row k="Harga tercantum" v={l.h ? `${rpFull(l.h)} / ${l.p.toLowerCase()}` : "tidak diisi"} mono />
                  <Row k="Tarif tahunan (valid)" v={l.ht ? rpFull(l.ht) : l.h ? "di luar rentang wajar" : "–"} mono />
                  <Row k="Rp/m²/th" v={l.hm2 ? rpFull(l.hm2) : "–"} mono />
                  <Row k="Tautan" v={<a href={LAHAN_URL(l.s, l.i)} target="_blank" rel="noreferrer" className="text-accent underline">Brightspace ↗</a>} />
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Fisik</h3>
                <dl className="mt-1">
                  <Row k="Luas" v={l.lu ? `${n(l.lu, 2)} m²` : "–"} mono />
                  <Row k="Panjang × lebar" v={l.pj || l.lb ? `${n(l.pj, 2)} × ${n(l.lb, 2)} m` : "–"} mono />
                  <Row k="Tinggi bangunan" v={l.t ? `${n(l.t, 2)} m` : "–"} mono />
                  <Row k="Daya listrik" v={l.d ? `${n(l.d)} W` : "tidak diisi"} mono />
                  <Row k="Posisi" v={l.ps} />
                  <Row k="Lantai" v={l.lt} />
                </dl>
                {l.ds && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-ink-2"><span className="font-semibold text-ink-3">Deskripsi: </span>{l.ds}</p>}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Kontrak master {l.m?.n && l.m.n > 1 ? <span className="font-normal normal-case">({n(l.m.n)} baris riwayat)</span> : null}</h3>
                {!l.m ? <p className="mt-1 text-xs text-ink-3">Kode lahan ini tidak ada di master (atau master tidak dimuat).</p> : (
                  <dl className="mt-1">
                    <Row k="Tenant" v={l.m.t && l.m.t !== "-" ? l.m.t : "–"} />
                    <Row k="Status sewa" v={l.m.s} />
                    <Row k="Luas (master)" v={l.m.lu ? `${n(l.m.lu, 2)} m²` : "–"} mono />
                    <Row k="Mulai" v={tgl(l.m.a)} />
                    <Row k="Berakhir" v={tgl(l.m.z)} />
                    <Row k="Sisa" v={sisa === null ? "–" : sisa < 0 ? `lewat ${n(-sisa)} hari` : `${n(sisa)} hari`} mono />
                    <Row k="Nilai kontrak" v={l.m.v ? rpFull(l.m.v) : "–"} mono />
                    <Row k="Teranualisasi" v={l.m.th ? `${rpFull(l.m.th)}/th` : l.m.v && l.m.a && l.m.z ? "di luar rentang wajar" : "–"} mono />
                    {l.m.pd && <Row k="Pengajuan" v={<span className="text-serious">{l.m.pd}</span>} />}
                  </dl>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
