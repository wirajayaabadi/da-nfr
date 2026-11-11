'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { site } from '@/config/site';
import { members, workgroups } from '@/data/team';
import type { Member } from '@/types/team';
import TeamFilter, { type FilterValue } from './TeamFilter';
import MembersWheel from './MembersWheel';
import MemberDetail from './MemberDetail';

interface TeamSectionProps {
  /** Sorotan mentor, tampil paling awal. */
  mentors?: React.ReactNode;
  /** Asisten kelas, tampil setelah daftar anggota. */
  assistants?: React.ReactNode;
}

export default function TeamSection({ mentors, assistants }: TeamSectionProps) {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [selected, setSelected] = useState<Member | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const counts = useMemo(() => {
    const result = { all: members.length } as Record<FilterValue, number>;
    for (const g of workgroups) result[g.id] = members.filter((m) => m.teamId === g.id).length;
    return result;
  }, []);

  const visible = filter === 'all' ? members : members.filter((m) => m.teamId === filter);
  const groupName = workgroups.find((g) => g.id === filter)?.name;
  const wheelLabel = filter === 'all' ? `${members.length} Anggota` : (groupName ?? '');

  const changeFilter = useCallback((next: FilterValue) => {
    setFilter(next);
    // Roda baru dimulai dari cincin: kembali ke awal bagian anggota.
    requestAnimationFrame(() => document.getElementById('anggota')?.scrollIntoView({ block: 'start' }));
  }, []);

  const open = useCallback((member: Member, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelected(member);
  }, []);

  const close = useCallback(() => {
    setSelected(null);
    // Kembalikan fokus ke pemicu yang membuka panel.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <section id="tim" aria-labelledby="tim-title" className="bg-canvas pt-16 pb-16 sm:pt-24 sm:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.12em] text-brand-blue uppercase sm:text-[13px]">Profil Personel</p>
          <h2 id="tim-title" className="mt-3 text-3xl leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-4xl lg:text-[2.75rem]">
            {site.team.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{site.team.description}</p>
        </div>

        {mentors}
      </div>

      {/* Hero anggota: roda yang diputar dengan menggulir. */}
      <section aria-labelledby="anggota-title" className="mt-16 sm:mt-20">
        <MembersWheel
          members={visible}
          label={wheelLabel}
          onOpen={open}
          toolbar={
            <div className="w-[min(16rem,calc(100vw-2rem))]">
              <h3 id="anggota-title" className="text-lg leading-tight font-extrabold tracking-[-0.015em] text-ink sm:text-xl">
                {site.team.membersTitle}
              </h3>
              <p className="mt-1 mb-3 hidden text-sm leading-relaxed text-muted sm:block">{site.team.membersDescription}</p>
              <TeamFilter groups={workgroups} counts={counts} value={filter} onChange={changeFilter} />
              <p aria-live="polite" className="sr-only">
                Menampilkan {visible.length} anggota — {filter === 'all' ? 'semua tim' : groupName}
              </p>
            </div>
          }
        />
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{assistants}</div>

      <MemberDetail member={selected} onClose={close} />
    </section>
  );
}
