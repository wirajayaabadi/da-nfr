import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteHeader from "@/components/navigation/SiteHeader";
import SiteFooter from "@/components/footer/SiteFooter";
import WorkstreamView from "@/components/workstream/WorkstreamView";
import { getWorkstream, workstreams } from "@/data/workstreams";

/** Hanya kelompok kerja yang sudah punya konten yang dibuatkan halaman; slug lain → 404. */
export function generateStaticParams() {
  return workstreams.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kelompok-kerja/[slug]">): Promise<Metadata> {
  const ws = getWorkstream((await params).slug);
  if (!ws) return {};
  return { title: `${ws.title} — ALP Pertamina`, description: ws.summary };
}

export default async function WorkstreamPage({ params }: PageProps<"/kelompok-kerja/[slug]">) {
  const ws = getWorkstream((await params).slug);
  if (!ws) notFound();

  return (
    <>
      <Suspense fallback={null}>
        <SiteHeader />
      </Suspense>
      <main>
        <WorkstreamView workstream={ws} />
      </main>
      <SiteFooter />
    </>
  );
}
