import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { kajian } from "@/lib/kajian";
import { KajianDetail } from "@/components/kajian-detail";

export function generateStaticParams() {
  return kajian.alternatif.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<"/kajian/[id]">): Promise<Metadata> {
  const { id } = await params;
  const a = kajian.alternatif.find((x) => x.id === id);
  return { title: a ? `Kajian ${a.id} · ${a.nama}` : "Kajian alternatif" };
}

export default async function Page({ params }: PageProps<"/kajian/[id]">) {
  const { id } = await params;
  if (!kajian.alternatif.some((a) => a.id === id)) notFound();
  return <KajianDetail id={id} />;
}
