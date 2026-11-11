'use client';

import { useEffect, useState } from 'react';

/** Mengembalikan id bagian yang sedang berada di area tengah layar. */
export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
