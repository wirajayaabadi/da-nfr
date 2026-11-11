import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/config/site';

export default function SiteFooter() {
  const { title, projectName, program, period } = site.footer;

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <Image src={site.brand.logoSrc} alt={site.brand.logoAlt} width={site.brand.logoWidth} height={site.brand.logoHeight} className="h-6 w-auto" />
            <span aria-hidden="true" className="h-5 w-px bg-line" />
            <span className="text-sm font-bold text-ink">{title}</span>
          </div>
          <p className="mt-4 text-base font-semibold text-ink">{projectName}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{program}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-subtle md:items-end">
          <nav aria-label="Navigasi footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-muted">
              {site.nav.map((item) => (
                <li key={item.id}>
                  <a href={`/#${item.id}`} className="hover:text-ink">
                    {item.label}
                  </a>
                </li>
              ))}
              {site.pages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className="hover:text-ink">
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p>
            {site.brand.projectName} · {period}
          </p>
        </div>
      </div>
      <div aria-hidden="true" className="flex h-1">
        <span className="flex-1 bg-brand-red" />
        <span className="flex-1 bg-brand-blue" />
        <span className="flex-1 bg-brand-green" />
      </div>
    </footer>
  );
}
