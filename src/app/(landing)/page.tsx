import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "@/components/navigation/SiteHeader";
import ALPHero from "@/components/hero/ALPHero";
import AnalysisSection from "@/components/analysis/AnalysisSection";
import TeamSection from "@/components/team/TeamSection";
import MentorSpotlight from "@/components/mentors/MentorSpotlight";
import AssistantSection from "@/components/mentors/AssistantSection";
import SiteFooter from "@/components/footer/SiteFooter";

export const metadata: Metadata = {
  title: "ALP Pertamina — Action Learning Project",
  description:
    "Profil tim Action Learning Project (ALP) Pertamina dan hasil analisis Non Fuel Retail (NFR) SPBU dari data Brightspace.",
};

/** Halaman depan: hero ALP → hasil analisis NFR (pintu ke dasbor) → profil tim. */
export default function HomePage() {
  return (
    <>
      <a
        href="#analisis"
        className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white focus:translate-y-0"
      >
        Lewati ke hasil analisis
      </a>
      {/* Suspense: SiteHeader membaca pathname (aturan cacheComponents Next.js 16). */}
      <Suspense fallback={null}>
        <SiteHeader />
      </Suspense>
      <main>
        <ALPHero />
        <AnalysisSection />
        <TeamSection mentors={<MentorSpotlight />} assistants={<AssistantSection />} />
      </main>
      <SiteFooter />
    </>
  );
}
