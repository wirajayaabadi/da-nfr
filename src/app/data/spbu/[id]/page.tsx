import type { Metadata } from "next";
import { SpbuDetail } from "@/components/spbu-detail";

export const metadata: Metadata = { title: "Detail SPBU" };

export default async function Page({ params }: PageProps<"/data/spbu/[id]">) {
  const { id } = await params;
  return <SpbuDetail id={id} />;
}
