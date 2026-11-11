import Link from "next/link";
import { data } from "@/lib/data";
import { n, pct, rp } from "@/lib/format";
import { DASHBOARD_HOME, DASHBOARD_PAGES } from "@/lib/routes";

/**
 * Jembatan dari halaman depan ALP ke dasbor analitik NFR. Angka utama dihitung dari data
 * yang sama dengan dasbor (src/data/analytics.json) sehingga selalu sinkron, lalu tombol
 * dan daftar halaman mengantar ke hasilnya.
 */
export default function AnalysisSection() {
  const o = data.overview;
  const alts = data.alternatives;
  const quick = alts.filter((a) => a.kuadran === "Quick Win").length;

  const stats = [
    { label: "Okupansi lahan nasional", value: pct(o.okupansi_pct), sub: `${n(o.lahan_tersewa)} dari ${n(o.lahan)} lahan tersewa` },
    { label: "Lahan kosong", value: n(o.lahan_tersedia), sub: `di ${n(o.spbu_dengan_lahan_kosong)} SPBU` },
    { label: "Potensi sewa belum terealisasi", value: `${rp(o.pendapatan_idle_estimasi)}/th`, sub: "tarif terpublikasi + estimasi median" },
    { label: "Alternatif inovasi", value: n(alts.length), sub: `${quick} Quick Win siap dijalankan` },
  ];

  return (
    <section id="analisis" aria-labelledby="analisis-title" className="bg-white pt-16 pb-16 sm:pt-24 sm:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-brand-blue uppercase sm:text-[13px]">Hasil Analisis · Non Fuel Retail</p>
            <h2 id="analisis-title" className="mt-3 text-3xl leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-[2.75rem]">
              Potret bisnis NFR
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              Kelompok kerja Business Analysis mengolah {n(o.spbu)} SPBU dan {n(o.lahan)} lahan komersial di marketplace Brightspace,
              master lahan NFR, dan survei perilaku konsumen menjadi temuan, {alts.length} alternatif inovasi pada Impact-Effort Matrix,
              kajian per alternatif, dan taksiran dampak ekonominya.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={DASHBOARD_HOME} className="alp-btn">
                Lihat Hasil Analisis
                <ArrowRight />
              </Link>
              <Link href="/rekomendasi" className="alp-btn alp-btn--outline">
                Rekomendasi inovasi
              </Link>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-subtle">
              Sumber: {data.generated_from}. Angka dihitung langsung dari data mentah; aturan pembersihannya ada di halaman Metodologi.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-canvas p-5 shadow-card sm:p-6">
                <dt className="text-xs font-semibold tracking-[0.06em] text-subtle uppercase">{s.label}</dt>
                <dd className="tnum mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl lg:text-[2.25rem]">{s.value}</dd>
                <dd className="mt-1 text-sm text-muted">{s.sub}</dd>
              </div>
            ))}
          </dl>
        </div>

        <nav aria-label="Halaman dasbor analitik" className="mt-12 border-t border-line pt-8">
          <p className="text-xs font-bold tracking-[0.12em] text-subtle uppercase">Jelajahi dasbor</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {DASHBOARD_PAGES.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink shadow-card transition-colors hover:border-brand-blue hover:text-brand-blue-strong"
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
