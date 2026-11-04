"use client";

import { data } from "@/lib/data";
import { n, pct, rp } from "@/lib/format";
import { ChartCard, DataTable, Insight, PageHeader } from "@/components/ui";
import { Heatmap, RankedBars } from "@/components/charts";

export default function Page() {
  const seg = data.by_segment.filter((s) => s.segmen !== "Kosong (Tersedia)");
  const growth = new Set(["Energi Baru (EV/PLTS)", "Logistik & Ekspedisi", "F&B / Kuliner"]);
  const byRevenue = [...seg].filter((s) => s.harga_median).sort((a, b) => (b.harga_median ?? 0) - (a.harga_median ?? 0));

  return (
    <>
      <PageHeader title="Segmen tenant" lead="Siapa yang menyewa lahan SPBU hari ini. Nama outlet (1.800+ variasi) dipetakan ke 11 segmen NFR lewat kata kunci; aturan lengkap di halaman Metodologi." />

      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard title="Lahan tersewa per segmen" note="Segmen bertumbuh (F&B, logistik, energi baru) ditonjolkan; sisanya konteks." className="lg:col-span-3"
          table={<DataTable rows={seg} columns={[{ key: "segmen", label: "Segmen" }, { key: "lahan", label: "Lahan", align: "right", render: (r) => n(r.lahan) }, { key: "share_tersewa_pct", label: "% tersewa", align: "right", render: (r) => pct(r.share_tersewa_pct) }, { key: "harga_median", label: "Tarif median/th", align: "right", render: (r) => rp(r.harga_median) }, { key: "luas_median", label: "Luas median", align: "right", render: (r) => `${n(r.luas_median)} m²` }, { key: "harga_m2_median", label: "Tarif/m²", align: "right", render: (r) => rp(r.harga_m2_median) }, { key: "luar_pct", label: "% luar bangunan", align: "right", render: (r) => pct(r.luar_pct, 0) }]} />}>
          <RankedBars rows={seg} label="segmen" value="lahan" highlight={(r) => growth.has(r.segmen)} color="var(--series-3)" tip={(r) => [{ label: "Lahan", value: n(r.lahan) }, { label: "% dari tersewa", value: pct(r.share_tersewa_pct) }, { label: "Tarif median", value: rp(r.harga_median) }, { label: "Luas median", value: `${n(r.luas_median)} m²` }]} />
        </ChartCard>
        <ChartCard title="Tarif sewa median per segmen" note="Rupiah per lahan per tahun (setelah outlier dibuang)." className="lg:col-span-2">
          <RankedBars rows={byRevenue} label="segmen" value="harga_median" format={(v) => rp(v, 0)} tip={(r) => [{ label: "Median", value: rp(r.harga_median) }, { label: "P25–P75", value: `${rp(r.harga_q["0.25"])} – ${rp(r.harga_q["0.75"])}` }, { label: "Tarif/m²", value: rp(r.harga_m2_median) }]} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Insight>Tiga segmen tradisional (LPG, pelumas, perbankan/ATM) menguasai {pct(seg.filter((s) => ["LPG & Bright Gas", "Pelumas & Oli", "Perbankan & ATM"].includes(s.segmen)).reduce((a, s) => a + (s.share_tersewa_pct ?? 0), 0), 0)} lahan tersewa. Portofolio yang terkonsentrasi = risiko tunggal bila salah satu segmen melemah (mis. ATM vs cashless).</Insight>
        <Insight tone="good">Segmen dengan tarif median tertinggi adalah {byRevenue[0]?.segmen} ({rp(byRevenue[0]?.harga_median)}/th) dan {byRevenue[1]?.segmen} ({rp(byRevenue[1]?.harga_median)}/th): acuan untuk memprioritaskan format tenant bernilai tinggi.</Insight>
        <Insight tone="warn">Energi baru dan logistik masing-masing baru {n(seg.find((s) => s.segmen === "Energi Baru (EV/PLTS)")?.lahan)} dan {n(seg.find((s) => s.segmen === "Logistik & Ekspedisi")?.lahan)} lahan: belum menjadi lini bisnis, masih uji coba lokal.</Insight>
      </div>

      <div className="mt-4">
        <ChartCard title="Peta segmen × provinsi (lahan tersewa)" note="12 provinsi terbesar × 8 segmen terbesar. Warna = jumlah lahan (skala log, satu rona biru).">
          <Heatmap rows={data.segment_province} rowKey="provinsi" columns={data.segment_columns} totalKey="total" />
        </ChartCard>
      </div>

      <div className="mt-4">
        <ChartCard title="25 brand/tenant terbesar" note="Nama outlet persis seperti di marketplace; satu brand bisa muncul dengan beberapa ejaan.">
          <DataTable rows={data.top_brands} columns={[{ key: "brand", label: "Brand / outlet" }, { key: "segmen", label: "Segmen" }, { key: "lahan", label: "Lahan", align: "right", render: (r) => n(r.lahan) }]} />
        </ChartCard>
      </div>
    </>
  );
}
