import Link from 'next/link';
import { members as allMembers } from '@/data/team';
import { accentClasses, getWorkgroup, hasLink } from '@/lib/team';
import type { DeliverableStatus, Workstream } from '@/types/workstream';
import WorkstreamToc from './WorkstreamToc';
import WorkstreamMembers from './WorkstreamMembers';

const SECTIONS = [
  { id: 'peran', label: 'Peran dalam ALP' },
  { id: 'kerangka', label: 'Kerangka kerja' },
  { id: 'temuan', label: 'Temuan' },
  { id: 'deliverable', label: 'Deliverable' },
  { id: 'kolaborasi', label: 'Kolaborasi' },
  { id: 'anggota-kelompok', label: 'Anggota' },
  { id: 'dokumen', label: 'Dokumen' },
] as const;

const STATUS: Record<DeliverableStatus, { label: string; className: string }> = {
  planned: { label: 'Direncanakan', className: 'bg-canvas text-muted ring-1 ring-line' },
  'in-progress': { label: 'Berjalan', className: 'bg-brand-blue-soft text-brand-blue-strong' },
  review: { label: 'Review mentor', className: 'bg-brand-red-soft text-brand-red-deep' },
  done: { label: 'Selesai', className: 'bg-brand-green-soft text-brand-green-strong' },
};

/** Halaman satu kelompok kerja: hero ringkas lalu bagian-bagian berdaftar isi. */
export default function WorkstreamView({ workstream: ws }: { workstream: Workstream }) {
  const group = getWorkgroup(ws.teamId);
  const accent = accentClasses[group.accent];
  const members = allMembers.filter((m) => m.teamId === ws.teamId);
  const done = ws.deliverables.filter((d) => d.status === 'done').length;

  return (
    <>
      {/* ================================ Hero ================================ */}
      <section aria-labelledby="ws-title" className="alp-board relative overflow-hidden bg-alp-ink pt-[var(--nav-h)] text-alp-bone">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-[-10%] size-[720px] rounded-full bg-[radial-gradient(closest-side,rgb(237_27_47/0.18),rgb(0_108_184/0.12)_50%,transparent)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:px-8 lg:py-20">
          <div>
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-alp-bone/60">
                <li>
                  <Link href="/" className="hover:text-white">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/#anggota" className="hover:text-white">
                    Kelompok Kerja
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-alp-bone/90">
                  {ws.title}
                </li>
              </ol>
            </nav>

            <p className="mt-8 inline-flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-alp-bone/80 uppercase">
              <span aria-hidden="true" className={`size-2 rounded-full ${accent.dot}`} />
              Kelompok Kerja · {group.name}
            </p>
            <h1 id="ws-title" className="mt-4 text-[2.5rem] leading-[1.02] font-extrabold tracking-[-0.035em] text-[#f4f1e8] sm:text-6xl lg:text-[4.5rem]">
              {ws.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-alp-bone/75 sm:text-lg">{ws.summary}</p>

            <div className="mt-8 max-w-xl rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
              <p className="text-xs font-bold tracking-[0.14em] text-brand-red uppercase">Pertanyaan kunci</p>
              <p className="mt-2 text-lg leading-snug font-semibold text-[#f4f1e8]">{ws.keyQuestion}</p>
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {[
                { value: members.length, label: 'Anggota' },
                { value: ws.framework.length, label: 'Tahap analisis' },
                { value: `${done}/${ws.deliverables.length}`, label: 'Deliverable selesai' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs font-medium tracking-[0.08em] text-alp-bone/55 uppercase">{stat.label}</dt>
                  <dd className="mt-1 text-3xl font-extrabold tracking-[-0.02em] text-[#f4f1e8]">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Alur analisis: ringkasan kerangka kerja */}
          <div className="rounded-[28px] bg-white/[0.05] p-6 ring-1 ring-white/10 backdrop-blur sm:p-8">
            <p className="text-xs font-bold tracking-[0.16em] text-alp-bone/60 uppercase">Alur analisis</p>
            <ol className="relative mt-6 space-y-5">
              <span aria-hidden="true" className="absolute top-4 bottom-4 left-[17px] w-px bg-gradient-to-b from-brand-red via-brand-blue to-brand-green opacity-60" />
              {ws.framework.map((step, i) => (
                <li key={step.title} className="relative flex items-start gap-4">
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-alp-ink text-sm font-bold text-[#f4f1e8] ring-1 ring-white/25">
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="font-semibold text-[#f4f1e8]">{step.title}</p>
                    <p className="mt-0.5 text-sm text-alp-bone/60">→ {step.output}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ================================ Isi ================================ */}
      <div className="bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-8 lg:py-20">
          <aside className="hidden lg:block">
            <WorkstreamToc sections={SECTIONS} />
          </aside>

          <div className="min-w-0 space-y-20">
            <Section id="peran" title="Peran dalam ALP" lead="Apa yang menjadi tanggung jawab kelompok kerja ini dalam proyek.">
              <ol className="grid gap-4 sm:grid-cols-2">
                {ws.role.map((item, i) => (
                  <li key={item} className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-card">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${accent.tag}`}>{i + 1}</span>
                    <p className="text-[15px] leading-relaxed text-ink">{item}</p>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="kerangka" title="Kerangka kerja" lead="Tahapan analisis beserta metode dan keluaran di setiap tahap.">
              <ol className="relative space-y-4">
                {ws.framework.map((step, i) => (
                  <li key={step.title} className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                      <span className="text-sm font-bold tracking-[0.2em] text-brand-red">{String(i + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-ink">{step.title}</h3>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{step.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {step.tools.map((tool) => (
                            <span key={tool} className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-ink">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-xl bg-canvas px-4 py-3 sm:w-48">
                        <p className="text-[11px] font-bold tracking-[0.12em] text-subtle uppercase">Keluaran</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{step.output}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="temuan" title="Temuan" lead="Insight utama dari analisis, beserta status validasinya.">
              {ws.findings.length > 0 ? (
                <ul className="grid gap-4 md:grid-cols-3">
                  {ws.findings.map((f) => (
                    <li key={f.title} className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card">
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                          f.status === 'validated' ? 'bg-brand-green-soft text-brand-green-strong' : 'bg-canvas text-muted ring-1 ring-line'
                        }`}
                      >
                        {f.status === 'validated' ? 'Tervalidasi' : 'Draf'}
                      </span>
                      <h3 className="mt-3 text-base font-bold text-ink">{f.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Belum ada temuan yang dicatat.</Empty>
              )}
            </Section>

            <Section id="deliverable" title="Deliverable" lead="Keluaran yang akan diserahkan kelompok kerja, beserta statusnya.">
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                  <p className="text-sm font-semibold text-ink">
                    {done} dari {ws.deliverables.length} selesai
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Progres deliverable"
                    aria-valuemin={0}
                    aria-valuemax={ws.deliverables.length}
                    aria-valuenow={done}
                    className="h-2 w-32 overflow-hidden rounded-full bg-canvas sm:w-48"
                  >
                    <div className="h-full rounded-full bg-brand-green" style={{ width: `${(done / Math.max(1, ws.deliverables.length)) * 100}%` }} />
                  </div>
                </div>
                <ul className="divide-y divide-line">
                  {ws.deliverables.map((d) => (
                    <li key={d.title} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-ink">{d.title}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-subtle">{d.due || 'Tanggal belum ditetapkan'}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATUS[d.status].className}`}>
                          {STATUS[d.status].label}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            <Section id="kolaborasi" title="Kolaborasi" lead="Masukan yang diterima dan keluaran yang diberikan kepada kelompok kerja lain.">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: 'Menerima dari', items: ws.inputs },
                  { title: 'Memberikan kepada', items: ws.outputs },
                ].map((col) => (
                  <div key={col.title} className="rounded-2xl border border-line bg-white p-5 shadow-card">
                    <h3 className="text-xs font-bold tracking-[0.12em] text-subtle uppercase">{col.title}</h3>
                    <ul className="mt-4 space-y-4">
                      {col.items.map((c) => {
                        const g = getWorkgroup(c.team);
                        return (
                          <li key={c.team}>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${accentClasses[g.accent].tag}`}>
                              <span aria-hidden="true" className={`size-1.5 rounded-full ${accentClasses[g.accent].dot}`} />
                              {g.name}
                            </span>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.note}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="anggota-kelompok" title="Anggota" lead={`Anggota ${group.name}.`}>
              <WorkstreamMembers members={members} />
            </Section>

            <Section id="dokumen" title="Dokumen" lead="Bahan kerja dan hasil analisis yang dapat dibuka.">
              {ws.documents.filter((d) => hasLink(d.href)).length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {ws.documents
                    .filter((d) => hasLink(d.href))
                    .map((doc) => (
                      <li key={doc.href}>
                        <a
                          href={doc.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 font-medium text-ink shadow-card hover:border-subtle/40"
                        >
                          {doc.title}
                          <span className="sr-only"> (membuka tab baru)</span>
                          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 12 12" className="shrink-0 text-subtle">
                            <path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </li>
                    ))}
                </ul>
              ) : (
                <Empty>Belum ada dokumen yang dibagikan.</Empty>
              )}
            </Section>

            <div className="border-t border-line pt-10">
              <Link
                href="/#anggota"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink shadow-card hover:bg-canvas"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M15 10H5m0 0 4-4m-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Kembali ke Anggota Tim
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ id, title, lead, children }: { id: string; title: string; lead: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-2xl leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-base text-muted">{lead}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-white/60 px-5 py-8 text-center text-sm text-muted">{children}</p>;
}
