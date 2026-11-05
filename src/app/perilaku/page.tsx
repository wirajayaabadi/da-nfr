"use client";

import Link from "next/link";
import { survei as s } from "@/lib/perilaku";
import type { Dist, KotaSurvei } from "@/lib/perilaku";
import { n, pct } from "@/lib/format";
import { ChartCard, DataTable, Hero, Insight, PageHeader, StatTile } from "@/components/ui";
import { Columns, GroupedBars, RankedBars, SegmentedBar } from "@/components/charts";

const P = (v: number) => pct(v, 0);
const distTable = (rows: Dist[], base = s.n) => (
  <DataTable rows={rows} columns={[
    { key: "opsi", label: "Jawaban", render: (r) => r.opsi ?? r.label },
    { key: "n", label: "Responden", align: "right", render: (r) => n(r.n) },
    { key: "pct", label: `% dari ${n(base)}`, align: "right", render: (r) => pct(r.pct) },
  ]} />
);
// Jawaban yang bukan pilihan substantif diredupkan agar tidak bersaing dengan opsi nyata.
const NON = new Set(["Tidak relevan", "Lainnya", "Tidak tahu", "Tidak butuh", "Tergantung layanan", "Tidak menjawab"]);
const substantive = (d: Dist) => !NON.has(d.label);
const tip = (base = s.n) => (r: Dist) => [{ label: "Responden", value: `${n(r.n)} dari ${n(base)}` }, { label: "Persentase", value: pct(r.pct) }];

const kotaTable = (rows: KotaSurvei[]) => (
  <DataTable rows={rows} max={40} columns={[
    { key: "kabkota", label: "Kab/kota", render: (k) => `${k.kabkota}${k.ambigu ? " *" : ""}` },
    { key: "responden", label: "Responden", align: "right", render: (k) => n(k.responden) },
    { key: "layanan_teratas", label: "Layanan paling diinginkan" },
    { key: "spbu", label: "SPBU", align: "right", render: (k) => n(k.spbu) },
    { key: "lahan", label: "Lahan", align: "right", render: (k) => n(k.lahan) },
    { key: "kosong", label: "Kosong", align: "right", render: (k) => n(k.kosong) },
    { key: "okupansi_pct", label: "Okupansi", align: "right", render: (k) => (k.okupansi_pct == null ? "belum ada lahan" : pct(k.okupansi_pct)) },
  ]} />
);

export default function Page() {
  const r = s.ringkasan;
  const top3 = new Set(s.permintaan.bermanfaat.slice(0, 3).map((d) => d.label));
  const kendaraan = s.profil.kendaraan;
  const motor = kendaraan.find((d) => d.opsi === "Sepeda motor");
  const mobil = kendaraan.find((d) => d.opsi === "Mobil pribadi");
  const lain = kendaraan.filter((d) => d !== motor && d !== mobil).reduce((a, d) => a + d.n, 0);
  const leak = s.kebocoran;
  const ban = leak.find((k) => k.kategori.startsWith("Ban"));
  const kopi = leak.find((k) => k.kategori.startsWith("Kopi"));
  const paket = s.permintaan.bermanfaat.find((d) => d.label === "Titik paket online");
  const ojol = s.permintaan.bermanfaat.find((d) => d.label === "Area kurir/ojol");
  const datang = s.permintaan.cara_akses.find((d) => d.label === "Datang langsung");
  const tanpaLahan = s.kota.filter((k) => k.spbu > 0 && k.lahan === 0);
  const kotaKecil = s.kota.filter((k) => k.responden < 2);

  return (
    <>
      <PageHeader
        title="Perilaku konsumen"
        lead={<>Survei {n(s.n)} pengguna SPBU Pertamina tentang kebiasaan mengisi BBM, belanja non-BBM, dan layanan yang mereka inginkan. Ini sisi <strong>permintaan</strong> yang melengkapi data pasokan lahan Brightspace di halaman lain; angka di sini dipakai untuk menguji ulang <Link className="underline" href="/rekomendasi">rekomendasi inovasi</Link>.</>}
      />

      <Insight tone="warn">
        Sampel kecil dan tidak acak: {n(s.n)} responden, {P(r.medan_raya_pct)} dari Medan, Deli Serdang, dan Binjai, {P(r.usia_55_pct)} berusia 55+ dan {P(r.usia_18_pct)} di bawah 18 tahun. Baca sebagai sinyal arah, bukan estimasi nasional; selisih beberapa persen di antara opsi tidak bermakna.
      </Insight>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Hero value={P(r.langsung_pergi_pct)} label="Langsung meninggalkan SPBU setelah mengisi BBM" sub={`dan ${P(r.tidak_mau_tambah_waktu_pct)} tidak mau menambah waktu sama sekali untuk layanan non-BBM`} />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatTile label="Beli non-BBM · 30 hari" value={P(r.beli_nonbbm_pct)} sub={`${n(s.n_beli)} dari ${n(s.n)} responden`} />
          <StatTile label="Mungkin mencoba (skor 4–5)" value={P(r.q21_top2_pct)} sub={`bila harga setara · rata-rata ${n(r.q21_rata, 1)} dari 5`} tone="good" />
          <StatTile label="Pernah sengaja datang untuk non-BBM" value={P(r.sengaja_datang_pct)} sub="satu kali atau beberapa kali" />
          <StatTile label="Tidak mungkin mencoba (skor 1–2)" value={P(r.q21_bottom2_pct)} sub="segmen yang sulit dikonversi" tone="warn" />
        </div>
      </div>

      {/* ------------------------------------------------ permintaan */}
      <h2 className="mb-3 mt-8 text-base font-semibold">Layanan yang diinginkan</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Layanan yang dianggap bermanfaat" note="Boleh pilih lebih dari satu; % dari seluruh responden. Tiga teratas ditonjolkan." table={distTable(s.permintaan.bermanfaat)}>
          <RankedBars rows={s.permintaan.bermanfaat} label="label" value="pct" format={P} highlight={(d) => top3.has(d.label)} color="var(--series-3)" tip={tip()} />
        </ChartCard>
        <ChartCard title="Layanan prioritas" note={`Diminta memilih satu, tetapi ${n(r.q20_lebih_dari_satu)} responden memilih lebih dari satu.`} table={distTable(s.permintaan.prioritas)}>
          <RankedBars rows={s.permintaan.prioritas} label="label" value="pct" format={P} highlight={(d) => top3.has(d.label)} color="var(--series-3)" tip={tip()} />
        </ChartCard>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <ChartCard title="Kemungkinan mencoba layanan prioritas" note="Skala 1 (tidak mungkin) – 5 (sangat mungkin), bila harganya setara dengan tempat biasa." className="lg:col-span-2" table={distTable(s.permintaan.kemungkinan)}>
          <Columns rows={s.permintaan.kemungkinan} label="label" value="pct" format={P} height={240} tip={tip()} />
        </ChartCard>
        <ChartCard title="Motor vs mobil: layanan bermanfaat" note={`% dalam tiap kelompok (motor n = ${n(s.permintaan.n_motor)}, mobil n = ${n(s.permintaan.n_mobil)}); selisih kecil tidak bermakna pada sampel ini.`} className="lg:col-span-3">
          <DataTable rows={s.permintaan.motor_vs_mobil.filter((d) => d.semua >= 5)} columns={[
            { key: "layanan", label: "Layanan" },
            { key: "semua", label: "Semua", align: "right", render: (d) => P(d.semua) },
            { key: "motor", label: "Motor", align: "right", render: (d) => P(d.motor) },
            { key: "mobil", label: "Mobil", align: "right", render: (d) => P(d.mobil) },
          ]} />
        </ChartCard>
      </div>

      {/* ------------------------------------------------ kebocoran */}
      <h2 className="mb-3 mt-8 text-base font-semibold">Belanja yang terjadi di luar SPBU</h2>
      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard title="Dibeli di luar SPBU vs di SPBU (30 hari terakhir)" note="% dari seluruh responden; hanya kategori yang ditanyakan di kedua pertanyaan. Selisihnya adalah belanja yang bisa ditangkap SPBU." className="lg:col-span-3"
          table={<DataTable rows={leak} columns={[{ key: "kategori", label: "Kategori" }, { key: "luar", label: "Di luar SPBU", align: "right", render: (d) => pct(d.luar) }, { key: "spbu", label: "Di SPBU", align: "right", render: (d) => pct(d.spbu) }]} />}>
          <GroupedBars rows={leak} label="kategori" format={P} series={[{ key: "luar", name: "Dibeli di luar SPBU", color: "var(--series-2)" }, { key: "spbu", name: "Dibeli di SPBU", color: "var(--series-1)" }]} />
        </ChartCard>
        <ChartCard title="Tempat belanja di luar SPBU" note="Boleh pilih lebih dari satu." className="lg:col-span-2" table={distTable(s.tempat_beli)}>
          <RankedBars rows={s.tempat_beli} label="label" value="pct" format={P} color="var(--series-2)" highlight={substantive} tip={tip()} />
        </ChartCard>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Alasan belum membeli non-BBM di SPBU" note={`Responden yang tidak membeli dalam 30 hari terakhir (n = ${n(s.n_tidak_beli)}).`} table={distTable(s.nonbbm.alasan_tidak, s.n_tidak_beli)}>
          <RankedBars rows={s.nonbbm.alasan_tidak} label="label" value="pct" format={P} highlight={substantive} tip={tip(s.n_tidak_beli)} />
        </ChartCard>
        <ChartCard title="Layanan non-BBM yang diketahui ada di SPBU langganan" note="Kesadaran, bukan pemakaian." table={distTable(s.nonbbm.diketahui)}>
          <RankedBars rows={s.nonbbm.diketahui} label="label" value="pct" format={P} highlight={substantive} tip={tip()} />
        </ChartCard>
      </div>

      {/* ------------------------------------------------ waktu & cara */}
      <h2 className="mb-3 mt-8 text-base font-semibold">Waktu, cara akses, dan syarat</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Waktu tambahan yang bersedia diluangkan" table={distTable(s.kunjungan.waktu_tambahan)}>
          <RankedBars rows={s.kunjungan.waktu_tambahan} label="label" value="pct" format={P} color="var(--series-2)" highlight={substantive} tip={tip()} />
        </ChartCard>
        <ChartCard title="Lama antre pada kunjungan terakhir" table={distTable(s.kunjungan.antre)}>
          <RankedBars rows={s.kunjungan.antre} label="label" value="pct" format={P} tip={tip()} />
        </ChartCard>
        <ChartCard title="Cara akses yang paling nyaman" table={distTable(s.permintaan.cara_akses)}>
          <RankedBars rows={s.permintaan.cara_akses} label="label" value="pct" format={P} tip={tip()} />
        </ChartCard>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Syarat agar mau memakai layanan tambahan" note="Boleh pilih lebih dari satu." table={distTable(s.permintaan.faktor)}>
          <RankedBars rows={s.permintaan.faktor} label="label" value="pct" format={P} highlight={substantive} tip={tip()} />
        </ChartCard>
        <ChartCard title="Aktivitas setelah mengisi BBM" note="Kunjungan terakhir." table={distTable(s.kunjungan.setelah_isi)}>
          <RankedBars rows={s.kunjungan.setelah_isi} label="label" value="pct" format={P} tip={tip()} />
        </ChartCard>
      </div>

      {/* ------------------------------------------------ implikasi */}
      <h2 className="mb-3 mt-8 text-base font-semibold">Implikasi untuk rekomendasi</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Insight tone="good">
          <strong>Ban, nitrogen, dan kebutuhan darurat</strong> adalah layanan paling diinginkan ({P(s.permintaan.bermanfaat[0].pct)} bermanfaat, {P(s.permintaan.prioritas[0].pct)} prioritas) dan {P(ban?.luar ?? 0)} responden membelinya di luar SPBU dalam 30 hari terakhir. Ini bukti sisi permintaan untuk <Link className="underline" href="/rekomendasi#A8">A8 (perawatan kendaraan self-service)</Link>, yang saat ini hanya Fill-in karena dinilai dari sisi pasokan saja.
        </Insight>
        <Insight tone="good">
          <strong>Makanan/minuman cepat</strong> diminati, dan kopi/minuman dibeli {n((kopi?.luar ?? 0) / Math.max(kopi?.spbu ?? 1, 1), 1)}× lebih sering di luar SPBU. Mendukung <Link className="underline" href="/rekomendasi#A3">A3 (kios kopi & F&B mikro)</Link> dengan syarat format <em>grab-and-go</em>: {P(r.tidak_mau_tambah_waktu_pct)} tidak mau menambah waktu dan &ldquo;proses cepat&rdquo; adalah syarat nomor satu.
        </Insight>
        <Insight>
          <strong>Tempat istirahat</strong> masuk tiga besar, dan {n(r.ibadah_toilet_isian_bebas)} responden menulis sendiri toilet, musala, atau masjid di isian &ldquo;lainnya&rdquo;, meski tidak ada di daftar opsi. Menguatkan <Link className="underline" href="/rekomendasi#A9">A9 (fasilitas dasar)</Link>; sebaiknya di lantai dasar, bukan lantai 2 seperti <Link className="underline" href="/rekomendasi#A11">A11</Link>.
        </Insight>
        <Insight tone="warn">
          Titik paket online ({P(paket?.pct ?? 0)}) dan area kurir/ojol ({P(ojol?.pct ?? 0)}) nyaris tidak dipilih, dan {P(datang?.pct ?? 0)} lebih suka datang langsung daripada memesan via aplikasi. Responden survei ini bukan kurir, jadi permintaan untuk <Link className="underline" href="/rekomendasi#A4">A4 (parcel locker)</Link> perlu divalidasi lewat mitra logistik, bukan pengguna SPBU umum.
        </Insight>
      </div>

      {/* ------------------------------------------------ kota */}
      <h2 className="mb-3 mt-8 text-base font-semibold">Kota responden × data lahan Brightspace</h2>
      <ChartCard title="Kota SPBU yang paling sering dikunjungi" note={`Kota dengan ≥ 2 responden; ${n(kotaKecil.length)} kota lain dengan 1 responden ada di tombol Tabel. Bertanda * = berisi jawaban ambigu (mis. "Tangerang") yang dipetakan ke kota.`}
        table={kotaTable(s.kota)}>
        {kotaTable(s.kota.filter((k) => k.responden >= 2))}
      </ChartCard>
      {tanpaLahan.map((k) => (
        <p key={k.kabkota} className="mt-2 text-xs text-ink-2">{k.kabkota} punya {n(k.spbu)} SPBU di marketplace tetapi belum satu pun yang mencantumkan lahan, padahal {n(k.responden)} responden di sana menginginkan {k.layanan_teratas.toLowerCase()}. Kandidat pertama untuk perluasan listing.</p>
      ))}

      {/* ------------------------------------------------ profil */}
      <h2 className="mb-3 mt-8 text-base font-semibold">Profil responden</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Kendaraan yang paling sering dipakai">
          <SegmentedBar total={s.n} parts={[
            { label: "Sepeda motor", value: motor?.n ?? 0, color: "var(--series-1)" },
            { label: "Mobil pribadi", value: mobil?.n ?? 0, color: "var(--series-4)" },
            ...(lain ? [{ label: "Lainnya", value: lain, color: "var(--muted-mark)" }] : []),
          ]} />
          <div className="mt-5">{distTable(s.profil.bbm)}</div>
        </ChartCard>
        <ChartCard title="Frekuensi mengisi BBM" table={distTable(s.profil.frekuensi)}>
          <RankedBars rows={s.profil.frekuensi} label="label" value="pct" format={P} tip={tip()} />
        </ChartCard>
        <ChartCard title="Usia" table={distTable(s.profil.usia)}>
          <RankedBars rows={s.profil.usia} label="label" value="pct" format={P} highlight={substantive} tip={tip()} />
        </ChartCard>
      </div>
      <div className="mt-4">
        <ChartCard title="Alasan memilih SPBU langganan" note="Boleh pilih lebih dari satu." table={distTable(s.profil.alasan_spbu)}>
          <RankedBars rows={s.profil.alasan_spbu} label="label" value="pct" format={P} tip={tip()} />
        </ChartCard>
      </div>
      <p className="mt-4 text-xs text-ink-3">{s.sumber}. Data dinormalisasi dengan <code>normalize_perilaku.py</code> dan diringkas dengan <code>perilaku_dashboard.py</code>; aturan pemetaan kota dan opsi ada di <code>out/perilaku/kodebuku.json</code>.</p>
    </>
  );
}
