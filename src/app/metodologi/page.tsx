import { data } from "@/lib/data";
import { n, rp } from "@/lib/format";
import { PageHeader } from "@/components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="prose-sm mt-2 space-y-2 text-sm leading-6 text-ink-1">{children}</div>
    </section>
  );
}

export default function Page() {
  const o = data.overview, r = data.rules;
  return (
    <>
      <PageHeader title="Metodologi & kualitas data" lead="Bagaimana data dikumpulkan, dibersihkan, dan diubah menjadi skor rekomendasi. Semua langkah dapat direproduksi dengan skrip di repositori (brightspace_scraper.py dan analytics.py)." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Sumber data">
          <p>Marketplace publik <strong>brightspace.pertamina.com</strong> (Pertamina Patra Niaga), diambil pada 3 November 2026 tanpa login: daftar SPBU per kota (endpoint JSON), halaman detail SPBU (alamat, koordinat, fasilitas, area sekitar) dan daftar lahan per SPBU (kode, status, luas, daya, tarif, spesifikasi, outlet).</p>
          <p>Cakupan: {n(o.spbu)} SPBU, {n(o.lahan)} lahan, {n(o.area_sekitar_titik)} titik area sekitar, {n(o.kota)} kota/kabupaten. Data merefleksikan apa yang dipublikasikan pengelola SPBU di marketplace, bukan seluruh aset NFR Pertamina.</p>
        </Section>
        <Section title="Pembersihan">
          <ul className="list-disc space-y-1 pl-5">
            <li>Tarif bulanan disetahunkan (×12). Tarif di luar {rp(r.price_min)}–{rp(r.price_max)}/tahun ({n(data.price.outlier_dikeluarkan)} lahan) dianggap salah input dan dikeluarkan dari statistik harga; {n(data.price.tanpa_harga)} lahan tidak mencantumkan tarif.</li>
            <li>Luas &gt; {n(r.luas_max)} m² dikeluarkan dari statistik luas (salah satuan).</li>
            <li>Koordinat yang tersimpan tanpa titik desimal/tertukar ({n(o.koordinat_diperbaiki)} SPBU) direkonstruksi dengan kotak pembatas Indonesia dan ditandai.</li>
            <li>Provinsi diambil dari segmen terakhir alamat; {n(data.by_province.find((p) => p.provinsi === "Tidak diketahui")?.spbu ?? 0)} SPBU tanpa provinsi dikelompokkan sebagai “Tidak diketahui”.</li>
            <li>Deskripsi yang terenkripsi/acak di sumber dikosongkan.</li>
          </ul>
        </Section>
        <Section title="Segmentasi tenant">
          <p>Nama outlet (1.800+ variasi ejaan) dipetakan ke segmen lewat kata kunci, aturan pertama yang cocok menang, urutan: {r.segments.join(" → ")}. Lahan berstatus “Tersedia” menjadi “Kosong”; nama kosong/“Region X”/“Belum ada informasi brand” menjadi “Tidak terklasifikasi”; sisanya “Lainnya”.</p>
        </Section>
        <Section title="Skor Impact-Effort">
          <p><strong>Dampak (1–10)</strong> = 1 + 9 × (0,4 × skala + 0,3 × harga + 0,3 × strategis/10), dengan <em>skala</em> = log₁₀(jumlah lahan/SPBU terjangkau)/log₁₀(6.000), <em>harga</em> = level tarif relevan dibagi 3× median nasional (dibatasi 1), dan <em>strategis</em> = penilaian 1–10 atas kesesuaian dengan arah transisi energi, diversifikasi portofolio, dan daya ungkit jaringan.</p>
          <p><strong>Usaha (1–10)</strong> = 1 + 9 × (Σ komponen − 4)/8, dari empat komponen masing-masing 1 (ringan) – 3 (berat): capex, regulasi/perizinan, ketergantungan mitra, perubahan proses internal.</p>
          <p>Kuadran: dampak ≥ 6,5 dan usaha &lt; 5,5 = Quick Win; dampak ≥ 6,5 dan usaha ≥ 5,5 = Major Project; dampak &lt; 6,5 dan usaha &lt; 5,5 = Fill-in; sisanya Thankless Task. Komponen skala dan harga dihitung dari data; komponen strategis dan usaha adalah penilaian konsultan yang sengaja dibuat eksplisit agar bisa diperdebatkan dan dikalibrasi tim.</p>
        </Section>
        <Section title="Keterbatasan">
          <ul className="list-disc space-y-1 pl-5">
            <li>Potensi pendapatan idle untuk lahan tanpa tarif memakai median nasional: estimasi kasar, bukan proyeksi keuangan.</li>
            <li>Status “Tersewa/Tersedia” bergantung pada kedisiplinan pengelola memperbarui marketplace.</li>
            <li>Perbandingan okupansi dengan/tanpa data fasilitas dan area sekitar adalah korelasi; SPBU yang rajin mengisi data mungkin memang dikelola lebih baik.</li>
            <li>Tidak ada data traffic kendaraan, omzet tenant, atau biaya operasi; skor dampak karenanya berbasis sisi pasokan.</li>
          </ul>
        </Section>
        <Section title="Reproduksi">
          <pre className="overflow-x-auto rounded-md bg-plane p-3 text-xs">{`python brightspace_scraper.py        # scrape -> out/data.json
python analytics.py                  # agregasi -> nfr-dashboard/src/data/analytics.json
cd nfr-dashboard && npm run dev      # dashboard`}</pre>
        </Section>
      </div>
    </>
  );
}
