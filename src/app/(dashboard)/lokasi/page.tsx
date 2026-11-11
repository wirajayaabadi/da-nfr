"use client";

import { data } from "@/lib/data";
import { n, pct, rp } from "@/lib/format";
import { ChartCard, DataTable, Insight, PageHeader, StatTile } from "@/components/ui";
import { RankedBars } from "@/components/charts";
import { IndonesiaSpbuMap } from "@/components/ui/indonesia-spbu-map";

export default function Page() {
  const o = data.overview, f = data.facilities, a = data.area;
  return (
    <>
      <PageHeader title="Lokasi & fasilitas" lead={<>Sebaran geografis SPBU ber-lahan, kelengkapan fasilitas, dan konteks area sekitar. Koordinat tersedia untuk {n(o.koordinat_tersedia)} SPBU; {n(o.koordinat_diperbaiki)} di antaranya rusak/tertukar di sumber dan dikoreksi otomatis.</>} />

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Peta lahan NFR per provinsi</h2>
        <p className="mb-3 mt-0.5 text-xs text-ink-2">Klik provinsi untuk zoom ke titik SPBU, pilih kota atau SPBU di panel, atau cari langsung. Pilihan tersimpan di URL sehingga bisa dibagikan.</p>
        <IndonesiaSpbuMap provinces={data.by_province} />
      </section>

      <h2 className="mb-3 mt-8 text-base font-semibold">Fasilitas SPBU</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="SPBU tanpa data fasilitas" value={n(f.spbu_tanpa_data_fasilitas)} sub={pct((f.spbu_tanpa_data_fasilitas / o.spbu) * 100)} tone="warn" />
        <StatTile label="Okupansi · ada fasilitas" value={pct(f.okupansi_dengan_fasilitas)} sub="lahan di SPBU dengan data fasilitas" tone="good" />
        <StatTile label="Okupansi · tanpa fasilitas" value={pct(f.okupansi_tanpa_fasilitas)} sub="lahan di SPBU tanpa data fasilitas" />
        <StatTile label="Selisih okupansi" value={`${n(f.okupansi_dengan_fasilitas - f.okupansi_tanpa_fasilitas, 1)} poin`} sub="praktis tidak berbeda" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Cakupan fasilitas (% SPBU yang mencantumkan)" table={<DataTable rows={f.coverage} columns={[{ key: "fasilitas", label: "Fasilitas" }, { key: "spbu", label: "SPBU", align: "right", render: (r) => n(r.spbu) }, { key: "pct", label: "%", align: "right", render: (r) => pct(r.pct) }]} />}>
          <RankedBars rows={f.coverage} label="fasilitas" value="pct" format={(v) => pct(v, 0)} tip={(r) => [{ label: "SPBU", value: n(r.spbu) }, { label: "Cakupan", value: pct(r.pct) }]} />
        </ChartCard>
        <div className="grid gap-3">
          <Insight tone="warn">Toilet dan mushola, fasilitas paling dasar untuk dwell time, hanya tercantum di sekitar {pct(f.coverage.find((c) => c.fasilitas === "Toilet")?.pct, 0)} SPBU. Entah fasilitasnya memang belum ada, atau datanya tidak diisi; keduanya menurunkan daya tarik lahan di mata calon tenant yang membaca marketplace.</Insight>
          <Insight>Mencantumkan fasilitas ternyata <strong>tidak</strong> berkorelasi dengan okupansi (selisih {n(f.okupansi_dengan_fasilitas - f.okupansi_tanpa_fasilitas, 1)} poin). Artinya lahan tetap terisi tanpa itu; nilai fasilitas ada di jenis tenant yang bisa ditarik (F&B, lounge) dan tarif yang bisa diminta, bukan di tingkat keterisian. WiFi gratis baru {pct(f.coverage.find((c) => c.fasilitas === "WiFi Gratis")?.pct, 0)} SPBU.</Insight>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Area sekitar</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Kategori tempat di sekitar SPBU" note={`${n(o.area_sekitar_titik)} titik yang dicatat pengelola untuk ${n(o.spbu_dengan_area_sekitar)} SPBU.`}>
          <DataTable rows={a.by_kategori} columns={[{ key: "kategori", label: "Kategori" }, { key: "titik", label: "Titik", align: "right", render: (r) => n(r.titik) }, { key: "spbu", label: "SPBU", align: "right", render: (r) => n(r.spbu) }, { key: "jarak_median_km", label: "Jarak median", align: "right", render: (r) => `${n(r.jarak_median_km, 1)} km` }, { key: "okupansi_pct", label: "Okupansi lahan", align: "right", render: (r) => pct(r.okupansi_pct) }, { key: "harga_median", label: "Tarif median", align: "right", render: (r) => rp(r.harga_median) }]} />
        </ChartCard>
        <div className="grid gap-3">
          <StatTile label="Okupansi · SPBU dengan data area sekitar" value={pct(a.okupansi_dengan_data_area)} sub={`tarif median ${rp(a.harga_median_dengan_area)}/th`} tone="good" />
          <StatTile label="Okupansi · SPBU tanpa data area sekitar" value={pct(a.okupansi_tanpa_data_area)} sub={`tarif median ${rp(a.harga_median_tanpa_area)}/th`} />
          <Insight>Okupansi hampir sama dengan atau tanpa data area sekitar ({pct(a.okupansi_dengan_data_area)} vs {pct(a.okupansi_tanpa_data_area)}), tetapi tarifnya berbeda: SPBU yang mencatat hotel, perkantoran, perumahan, atau stasiun di dekatnya punya tarif median Rp 18–20 jt vs Rp 15 jt nasional. Kategori terdekat juga menjadi sinyal format tenant: F&B dan convenience dekat hotel/mal, locker dan layanan cepat dekat stasiun dan perkantoran. Catatan: hanya {pct((o.spbu_dengan_area_sekitar / o.spbu) * 100, 0)} SPBU mengisi data ini.</Insight>
        </div>
      </div>
    </>
  );
}
