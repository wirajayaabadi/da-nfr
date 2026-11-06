import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DataExplorer } from "@/components/data-explorer";

export const metadata: Metadata = { title: "Data SPBU & lahan" };

export default function Page() {
  return (
    <>
      <PageHeader title="Data SPBU & lahan" lead="Semua SPBU dan lahan NFR hasil scrape Brightspace, ditambah kontrak dari master lahan bila file tersedia. Gunakan filter untuk menyaring, klik judul kolom untuk mengurutkan, klik nomor SPBU untuk membuka detail lengkapnya, dan unduh hasil saringan sebagai CSV. Filter tersimpan di URL sehingga bisa dibagikan." />
      <DataExplorer />
    </>
  );
}
