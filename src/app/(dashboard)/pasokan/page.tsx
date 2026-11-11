"use client";

import { data } from "@/lib/data";
import { n, pct, rp } from "@/lib/format";
import { ChartCard, DataTable, PageHeader, StatTile } from "@/components/ui";
import { Columns, RankedBars } from "@/components/charts";

export default function Page() {
  const o = data.overview, v = data.vacancy;
  const prov = data.by_province.filter((p) => p.provinsi !== "Tidak diketahui");
  const byLahan = [...prov].sort((a, b) => b.lahan - a.lahan);
  const byOkupansi = [...prov].filter((p) => p.lahan >= 100).sort((a, b) => (a.okupansi_pct ?? 0) - (b.okupansi_pct ?? 0));
  const kota = data.by_kota;
  const lahanCols = [
    { key: "kode_lahan", label: "Kode lahan", render: (r: (typeof v.top_by_harga)[number]) => <a className="underline" href={r.url} target="_blank" rel="noreferrer">{r.kode_lahan}</a> },
    { key: "kota", label: "Kota" }, { key: "provinsi", label: "Provinsi" },
    { key: "luas_valid", label: "Luas m²", align: "right" as const, render: (r: (typeof v.top_by_harga)[number]) => n(r.luas_valid) },
    { key: "harga_tahunan", label: "Tarif/th", align: "right" as const, render: (r: (typeof v.top_by_harga)[number]) => rp(r.harga_tahunan) },
    { key: "posisi_lahan", label: "Posisi" },
    { key: "daya_listrik_w", label: "Daya W", align: "right" as const, render: (r: (typeof v.top_by_harga)[number]) => n(r.daya_listrik_w) },
  ];

  return (
    <>
      <PageHeader title="Pasokan & okupansi" lead="Di mana lahan NFR berada, seberapa banyak yang terisi, dan seperti apa profil lahan yang masih kosong. Semua angka adalah hitungan lahan, bukan luas." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Lahan kosong" value={n(o.lahan_tersedia)} sub={`di ${n(o.spbu_dengan_lahan_kosong)} SPBU`} />
        <StatTile label="Kosong < 10 m²" value={n(v.tersedia_kecil_total)} sub="format kios mikro" />
        <StatTile label="Kosong luar bangunan" value={n(v.tersedia_luar_total)} sub="lantai 0 / halaman" />
        <StatTile label="Kosong ≥ 100 m²" value={n(v.tersedia_besar_total)} sub="lahan besar, sewa jangka panjang" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Lahan NFR per provinsi" note="Jumlah lahan (tersewa + kosong), 15 provinsi terbesar."
          table={<DataTable rows={byLahan} columns={[{ key: "provinsi", label: "Provinsi" }, { key: "spbu", label: "SPBU", align: "right", render: (r) => n(r.spbu) }, { key: "lahan", label: "Lahan", align: "right", render: (r) => n(r.lahan) }, { key: "tersedia", label: "Kosong", align: "right", render: (r) => n(r.tersedia) }, { key: "okupansi_pct", label: "Okupansi", align: "right", render: (r) => pct(r.okupansi_pct) }, { key: "harga_median", label: "Tarif median", align: "right", render: (r) => rp(r.harga_median) }]} max={40} />}>
          <RankedBars rows={byLahan} label="provinsi" value="lahan" tip={(r) => [{ label: "Lahan", value: n(r.lahan) }, { label: "SPBU", value: n(r.spbu) }, { label: "Okupansi", value: pct(r.okupansi_pct) }]} />
        </ChartCard>
        <ChartCard title="Okupansi terendah per provinsi" note="Provinsi dengan ≥ 100 lahan; nilai = % lahan tersewa."
          table={<DataTable rows={byOkupansi} columns={[{ key: "provinsi", label: "Provinsi" }, { key: "okupansi_pct", label: "Okupansi", align: "right", render: (r) => pct(r.okupansi_pct) }, { key: "tersedia", label: "Kosong", align: "right", render: (r) => n(r.tersedia) }, { key: "pendapatan_idle", label: "Potensi idle", align: "right", render: (r) => rp(r.pendapatan_idle) }]} max={40} />}>
          <RankedBars rows={byOkupansi} label="provinsi" value="okupansi_pct" format={(x) => pct(x, 0)} color="var(--series-2)" tip={(r) => [{ label: "Okupansi", value: pct(r.okupansi_pct) }, { label: "Kosong", value: n(r.tersedia) }, { label: "Potensi idle", value: rp(r.pendapatan_idle) }]} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Kota dengan lahan kosong terbanyak" note="Target geografis program pengisian; mayoritas kota metropolitan."
          table={<DataTable rows={kota} columns={[{ key: "kota", label: "Kota" }, { key: "provinsi", label: "Provinsi" }, { key: "tersedia", label: "Kosong", align: "right", render: (r) => n(r.tersedia) }, { key: "lahan", label: "Lahan", align: "right", render: (r) => n(r.lahan) }, { key: "okupansi_pct", label: "Okupansi", align: "right", render: (r) => pct(r.okupansi_pct) }, { key: "pendapatan_idle", label: "Potensi idle", align: "right", render: (r) => rp(r.pendapatan_idle) }]} max={40} />}>
          <RankedBars rows={kota} label="kota" value="tersedia" color="var(--series-2)" tip={(r) => [{ label: "Kosong", value: n(r.tersedia) }, { label: "Okupansi", value: pct(r.okupansi_pct) }, { label: "Potensi idle", value: rp(r.pendapatan_idle) }]} />
        </ChartCard>
        <div className="grid gap-4">
          <ChartCard title="Lahan kosong menurut luas" note="Hampir 60% kekosongan ada di lahan < 10 m²." table={<DataTable rows={v.by_luas} columns={[{ key: "bucket", label: "Luas" }, { key: "lahan", label: "Lahan kosong", align: "right", render: (r) => n(r.lahan) }]} />}>
            <Columns rows={v.by_luas} label="bucket" value="lahan" height={200} color="var(--series-2)" />
          </ChartCard>
          <ChartCard title="SPBU menurut jumlah lahan kosong" note="Sebagian besar SPBU hanya punya 1–2 lahan kosong." table={<DataTable rows={v.spbu_by_jumlah_kosong} columns={[{ key: "jumlah", label: "Lahan kosong" }, { key: "spbu", label: "SPBU", align: "right", render: (r) => n(r.spbu) }]} />}>
            <Columns rows={v.spbu_by_jumlah_kosong} label="jumlah" value="spbu" height={200} />
          </ChartCard>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Okupansi menurut posisi lahan">
          <DataTable rows={v.by_posisi} columns={[{ key: "posisi", label: "Posisi" }, { key: "total", label: "Lahan", align: "right", render: (r) => n(r.total) }, { key: "tersedia", label: "Kosong", align: "right", render: (r) => n(r.tersedia) }, { key: "okupansi_pct", label: "Okupansi", align: "right", render: (r) => pct(r.okupansi_pct) }]} />
          <p className="mt-3 text-xs text-ink-2">Lantai 2 paling sulit terisi; lahan luar bangunan sedikit lebih rendah dari dalam bangunan tetapi jauh lebih fleksibel untuk format baru (EV, perawatan kendaraan).</p>
        </ChartCard>
        <ChartCard title="Daya listrik lahan kosong" note="Petunjuk kesiapan tenant berdaya tinggi (F&B panas). Lahan luar bangunan hampir tidak pernah mencantumkan daya, jadi sebaran ini praktis hanya lahan dalam bangunan." table={<DataTable rows={v.by_daya} columns={[{ key: "bucket", label: "Daya" }, { key: "lahan", label: "Lahan kosong", align: "right", render: (r) => n(r.lahan) }]} />}>
          <Columns rows={v.by_daya} label="bucket" value="lahan" height={220} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4">
        <ChartCard title="20 lahan kosong dengan tarif tertinggi" note="Kandidat prioritas: nilai sewa besar yang sedang hilang setiap tahun.">
          <DataTable rows={v.top_by_harga} columns={lahanCols} />
        </ChartCard>
        <ChartCard title="20 lahan kosong terluas" note="Kandidat micro-fulfillment, EV hub, atau modular retail.">
          <DataTable rows={v.top_by_luas} columns={lahanCols} />
        </ChartCard>
      </div>
    </>
  );
}
