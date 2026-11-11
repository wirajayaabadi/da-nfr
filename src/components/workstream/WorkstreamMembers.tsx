'use client';

import { useCallback, useRef, useState } from 'react';
import type { Member } from '@/types/team';
import Avatar from '@/components/team/Avatar';
import MemberDetail from '@/components/team/MemberDetail';

/** Anggota kelompok kerja; "Lihat Profil" membuka panel profil yang sama dengan halaman utama. */
export default function WorkstreamMembers({ members }: { members: Member[] }) {
  const [selected, setSelected] = useState<Member | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setSelected(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  if (members.length === 0) {
    return <p className="text-sm text-muted">Belum ada anggota yang terdaftar di kelompok kerja ini.</p>;
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {members.map((member) => (
          <li key={member.id}>
            <article className="flex h-full items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card">
              <Avatar
                src={member.photo}
                name={member.name}
                sizes="80px"
                className="size-20 shrink-0 rounded-xl"
                initialsClassName="text-xl"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-base leading-snug font-bold text-ink">{member.name}</h3>
                <p className="mt-0.5 text-sm text-muted">{member.company}</p>
                <p className="text-sm text-subtle">{member.role}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setSelected(member);
                  }}
                  className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand-blue hover:text-brand-blue-strong"
                >
                  Lihat Profil<span className="sr-only"> {member.name}</span>
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10h10m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <MemberDetail member={selected} onClose={close} />
    </>
  );
}
