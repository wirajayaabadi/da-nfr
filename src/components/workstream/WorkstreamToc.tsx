'use client';

import { useActiveSection } from '@/hooks/useActiveSection';

interface Props {
  sections: ReadonlyArray<{ id: string; label: string }>;
}

/** Daftar isi yang menempel di sisi kiri; menandai bagian yang sedang dibaca. */
export default function WorkstreamToc({ sections }: Props) {
  const ids = sections.map((s) => s.id);
  const active = useActiveSection(ids);

  return (
    <nav aria-label="Daftar isi halaman" className="sticky top-[calc(var(--nav-h)+32px)]">
      <p className="text-xs font-bold tracking-[0.12em] text-subtle uppercase">Di halaman ini</p>
      <ul className="mt-4 space-y-1 border-l border-line">
        {sections.map((s) => {
          const current = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={current ? 'location' : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors ${
                  current ? 'border-brand-red font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
