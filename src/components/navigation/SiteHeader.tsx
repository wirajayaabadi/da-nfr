'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { site } from '@/config/site';
import { useActiveSection } from '@/hooks/useActiveSection';

const sectionIds = site.nav.map((item) => item.id);

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

const linkClass = (current: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors max-[359px]:px-2 sm:px-4 ${
    current ? 'bg-brand-blue-soft text-brand-blue-strong' : 'text-muted hover:bg-canvas hover:text-ink'
  }`;

export default function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === '/';
  const active = useActiveSection(sectionIds);
  // Bayangan header muncul setelah halaman digulir sedikit.
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 8,
    () => false,
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] border-b bg-white transition-[border-color,box-shadow] duration-200 ${
        scrolled ? 'border-line shadow-[0_1px_3px_rgb(16_24_40/0.06)]' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href={onHome ? '#beranda' : '/'} className="flex min-w-0 shrink-0 items-center gap-2 rounded-md min-[360px]:gap-3" aria-label={`${site.brand.projectName} Pertamina — ke beranda`}>
          <Image
            src={site.brand.logoSrc}
            alt={site.brand.logoAlt}
            width={site.brand.logoWidth}
            height={site.brand.logoHeight}
            priority
            className="h-5 w-auto min-[360px]:h-6 md:h-7"
          />
          <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-line min-[360px]:block" />
          <span className="shrink-0 text-sm font-bold leading-tight text-ink md:text-[15px]">
            <span className="sm:hidden">ALP</span>
            <span className="hidden sm:inline">{site.brand.projectName}</span>
          </span>
        </a>
        <nav aria-label="Navigasi utama">
          <ul className="flex items-center gap-0.5 min-[360px]:gap-1">
            {site.nav.map((item) => {
              // Di halaman lain, tautan bagian kembali ke halaman utama.
              const current = onHome && active === item.id;
              // Di layar sempit, logo sudah menjadi tautan ke beranda.
              return (
                <li key={item.id} className={item.id === 'beranda' ? 'hidden sm:block' : undefined}>
                  <a
                    href={onHome ? `#${item.id}` : `/#${item.id}`}
                    aria-current={current ? 'location' : undefined}
                    className={linkClass(current)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
            {site.pages.map((page) => {
              const current = pathname === page.href;
              return (
                <li key={page.href}>
                  <Link href={page.href} aria-current={current ? 'page' : undefined} className={linkClass(current)}>
                    <span className="sm:hidden">{page.shortLabel}</span>
                    <span className="hidden sm:inline">{page.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
