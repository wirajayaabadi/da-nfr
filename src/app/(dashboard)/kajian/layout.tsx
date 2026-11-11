import { KajianNav } from "@/components/kajian-nav";

export default function KajianLayout({ children }: LayoutProps<"/kajian">) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <KajianNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
