import Link from "next/link";
import { data } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { Recommendations } from "@/components/recommendations";

const waves = [
  { title: "Gelombang 1 · 0–6 bulan", kuadran: "Quick Win", desc: "Pengungkit komersial tanpa capex besar: isi lahan kosong, rapikan tarif, standarkan format kios mikro, buka kemitraan locker. Target: okupansi +5 poin, 100% lahan bertarif." },
  { title: "Gelombang 2 · 6–24 bulan", kuadran: "Major Project", desc: "Program strategis dengan pilot 10–30 lokasi dulu: EV hub di lahan luar metro, micro-fulfillment di lahan besar, jaringan DOOH, PLTS kanopi, transformasi ruang ATM." },
  { title: "Gelombang 3 · opportunistik", kuadran: "Fill-in", desc: "Dijalankan bila kapasitas tim tersedia atau sebagai pelengkap program gelombang 1–2." },
  { title: "Ditunda", kuadran: "Thankless Task", desc: "Nilai kecil dibanding usahanya; evaluasi ulang bila ada perubahan konteks (mis. subsidi, regulasi baru)." },
] as const;

export default function Page() {
  return (
    <>
      <PageHeader title="Rekomendasi inovasi NFR" lead={<>Dua belas alternatif inovasi diturunkan dari temuan data lalu dinilai pada dua sumbu: <strong>dampak</strong> (skala pasar yang terjangkau, level tarif, nilai strategis) dan <strong>usaha</strong> (capex, regulasi, ketergantungan mitra, perubahan proses). Rumus skor ada di <Link className="underline" href="/metodologi">Metodologi</Link>.</>} />
      <Recommendations items={data.alternatives} />

      <h2 className="mb-3 mt-8 text-base font-semibold">Peta jalan yang diusulkan</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {waves.map((w) => (
          <section key={w.title} className="card p-4">
            <h3 className="font-semibold">{w.title}</h3>
            <p className="mt-1 text-xs text-ink-2">{w.desc}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {data.alternatives.filter((a) => a.kuadran === w.kuadran).map((a) => <li key={a.id}><span className="mr-1.5 text-ink-3">{a.id}</span>{a.nama}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
