"use client";

import { data } from "@/lib/data";
import { n, pct, rp } from "@/lib/format";
import { ChartCard, DataTable, Hero, Insight, PageHeader, StatTile } from "@/components/ui";
import { Columns, RankedBars } from "@/components/charts";

export default function Page() {
  const o = data.overview, p = data.price, q = p.quantiles;
  const provM2 = data.by_province.filter((r) => r.provinsi !== "Tidak diketahui" && r.harga_m2_median && r.lahan >= 100).sort((a, b) => (b.harga_m2_median ?? 0) - (a.harga_m2_median ?? 0));
  const periode = p.periode.map((r) => ({ ...r, periode: r.periode || "Tidak ada" }));

  return (
    <>
      <PageHeader title="Harga sewa" lead={<>Tarif disetahunkan (periode bulanan × 12). {n(p.outlier_dikeluarkan)} tarif di luar rentang {rp(data.rules.price_min)}–{rp(data.rules.price_max)}/th dibuang sebagai salah input; {n(p.tanpa_harga)} lahan tidak mencantumkan tarif sama sekali.</>} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Hero value={`${rp(o.harga_tahunan_median)}`} label="Tarif sewa median per lahan per tahun" sub={`dari ${n(o.lahan_dengan_harga)} lahan dengan tarif valid`} />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatTile label="P10 – P90" value={`${rp(q["0.1"])} – ${rp(q["0.9"])}`} sub="rentang 80% lahan" />
          <StatTile label="P25 – P75" value={`${rp(q["0.25"])} – ${rp(q["0.75"])}`} sub="rentang interkuartil" />
          <StatTile label="Tarif per m² median" value={`${rp(o.harga_per_m2_median)}`} sub="per tahun" />
          <StatTile label="Lahan tanpa tarif valid" value={n(o.lahan_tanpa_harga_valid)} sub={pct((o.lahan_tanpa_harga_valid / o.lahan) * 100)} tone="warn" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <ChartCard title="Sebaran tarif sewa tahunan" note="Jumlah lahan per kelas tarif; sumbu dalam juta rupiah per tahun." className="lg:col-span-3" table={<DataTable rows={p.histogram} columns={[{ key: "bucket", label: "Kelas tarif" }, { key: "lahan", label: "Lahan", align: "right", render: (r) => n(r.lahan) }]} />}>
          <Columns rows={p.histogram} label="bucket" value="lahan" height={260} />
        </ChartCard>
        <ChartCard title="Periode tarif" note="Mayoritas tahunan; tarif bulanan disetahunkan." className="lg:col-span-2" table={<DataTable rows={periode} columns={[{ key: "periode", label: "Periode" }, { key: "lahan", label: "Lahan", align: "right", render: (r) => n(r.lahan) }]} />}>
          <Columns rows={periode} label="periode" value="lahan" height={260} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Tarif per m² per provinsi" note="Median, provinsi dengan ≥ 100 lahan." table={<DataTable rows={provM2} columns={[{ key: "provinsi", label: "Provinsi" }, { key: "harga_m2_median", label: "Tarif/m²/th", align: "right", render: (r) => rp(r.harga_m2_median) }, { key: "harga_median", label: "Tarif/lahan/th", align: "right", render: (r) => rp(r.harga_median) }, { key: "lahan", label: "Lahan", align: "right", render: (r) => n(r.lahan) }]} max={40} />}>
          <RankedBars rows={provM2} label="provinsi" value="harga_m2_median" format={(v) => rp(v, 1)} maxRows={16} tip={(r) => [{ label: "Tarif/m²", value: rp(r.harga_m2_median) }, { label: "Tarif/lahan", value: rp(r.harga_median) }, { label: "Lahan", value: n(r.lahan) }]} />
        </ChartCard>
        <div className="grid gap-4">
          <ChartCard title="Tarif menurut posisi lahan">
            <DataTable rows={p.by_posisi} columns={[{ key: "posisi", label: "Posisi" }, { key: "harga_median", label: "Tarif median/th", align: "right", render: (r) => rp(r.harga_median) }, { key: "harga_m2_median", label: "Tarif/m²/th", align: "right", render: (r) => rp(r.harga_m2_median) }]} />
          </ChartCard>
          <Insight tone="warn">Rentang P25–P75 selebar {n((q["0.75"] / q["0.25"]) || 0, 1)}× dan sepertiga lahan tanpa tarif valid menunjukkan penetapan harga masih manual per SPBU. Model tarif acuan (segmen × kota × posisi × luas) akan menutup kebocoran ini tanpa capex.</Insight>
          <Insight>Tarif per m² turun tajam seiring luas: lahan besar jauh lebih murah per meter. Ini insentif alami bagi mitra yang butuh ruang (gudang mikro, EV hub) dan argumen untuk menjual lahan besar dengan kontrak jangka panjang.</Insight>
        </div>
      </div>
    </>
  );
}
