"use client";

import Link from "next/link";
import { kajian, ASPEK_LABEL, ASPEK_ORDER, VERDICT_COLOR, KUADRAN_ORDER, SIKAP_COLOR, SIKAP_ORDER, type Verdict } from "@/lib/kajian";
import { ekonomi } from "@/lib/ekonomi";
import { rp } from "@/lib/format";
import { PageHeader, Pill, Insight } from "@/components/ui";
import { QUADRANT_COLOR } from "@/components/charts";

export default function Page() {
  const eko = Object.fromEntries(ekonomi.alternatif.map((a) => [a.id, a]));
  const items = [...kajian.alternatif].sort((a, b) => KUADRAN_ORDER.indexOf(a.kuadran) - KUADRAN_ORDER.indexOf(b.kuadran));
  const count = (v: Verdict) => items.reduce((s, a) => s + ASPEK_ORDER.filter((k) => a.verdict[k].nilai === v).length, 0);

  return (
    <>
      <PageHeader title="Kajian per alternatif" lead={<>Setiap alternatif di <Link className="underline" href="/rekomendasi">Rekomendasi</Link> diuji terhadap data yang kita punya (Brightspace, survei konsumen{kajian.sumber.master ? ", master lahan" : ""}) dan data eksternal (tolok ukur, berita industri, regulasi). Empat aspek dinilai: permintaan, pasokan lahan, ekonomi, dan kesiapan. Pilih alternatif di menu samping untuk membaca kajian lengkapnya.</>} />

      <Insight>
        Dari 48 penilaian (12 alternatif × 4 aspek): <strong>{count("kuat")} kuat</strong>, <strong>{count("sedang")} sedang</strong>, <strong>{count("lemah")} lemah</strong>. Penilaian adalah pertimbangan konsultan atas bukti yang dicantumkan di tiap halaman; sampel survei kecil (n = 73) sehingga sinyal permintaan dibaca sebagai arah, bukan besaran.
      </Insight>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SIKAP_ORDER.map((t) => {
          const xs = items.filter((a) => a.rencana.sikap.tingkat === t);
          return (
            <section key={t} className="card p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SIKAP_COLOR[t] }} aria-hidden />{xs[0]?.rencana.sikap.label ?? t}</div>
              <div className="mt-1 text-2xl font-semibold">{xs.length}</div>
              <div className="mt-1 flex flex-wrap gap-1">{xs.map((a) => <Link key={a.id} href={`/kajian/${a.id}#rencana`} className="rounded border border-grid px-1 text-[11px] text-ink-2 hover:bg-plane">{a.id}</Link>)}</div>
            </section>
          );
        })}
      </div>

      <div className="card mt-4 overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-3">
              <th className="py-2 pr-3 font-medium">Alternatif</th>
              {ASPEK_ORDER.map((k) => <th key={k} className="py-2 pr-3 font-medium">{ASPEK_LABEL[k]}</th>)}
              <th className="py-2 pr-3 font-medium">Yang akan kita lakukan</th>
              <th className="py-2 pr-3 text-right font-medium">Pendapatan/th (dasar)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-grid/60 last:border-0">
                <td className="py-2 pr-3">
                  <Link href={`/kajian/${a.id}`} className="font-medium underline-offset-2 hover:underline">
                    <span className="mr-1.5 text-ink-3">{a.id}</span>{a.nama}
                  </Link>
                  <div className="mt-1"><Pill color={QUADRANT_COLOR[a.kuadran]}>{a.kuadran}</Pill></div>
                </td>
                {ASPEK_ORDER.map((k) => (
                  <td key={k} className="py-2 pr-3 align-top">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs"><span className="h-2 w-2 rounded-full" style={{ background: VERDICT_COLOR[a.verdict[k].nilai] }} aria-hidden />{a.verdict[k].nilai}</span>
                  </td>
                ))}
                <td className="py-2 pr-3 align-top">
                  <Link href={`/kajian/${a.id}#rencana`} className="inline-flex min-w-[7rem] items-start gap-1.5 text-xs font-semibold hover:underline"><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: SIKAP_COLOR[a.rencana.sikap.tingkat] }} aria-hidden />{a.rencana.sikap.label}</Link>
                </td>
                <td className="tnum py-2 pr-3 text-right align-top">{rp(eko[a.id]?.skenario.dasar.pendapatan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="card p-4 text-sm">
          <h2 className="text-sm font-semibold">Skala penilaian</h2>
          <ul className="mt-2 space-y-1.5">
            {(Object.keys(kajian.skala_verdict) as Verdict[]).map((v) => (
              <li key={v} className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: VERDICT_COLOR[v] }} aria-hidden /><span><strong>{v}</strong>: {kajian.skala_verdict[v]}</span></li>
            ))}
          </ul>
        </section>
        <section className="card p-4 text-sm">
          <h2 className="text-sm font-semibold">Sumber data</h2>
          <ul className="mt-2 space-y-1.5 text-ink-2">
            <li><strong className="text-ink">Brightspace</strong>: {kajian.sumber.brightspace}</li>
            {kajian.sumber.survei && <li><strong className="text-ink">Survei</strong>: {kajian.sumber.survei}</li>}
            {kajian.sumber.master && <li><strong className="text-ink">Master lahan</strong>: {kajian.sumber.master}</li>}
            <li><strong className="text-ink">Eksternal</strong>: {kajian.sumber.eksternal}</li>
          </ul>
          <p className="mt-2 text-xs text-ink-3">Dibuat {kajian.dibuat} oleh <code>kajian.py</code>; angka ekonomi dari <code>ekonomi.py</code>.</p>
        </section>
      </div>
    </>
  );
}
