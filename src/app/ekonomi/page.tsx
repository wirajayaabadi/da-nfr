"use client";

import Link from "next/link";
import { ekonomi as e } from "@/lib/ekonomi";
import { n, pct, rp } from "@/lib/format";
import { Hero, Insight, PageHeader, StatTile, DataTable } from "@/components/ui";
import { EkonomiExplorer } from "@/components/ekonomi-explorer";

export default function Page() {
  const d = e.total.dasar, k = e.total.konservatif, o = e.total.optimis;
  const byId = Object.fromEntries(e.alternatif.map((a) => [a.id, a]));
  const a1 = byId["A1"].skenario, a12 = byId["A12"].skenario, a6 = byId["A6"].skenario, a7 = byId["A7"].skenario, a5 = byId["A5"].skenario;
  const nfrNow = e.basis.rent_roll_tersewa;

  return (
    <>
      <PageHeader title="Dampak ekonomi" lead={<>Taksiran pendapatan tambahan Pertamina, kebutuhan modal, payback, dan NPV untuk 12 alternatif di <Link className="underline" href="/rekomendasi">Rekomendasi</Link>, dalam tiga skenario. Tarif sewa diambil dari Brightspace; angka lain dari tolok ukur publik yang dicantumkan di bawah. Belum ada data internal Pertamina, jadi setiap angka adalah rentang yang harus dikalibrasi, bukan proyeksi keuangan.</>} />

      <Insight tone="warn">
        Model ini memakai sudut pandang Pertamina sebagai <strong>pemilik lahan</strong>: pendapatan = sewa + bagi hasil (asumsi 0–10%), capex aset sebagian besar ditanggung mitra. Tiga hal belum tersedia dan diganti asumsi: {e.belum_ada.slice(0, 3).map((b) => b.split(" (")[0]).join("; ")}. Ubah di <code>ekonomi.py</code> (blok <code>BENCH</code>) bila angka internal sudah ada.
      </Insight>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Hero value={rp(d.pendapatan)} label="Pendapatan tambahan per tahun · skenario dasar" sub={`rentang ${rp(k.pendapatan)} – ${rp(o.pendapatan)}; tanpa A1 dan tanpa menghitung dua kali lahan yang diperebutkan`} />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatTile label="Dibanding sewa NFR saat ini" value={pct((d.pendapatan / nfrNow) * 100, 0)} sub={`rent roll lahan tersewa bertarif valid ${rp(nfrNow)}/th (${n(e.basis.lahan_tersewa_tarif_valid)} lahan)`} tone="good" />
          <StatTile label="Omzet mitra & UMKM per tahun" value={rp(d.omzet_mitra)} sub="dampak di luar Pertamina; skenario dasar" />
          <StatTile label="Capex mitra" value={rp(d.capex_mitra)} sub="aset dibiayai tenant/operator" />
          <StatTile label="Capex Pertamina" value={rp(d.capex_pertamina)} sub={`NPV ${e.parameter.horizon_tahun} th ${rp(d.npv)} pada diskonto ${pct(e.parameter.diskonto * 100, 0)}`} />
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Per alternatif</h2>
      <EkonomiExplorer />

      <h2 className="mb-3 mt-8 text-base font-semibold">Yang terlihat dari angka</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Insight tone="good"><strong>A1 (pengisian lahan kosong) tetap pengungkit terbesar dan termurah:</strong> {rp(a1.dasar.pendapatan)}/th di skenario dasar dengan capex Pertamina hanya {rp(a1.dasar.capex_pertamina)}, karena lahannya sudah ada. Alternatif format (A3, A6, A8) adalah cara mengisinya, bukan tambahan di atasnya.</Insight>
        <Insight tone="good"><strong>A6 (gudang mikro) punya kenaikan tarif per unit terbesar:</strong> lahan ≥ 100 m² sekarang disewakan ~{rp(e.basis.sewa_besar_m2_bulan)}/m²/bulan, sedangkan tarif gudang mikro Rp 45–90 rb. Per lahan {rp(a6.dasar.pendapatan_per_unit)}/th tanpa capex Pertamina; risikonya di permintaan luar Jabodetabek.</Insight>
        <Insight tone="warn"><strong>A12 (PLTS) adalah satu-satunya yang Pertamina biayai sendiri</strong> dan imbal hasilnya ~10–11%/th, nyaris sama dengan diskonto 10%: NPV 10 th {rp(a12.dasar.npv)}, 20 th {rp(a12.dasar.npv_20)}. Layak hanya bila capex turun ke ≤ Rp 14 jt/kWp atau ada insentif; lebih cocok dilepas ke mitra ESCO.</Insight>
        <Insight tone="warn"><strong>A7 (DOOH) punya rentang paling lebar</strong> ({rp(a7.konservatif.pendapatan)} – {rp(a7.optimis.pendapatan)}) karena belum ada data trafik SPBU dan rate card. <strong>A5 (EV)</strong> kecil untuk Pertamina ({rp(a5.dasar.pendapatan)}/th) pada model sewa+bagi hasil; nilainya strategis, bukan finansial jangka pendek.</Insight>
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Tolok ukur yang dipakai</h2>
      <div className="card p-4">
        <DataTable rows={e.tolok_ukur} columns={[
          { key: "item", label: "Item" }, { key: "nilai", label: "Nilai" },
          { key: "sumber", label: "Sumber", render: (r) => <a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.sumber}</a> },
        ]} />
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-3">Belum tersedia (diganti asumsi)</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{e.belum_ada.map((b) => <li key={b}>{b}</li>)}</ul>
        <p className="mt-3 text-xs text-ink-3">Tolok ukur diverifikasi 4 November 2026. Sebagian berasal dari situs penjual atau simulasi, bukan data transaksi; angka SPBU-spesifik (trafik, rate card iklan, bagi hasil) tidak ditemukan di sumber publik.</p>
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Cara membaca</h2>
      <div className="card p-4 text-sm leading-6">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Pendapatan</strong> = unit beroperasi × pendapatan per unit, pada kondisi mapan (tahun ke-3). Unit naik bertahap: {e.parameter.ramp.map((r) => pct(r * 100, 0)).join(" → ")} di tahun 1–3.</li>
          <li><strong>Skenario</strong> mengubah tiga hal sekaligus: jumlah unit, tarif/utilisasi per unit, dan porsi bagi hasil. Konservatif bukan kasus terburuk; itu kasus &ldquo;mitra ragu dan tarif di bawah median&rdquo;.</li>
          <li><strong>Payback dan NPV</strong> dihitung hanya dari kas Pertamina (capex program/aset vs sewa + bagi hasil − opex), diskonto {pct(e.parameter.diskonto * 100, 0)}, horizon {e.parameter.horizon_tahun} tahun; NPV 20 tahun ditampilkan untuk aset berumur panjang.</li>
          <li><strong>Total</strong> mengecualikan A1 (karena A1 adalah wadah bagi format lain) dan, bila dua alternatif memperebutkan lahan yang sama melebihi stoknya (A3/A4 di lahan &lt; 10 m², A5/A8 di lahan luar), hanya yang lebih besar yang dihitung.</li>
          <li><strong>A10</strong> adalah pendapatan yang diselamatkan dari churn ATM, bukan pendapatan baru; A12 diperlakukan sebagai aset milik Pertamina.</li>
        </ul>
      </div>
    </>
  );
}
