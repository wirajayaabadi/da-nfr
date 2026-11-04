"use client";

import Link from "next/link";
import { data } from "@/lib/data";
import { n, pct, rp } from "@/lib/format";
import { Hero, Insight, PageHeader, StatTile, ChartCard, DataTable } from "@/components/ui";
import { RankedBars, SegmentedBar, QUADRANT_COLOR } from "@/components/charts";

export default function Page() {
  const o = data.overview;
  const provKosong = [...data.by_province].filter((p) => p.provinsi !== "Tidak diketahui").sort((a, b) => b.tersedia - a.tersedia);
  const top3 = new Set(provKosong.slice(0, 3).map((p) => p.provinsi));
  const segTersewa = data.by_segment.filter((s) => s.segmen !== "Kosong (Tersedia)");
  const quick = data.alternatives.filter((a) => a.kuadran === "Quick Win");
  const fac = Object.fromEntries(data.facilities.coverage.map((f) => [f.fasilitas, f.pct]));

  return (
    <>
      <PageHeader
        title="Ringkasan eksekutif"
        lead={<>Potret bisnis Non Fuel Retail (NFR) dari {n(o.spbu)} SPBU dan {n(o.lahan)} lahan komersial yang dipublikasikan di marketplace Brightspace. Angka di bawah dihitung langsung dari data mentah; aturan pembersihan ada di halaman <Link className="underline" href="/metodologi">Metodologi</Link>.</>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Hero value={rp(o.pendapatan_idle_estimasi)} label="Potensi pendapatan sewa per tahun yang belum terealisasi" sub={`${n(o.lahan_tersedia)} lahan kosong · ${rp(o.pendapatan_idle_diketahui)} dari tarif terpublikasi + estimasi median untuk ${n(o.lahan_tersedia_tanpa_harga)} lahan tanpa tarif`} />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatTile label="SPBU di marketplace" value={n(o.spbu)} sub={`${n(o.spbu_dengan_lahan)} punya lahan NFR · ${n(o.kota)} kota/kab · ${o.provinsi} provinsi`} />
          <StatTile label="Lahan komersial" value={n(o.lahan)} sub={`${n(o.lahan_tersewa)} tersewa · ${n(o.lahan_tersedia)} kosong`} />
          <StatTile label="Okupansi nasional" value={pct(o.okupansi_pct)} sub={`${n(o.spbu_dengan_lahan_kosong)} SPBU masih punya lahan kosong`} />
          <StatTile label="Tarif sewa median" value={`${rp(o.harga_tahunan_median)}/th`} sub={`≈ ${rp(o.harga_per_m2_median)}/m²/th · ${n(o.lahan_tanpa_harga_valid)} lahan tanpa tarif valid`} tone="warn" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <ChartCard title="Komposisi lahan: tersewa vs kosong" className="lg:col-span-2">
          <SegmentedBar total={o.lahan} parts={[{ label: "Tersewa", value: o.lahan_tersewa, color: "var(--series-1)" }, { label: "Kosong", value: o.lahan_tersedia, color: "var(--series-2)" }]} />
          <p className="mt-4 text-xs leading-5 text-ink-2">Dari lahan yang tersewa, tiga segmen terbesar adalah {segTersewa.slice(0, 3).map((s) => `${s.segmen} (${pct(s.share_tersewa_pct, 0)})`).join(", ")}. Lihat rincian di <Link className="underline" href="/segmen">Segmen tenant</Link>.</p>
        </ChartCard>
        <ChartCard title="Provinsi dengan lahan kosong terbanyak" note="Tiga teratas ditonjolkan; bar lain sebagai konteks." className="lg:col-span-3"
          table={<DataTable rows={provKosong} columns={[{ key: "provinsi", label: "Provinsi" }, { key: "tersedia", label: "Kosong", align: "right", render: (r) => n(r.tersedia) }, { key: "lahan", label: "Total lahan", align: "right", render: (r) => n(r.lahan) }, { key: "okupansi_pct", label: "Okupansi", align: "right", render: (r) => pct(r.okupansi_pct) }, { key: "pendapatan_idle", label: "Potensi idle", align: "right", render: (r) => rp(r.pendapatan_idle) }]} max={15} />}>
          <RankedBars rows={provKosong} label="provinsi" value="tersedia" maxRows={12} color="var(--series-2)" highlight={(r) => top3.has(r.provinsi)}
            tip={(r) => [{ label: "Lahan kosong", value: n(r.tersedia) }, { label: "Okupansi", value: pct(r.okupansi_pct) }, { label: "Potensi idle", value: rp(r.pendapatan_idle) }]} />
        </ChartCard>
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Temuan utama</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Insight tone="warn">Okupansi {pct(o.okupansi_pct)} terdengar sehat, tetapi {n(o.lahan_tersedia)} lahan kosong tersebar di {n(o.spbu_dengan_lahan_kosong)} SPBU: masalahnya bukan satu-dua lokasi besar, melainkan ekor panjang kekosongan kecil yang butuh pendekatan program, bukan deal satu per satu.</Insight>
        <Insight tone="warn">{pct((data.vacancy.tersedia_kecil_total / o.lahan_tersedia) * 100, 0)} lahan kosong berukuran &lt; 10 m². Format tenant yang pas bukan ritel besar, melainkan kios mikro: kopi/teh, parcel locker, vending, agen layanan.</Insight>
        <Insight>Portofolio tenant sangat terkonsentrasi di tiga segmen tradisional (LPG, pelumas, perbankan/ATM). Segmen bertumbuh seperti energi baru dan logistik masing-masing masih di bawah 2% lahan tersewa: ruang inovasi terbesar ada di sini.</Insight>
        <Insight>{n(o.lahan_tanpa_harga_valid)} lahan ({pct((o.lahan_tanpa_harga_valid / o.lahan) * 100, 0)}) tidak punya tarif valid dan sebaran tarif sangat lebar (P25 {rp(data.price.quantiles["0.25"])} vs P75 {rp(data.price.quantiles["0.75"])}/th). Standardisasi tarif adalah pengungkit pendapatan paling murah.</Insight>
        <Insight tone="good">Profil SPBU di marketplace tipis: {pct((data.facilities.spbu_tanpa_data_fasilitas / o.spbu) * 100, 0)} SPBU tanpa data fasilitas (toilet hanya tercantum di {pct(fac["Toilet"], 0)}) dan hanya {pct((o.spbu_dengan_area_sekitar / o.spbu) * 100, 0)} mengisi area sekitar. Okupansinya tidak berbeda ({pct(data.facilities.okupansi_dengan_fasilitas)} vs {pct(data.facilities.okupansi_tanpa_fasilitas)}), tetapi tarif di SPBU yang mencatat hotel, perkantoran, atau stasiun di dekatnya 20–33% di atas median: kelengkapan profil adalah alat penetapan harga, bukan sekadar pelengkap.</Insight>
        <Insight tone="good">{n(data.vacancy.tersedia_luar_total)} lahan kosong di luar bangunan (lantai 0) dan {n(data.vacancy.tersedia_besar_total)} lahan kosong ≥ 100 m² adalah aset siap pakai untuk EV charging, micro-fulfillment, dan perawatan kendaraan.</Insight>
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Rekomendasi prioritas (Quick Win)</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {quick.map((a) => (
          <Link key={a.id} href={`/rekomendasi#${a.id}`} className="card p-4 transition hover:shadow-md">
            <div className="flex items-center gap-2 text-xs text-ink-3"><span className="h-2 w-2 rounded-full" style={{ background: QUADRANT_COLOR[a.kuadran] }} aria-hidden />{a.id} · {a.kategori}</div>
            <div className="mt-1 font-semibold leading-snug">{a.nama}</div>
            <div className="mt-2 text-xs text-ink-2">Dampak {n(a.impact, 1)} · Usaha {n(a.effort, 1)} · {n(a.addressable)} lahan/SPBU terjangkau</div>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-2">Matriks lengkap 12 alternatif, skor, dan peta jalan ada di <Link className="underline" href="/rekomendasi">Rekomendasi inovasi</Link>.</p>
    </>
  );
}
